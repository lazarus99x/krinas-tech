import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Credentials
const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzwepkqwpgzqpxrinowo.supabase.co';
const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_D8kNIvZx27fxBjYg7xx0BQ_K1XizSwC';

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