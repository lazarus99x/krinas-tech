import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Credentials for Vite
const SUPABASE_URL: string = 'https://stkpsqzarppimostbxah.supabase.co';
const SUPABASE_ANON_KEY: string = 'sb_publishable_eLDMsAKKE3OMsxQjnJWLXA_lhriDbpr';

export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
};

// Initialize the Supabase client with auth persistence enabled
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : ({} as SupabaseClient);