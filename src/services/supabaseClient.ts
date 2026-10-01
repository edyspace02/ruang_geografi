import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const envUrl = url || (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl.startsWith('http')) {
    try {
      supabaseInstance = createClient(envUrl, envKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Gagal menginisialisasi Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}
