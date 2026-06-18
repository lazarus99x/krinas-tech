import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Credentials — reads from Vite env vars first, falls back to hardcoded
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel/Netlify env vars
const SUPABASE_URL: string = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://stkpsqzarppimostbxah.supabase.co';
const SUPABASE_ANON_KEY: string = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_eLDMsAKKE3OMsxQjnJWLXA_lhriDbpr';

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