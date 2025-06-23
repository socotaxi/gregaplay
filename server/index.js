import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

app.post('/api/process-video', async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (supabase) {
      const { data: user, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      console.log('Processing requested by user', user?.user?.id, 'for event', eventId);
    } else {
      console.warn('Supabase client not configured. Skipping auth check.');
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Retrieve all videos for the event
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('event_id', eventId)
      .order('created_at');

    if (videosError) throw videosError;
    if (!videos || videos.length === 0) {
      throw new Error('No videos found for event');
    }

    // Prepare temporary working directory
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `event_${eventId}_`));
    const listFile = path.join(tmpDir, 'list.txt');
    const fileList = [];

    for (const v of videos) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from('videos')
        .download(v.storage_path);
      if (fileErr) throw fileErr;

      const filePath = path.join(tmpDir, path.basename(v.storage_path));
      const buffer = Buffer.from(await fileData.arrayBuffer());
      await fs.promises.writeFile(filePath, buffer);
      fileList.push(`file '${filePath.replace(/'/g, "'\\''")}'`);
    }

    await fs.promises.writeFile(listFile, fileList.join('\n'));

    // Run ffmpeg to concatenate videos
    const outputPath = path.join(tmpDir, 'final.mp4');
    await new Promise((resolve, reject) => {
      const ff = spawn('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        outputPath
      ]);
      ff.stderr.on('data', d => console.log(d.toString()));
      ff.on('error', reject);
      ff.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with ${code}`));
      });
    });

    // Upload final montage to Supabase storage
    const storagePath = `final_videos/${eventId}.mp4`;
    const fileStream = fs.createReadStream(outputPath);
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, fileStream, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(storagePath);
    const finalUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('events')
      .update({ final_video_url: finalUrl, status: 'done' })
      .eq('id', eventId);
    if (updateError) throw updateError;

    return res.json({ message: 'Video processed', final_video_url: finalUrl });
  } catch (error) {
    console.error('Error in /api/process-video:', error);
    return res.status(500).json({ error: 'Failed to initiate processing' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
