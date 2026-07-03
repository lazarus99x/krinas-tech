import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Service role key bypasses all RLS policies
const SUPABASE_URL = 'https://stkpsqzarppimostbxah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0a3BzcXphcnBwaW1vc3RieGFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTYwMzI4NCwiZXhwIjoyMDk3MTc5Mjg0fQ.03kZ0GNcsixXXS15gJy4fw7b_xiqGlHXOBBBWEq0p5k';

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