import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ppikuvruvlzuwcpgpsyp.supabase.co'; // <-- modifie ici
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaWt1dnJ1dmx6dXdjcGdwc3lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNzU5NDcsImV4cCI6MjA2NTk1MTk0N30.RH6Hzr8HcemDt6w5PNhs_Lmri2mFk8kH5GtnxEsvfZU';                // <-- modifie ici

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSendEmail() {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: {
      email: 'test@exemple.comedhemrombhot@gmail.com',
      subject: 'Test Email depuis Supabase Edge Function',
      content: '<p>Bonjour Edhem, ceci est un test. ✅</p>',
    },
  });

  if (error) {
    console.error('❌ Échec de l’envoi :', error.message || error);
  } else {
    console.log('✅ Email envoyé avec succès !', data);
  }
}

testSendEmail();
