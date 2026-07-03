import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://stkpsqzarppimostbxah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0a3BzcXphcnBwaW1vc3RieGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MDMyODQsImV4cCI6MjA5NzE3OTI4NH0.fwurUnm6CdhDYNnj-e-ca_ecbSd70pe9wu6aQWPDSqI';

export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: { eventsPerSecond: 0 }
      },
      db: { schema: 'public' }
    })
  : ({} as SupabaseClient);
