// js/supabase-client.js

const SUPABASE_URL = 'https://njubyuqpavmxqdokxftq.supabase.co'; // Replace with your actual Supabase URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdWJ5dXFwYXZteHFkb2t4ZnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjQxMTAsImV4cCI6MjA2Mzg0MDExMH0.LAoiywXkz-Cx9Y178j_YsPu8y7mETWN53tN4jKHo2Tw'; // Replace with your actual Supabase anon key

if (!SUPABASE_URL || SUPABASE_URL === 'https://njubyuqpavmxqdokxftq.supabase.co' || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdWJ5dXFwYXZteHFkb2t4ZnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjQxMTAsImV4cCI6MjA2Mzg0MDExMH0.LAoiywXkz-Cx9Y178j_YsPu8y7mETWN53tN4jKHo2Tw') {
  console.error('Supabase URL and Anon Key are required. Please find the file js/supabase-client.js and update them with your project credentials from Supabase settings > API.');
}

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window._supabase = supabase; 
console.log('Supabase client initialized (or attempted to initialize with placeholder credentials). Ensure credentials are set in js/supabase-client.js.');
