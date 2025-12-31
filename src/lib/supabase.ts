import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zzluhirmmnkfkifriult.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bHVoaXJtbW5rZmtpZnJpdWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzc2MjgsImV4cCI6MjA2NzkxMzYyOH0.gA-8W9Jqaabow6ZqHyoMpKPJjd2ToomNoQIF-CeuG7c';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type { Database };
