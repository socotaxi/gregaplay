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

// Vérifier que ffmpeg est disponible AVANT de lancer le serveur
async function checkFfmpegAvailability() {
  return new Promise((resolve, reject) => {
    const check = spawn('ffmpeg', ['-version']);
    check.on('error', () => reject(new Error('❌ FFmpeg non trouvé dans PATH')));
    check.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg est disponible dans le système');
        resolve();
      } else {
        reject(new Error('❌ FFmpeg est inaccessible ou mal configuré'));
      }
    });
  });
}

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
      console.log('📦 Traitement demandé par utilisateur', user?.user?.id, 'pour event', eventId);
    } else {
      console.warn('⚠️ Supabase client non configuré. Authentification ignorée.');
    }

    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Récupération des vidéos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('storage_path')
      .eq('event_id', eventId)
      .order('created_at');

    if (videosError) throw videosError;
    if (!videos || videos.length === 0) {
      throw new Error('Aucune vidéo trouvée pour cet événement');
    }

    // Répertoire temporaire
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

    // Montage avec FFmpeg
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
        else reject(new Error(`ffmpeg a quitté avec le code ${code}`));
      });
    });

    // Upload vers Supabase
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

    return res.json({ message: '🎬 Vidéo traitée avec succès', final_video_url: finalUrl });
  } catch (error) {
    console.error('❌ Erreur dans /api/process-video:', error);
    return res.status(500).json({ error: 'Échec du traitement vidéo' });
  }
});

// Lancer le serveur seulement si ffmpeg est dispo
const PORT = process.env.PORT || 4000;
checkFfmpegAvailability()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Serveur API lancé sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
