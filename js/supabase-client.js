// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Import directly from ESM-friendly CDN

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // YOU MUST REPLACE THIS (or ensure it's already correct)
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // YOU MUST REPLACE THIS (or ensure it's already correct)

let supabaseInstance = null;

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
