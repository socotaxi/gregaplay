import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

    // TODO: Invoke real video processing logic here
    return res.json({ message: 'Video processing started', eventId });
  } catch (error) {
    console.error('Error in /api/process-video:', error);
    return res.status(500).json({ error: 'Failed to initiate processing' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
