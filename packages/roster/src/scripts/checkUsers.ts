import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
      console.error('❌ Error querying users:', error.message);
      return;
    }

    console.log('👥 Users found:', data?.length || 0);
    console.log('📋 User data:', data);

    if (!data || data.length === 0) {
      console.log(
        '⚠️  No users found! Please create users through your Supabase dashboard or admin interface.'
      );
      console.log('💡 Tip: Use the SQL editor in Supabase to create initial users.');
    }
  } catch (err) {
    console.error('❌ Script error:', err);
  }
}

checkUsers().finally(() => process.exit());
