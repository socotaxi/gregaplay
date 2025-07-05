// api/process-video.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { eventId } = req.query;
  if (!eventId) {
    return res.status(400).json({ error: 'eventId requis dans la requête' });
  }

  try {
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('event_id', eventId)
      .order('created_at');

    if (videosError) throw videosError;
    if (!videos || videos.length === 0) {
      throw new Error('Aucune vidéo trouvée pour cet événement');
    }

    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `event_${eventId}_`));
    const listFile = path.join(tmpDir, 'list.txt');
    const fileList = [];

    for (const v of videos) {
      const { data: fileData, error: fileErr } = await supabase.storage
        .from('videos')
        .download(v.storage_path);

      if (fileErr) {
        return res.status(500).json({
          error: 'Erreur téléchargement vidéo',
          path: v.storage_path,
          details: fileErr.message || fileErr
        });
      }

      const filePath = path.join(tmpDir, path.basename(v.storage_path));
      const buffer = Buffer.from(await fileData.arrayBuffer());
      await fs.promises.writeFile(filePath, buffer);
      fileList.push(`file '${filePath.replace(/'/g, "'\\''")}'`);
    }

    await fs.promises.writeFile(listFile, fileList.join('\n'));

    const outputPath = path.join(tmpDir, 'final.mp4');

    await new Promise((resolve, reject) => {
      const ff = spawn(ffmpegPath, [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        outputPath
      ]);

      ff.stderr.on('data', d => console.log(`🎥 FFmpeg: ${d.toString()}`));
      ff.on('error', reject);
      ff.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });
    });

    const buffer = await fs.promises.readFile(outputPath);
    const storagePath = `final_videos/${eventId}.mp4`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: 'video/mp4'
      });

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

    return res.status(200).json({ message: '✅ Vidéo traitée', final_video_url: finalUrl });
  } catch (error) {
    console.error('❌ Erreur process-video:', error);
    return res.status(500).json({
      error: 'Erreur serveur',
      details: error.message
    });
  }
}
