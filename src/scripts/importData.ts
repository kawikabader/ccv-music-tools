import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

// Log connection info without exposing sensitive data
console.log('Supabase configuration loaded successfully');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sample data for testing
const sampleMusicians = [
  { name: 'John Doe', instrument: 'Guitar', phone: '555-0101' },
  { name: 'Jane Smith', instrument: 'Piano', phone: '555-0102' },
  { name: 'Bob Johnson', instrument: 'Drums', phone: '555-0103' },
];

async function testConnection() {
  console.log('Testing Supabase connection...');

  try {
    const { data, error } = await supabase
      .from('musicians')
      .select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    console.log('Connection test successful!');
    return true;
  } catch (err) {
    console.error('Connection test error:', err);
    return false;
  }
}

async function importMusicians() {
  console.log('Starting musician import...');

  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('Cannot proceed with import - connection failed');
    process.exit(1);
  }

  // Use sample data
  const musicians = sampleMusicians;

  // Split musicians into chunks of 100 to avoid request size limits
  const chunkSize = 100;
  const musicianChunks = [];

  for (let i = 0; i < musicians.length; i += chunkSize) {
    musicianChunks.push(musicians.slice(i, i + chunkSize));
  }

  console.log(`Importing ${musicians.length} musicians in ${musicianChunks.length} chunks...`);

  let totalImported = 0;

  for (const chunk of musicianChunks) {
    const formattedMusicians = chunk.map(
      (musician: { name: string; instrument: string; phone: string }) => ({
        name: musician.name,
        instrument: musician.instrument || null,
        phone: musician.phone || null,
      })
    );

    const { data, error } = await supabase.from('musicians').insert(formattedMusicians).select();

    if (error) {
      console.error('Error importing chunk:', error);
      continue;
    }

    totalImported += data.length;
    console.log(`Imported ${data.length} musicians (Total: ${totalImported})`);
  }

  console.log(`Successfully imported ${totalImported} musicians`);
}

importMusicians()
  .catch(console.error)
  .finally(() => process.exit());
