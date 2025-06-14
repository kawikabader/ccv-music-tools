import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check configuration
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase environment variables:
    - VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}
    
    If you're seeing this in production, the GitHub Secrets may not be configured properly.`;

  console.error(errorMsg);
  throw new Error('Missing Supabase environment variables');
}

// Create the most minimal Supabase client possible
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },
  global: {
    headers: {
      'x-disable-realtime': 'true',
    },
  },
});

// Helper function to get current session
export const getCurrentSession = () => {
  return supabase.auth.getSession();
};

// Helper function to get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

// Helper function to refresh session manually if needed
export const refreshSession = () => {
  return supabase.auth.refreshSession();
};
