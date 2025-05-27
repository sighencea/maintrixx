// js/supabase-client.js

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your actual Supabase anon key

if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL' || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Supabase URL and Anon Key are required. Please find the file js/supabase-client.js and update them with your project credentials from Supabase settings > API.');
}

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window._supabase = supabase; 
console.log('Supabase client initialized (or attempted to initialize with placeholder credentials). Ensure credentials are set in js/supabase-client.js.');
