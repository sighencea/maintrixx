// js/supabase-client.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Attempt to import credentials
let SUPABASE_URL;
let SUPABASE_ANON_KEY;
let supabaseInstance = null;
let configError = false;

try {
  // The './' is important for relative paths in ES modules
  const config = await import('./supabase-config.js');
  SUPABASE_URL = config.SUPABASE_URL;
  SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
} catch (e) {
  console.error(
    'CRITICAL ERROR: Failed to load supabase-config.js. ' +
    'Please ensure you have copied js/supabase-config.example.js to js/supabase-config.js ' +
    'and filled in your Supabase credentials. Details:', e
  );
  configError = true;
  // Display error on page
  const msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
  if (msgDiv) {
    const errDiv = document.createElement('div');
    errDiv.innerHTML = '<strong style="color: red;">Supabase configuration file (supabase-config.js) is missing or invalid. Please check console.</strong>';
    msgDiv.prepend(errDiv);
  }
}

if (!configError) {
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' ||
      !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.error(
      'CRITICAL ERROR: Supabase URL and/or Anon Key are missing or still set to placeholder values in js/supabase-config.js. ' +
      'Please edit js/supabase-config.js and replace them with your actual Supabase project credentials.'
    );
    configError = true;
    const msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
    if (msgDiv) {
      const errDiv = document.createElement('div');
      errDiv.innerHTML = '<strong style="color: red;">Supabase client is not configured (missing or placeholder credentials in js/supabase-config.js).</strong>';
      msgDiv.prepend(errDiv);
    }
  } else {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Supabase client initialized via ES Module import using supabase-config.js.');
    } catch (e) {
      console.error('Error during Supabase client initialization (ESM):', e);
      configError = true;
      const msgDiv = document.getElementById('signupMessage') || document.getElementById('loginMessage') || document.body;
      if (msgDiv) {
          const errDiv = document.createElement('div');
          errDiv.innerHTML = '<strong style="color: red;">Error initializing Supabase client. Check console.</strong>';
          msgDiv.prepend(errDiv);
      }
    }
  }
}

// Make the client instance globally available only if successfully initialized
if (!configError && supabaseInstance) {
  window._supabase = supabaseInstance;
} else {
  window._supabase = null; // Ensure it's null if setup failed
  console.warn('Supabase client initialization failed. window._supabase is not set.');
}
