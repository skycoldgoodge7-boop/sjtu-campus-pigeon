import { createClient } from '@supabase/supabase-js';

// 🔑 硬编码配置（本地HTML可用，不走环境变量）
const SUPABASE_URL = 'https://ksbjrgjpjottykkogxvo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzYmpyZ2pwam90dHlra29neHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzYxMTEsImV4cCI6MjA5NTgxMjExMX0.sU6Fe-HAIp86hUkmaNX5Of7grrTTnXM7fHo9y6wpH50';

export const isSupabaseConfigured = (): boolean => {
  return !SUPABASE_ANON_KEY.includes('你的anon-key');
};

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!_client && isSupabaseConfigured()) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export const PIGEON_CHANNEL = 'pigeon-state';
