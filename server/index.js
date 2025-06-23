// eslint-env node
/* global process, Buffer */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

// ➤ Charger les variables d'environnement
dotenv.config();

const envPath = path.resolve(process.cwd(), '.env');
console.log('📁 Working directory =', process.cwd());
console.log('📄 .env present ?', fs.existsSync(envPath));

const app = express();
app.use(cors());
app.use(express.json());

// ➤ Authentification via service role
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// ➤ Vérifie que ffmpeg est disponible
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

// ➤ Traitement de la vidéo
app.post('/api/process-video', async (req, res) => {
  const { eventId } = req.query;
  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId' });
  }

  try {
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

// ➤ Lancement du serveur uniquement si ffmpeg et supabase sont prêts
const PORT = process.env.PORT || 4000;

async function startServer() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('❌ Variables SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes');
  }
  await checkFfmpegAvailability();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur API lancé sur http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
