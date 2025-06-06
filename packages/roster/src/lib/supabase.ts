import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced debugging for production
console.log('🔧 Supabase Configuration Check:');
console.log('URL present:', !!supabaseUrl);
console.log('Key present:', !!supabaseAnonKey);
console.log('Environment mode:', import.meta.env.MODE);

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase environment variables:
    - VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}
    - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}
    
    If you're seeing this in production, the GitHub Secrets may not be configured properly.`;

  console.error(errorMsg);
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Test connection on initialization (development only)
if (import.meta.env.DEV) {
  (async () => {
    try {
      const { error } = await supabase
        .from('musicians')
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('Supabase connection successful');
      }
    } catch (err: unknown) {
      console.error('Supabase connection failed:', err);
    }
  })();
}
