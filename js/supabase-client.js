// js/supabase-client.js

const SUPABASE_URL = 'https://njubyuqpavmxqdokxftq.supabase.co'; // YOU MUST REPLACE THIS
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdWJ5dXFwYXZteHFkb2t4ZnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjQxMTAsImV4cCI6MjA2Mzg0MDExMH0.LAoiywXkz-Cx9Y178j_YsPu8y7mETWN53tN4jKHo2Tw'; // YOU MUST REPLACE THIS

// Enhanced check to be more explicit about placeholder values
if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'CRITICAL ERROR: Supabase URL and/or Anon Key are still set to placeholder values or are missing in js/supabase-client.js. ' +
    'Please edit this file and replace them with your actual Supabase project credentials from Settings > API.'
  );
  // Display a more prominent error to the user on the page itself
  const  msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
  if(msgDiv) {
    const errDiv = document.createElement('div');
    errDiv.innerHTML = '<strong style="color: red;">Supabase client is not configured. Please check the console. YOU need to add your API keys to js/supabase-client.js.</strong>';
    msgDiv.prepend(errDiv);
  }
}

try {
  // The Supabase class should be available globally if the CDN script was loaded first.
  // Check if Supabase is defined before trying to use it.
  if (typeof Supabase === 'undefined' || !Supabase || !Supabase.createClient) {
    console.error('Supabase library (Supabase) is not defined. Check CDN script link and order in HTML.');
    const  msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
    if(msgDiv) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = '<strong style="color: red;">Supabase library not loaded. Check HTML script order and console.</strong>';
        msgDiv.prepend(errDiv);
    }
    // To prevent further errors, we can't initialize the client.
    // Assign a mock or null to window._supabase if needed by other parts of the code to prevent breaking.
    window._supabase = null; 
  } else {
    const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._supabase = supabase; 
    console.log('Supabase client initialization attempted. If credentials are placeholders, it will not connect.');
  }
} catch (e) {
  console.error('Error during Supabase client initialization attempt:', e);
  window._supabase = null; // Ensure it's null if initialization failed
}
