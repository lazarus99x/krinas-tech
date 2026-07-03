import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://stkpsqzarppimostbxah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...DSqI';

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
