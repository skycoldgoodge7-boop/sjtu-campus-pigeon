import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key'));
};

// Create client only if configured
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client && isSupabaseConfigured()) {
    _client = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return _client;
}

// Channel name for real-time pigeon state
export const PIGEON_CHANNEL = 'pigeon-state';
