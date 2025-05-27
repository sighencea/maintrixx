// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Import directly from ESM-friendly CDN

let supabaseInstance = null;

const SUPABASE_URL = 'https://njubyuqpavmxqdokxftq.supabase.co'; // YOU MUST REPLACE THIS
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdWJ5dXFwYXZteHFkb2t4ZnRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjQxMTAsImV4cCI6MjA2Mzg0MDExMH0.LAoiywXkz-Cx9Y178j_YsPu8y7mETWN53tN4jKHo2Tw'; // YOU MUST REPLACE THIS

if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY' || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'CRITICAL ERROR: Supabase URL and/or Anon Key are still set to placeholder values or are missing in js/supabase-client.js. ' +
    'Please edit this file and replace them with your actual Supabase project credentials from Settings > API.'
  );
  const msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
  if (msgDiv) {
    const errDiv = document.createElement('div');
    errDiv.innerHTML = '<strong style="color: red;">Supabase client is not configured (missing credentials in js/supabase-client.js).</strong>';
    msgDiv.prepend(errDiv);
  }
} else {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized via ES Module import.');
  } catch (e) {
    console.error('Error during Supabase client initialization (ESM):', e);
    const msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
    if (msgDiv) {
        const errDiv = document.createElement('div');
        errDiv.innerHTML = '<strong style="color: red;">Error initializing Supabase client. Check console.</strong>';
        msgDiv.prepend(errDiv);
    }
  }
}

// Make the client instance globally available for other non-module scripts (like main.js for now)
window._supabase = supabaseInstance;
