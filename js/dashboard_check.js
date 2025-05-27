// js/dashboard_check.js
(async function() {
  async function checkAuthSessionAndRedirect() {
    if (!window._supabase) {
      console.error('Dashboard Check: Supabase client not available. Retrying...');
      setTimeout(checkAuthSessionAndRedirect, 100); return;
    }
    const { data, error } = await window._supabase.auth.getSession();
    if (error) { 
      console.error('Dashboard Check: Error getting session:', error); 
      window.location.href = '../index.html'; 
      return; 
    }
    if (!data.session) {
      console.log('Dashboard Check: No active session found. Redirecting to login.');
      alert('You need to be logged in to view this page. Redirecting to login...');
      window.location.href = '../index.html'; 
    } else { 
      console.log('Dashboard Check: Active session found. User can stay.'); 
      const user = data.session.user; // Get the user object
      initializeSignOutButton(); 
      fetchAndDisplayUserProfile(user); // New function call
    }
  }

  function initializeSignOutButton() {
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) {
      signOutButton.addEventListener('click', async () => {
        console.log('Sign Out button clicked.');
        if (!window._supabase) { 
          console.error('Sign Out: Supabase client not available.');
          alert('Error: Supabase client not available for sign out.');
          return; 
        }
        try {
          const { error } = await window._supabase.auth.signOut();
          if (error) { 
            console.error('Error signing out:', error); 
            alert('Error signing out: ' + error.message); 
          } else {
            console.log('Successfully signed out.');
            localStorage.removeItem('onboardingComplete'); // Clear old flag
            alert('You have been successfully signed out.');
            window.location.href = '../index.html'; // Redirect to login page
          }
        } catch (e) { 
          console.error('Catch error during sign out:', e); 
          alert('An unexpected error occurred during sign out.'); 
        }
      });
    } else { 
      console.warn('Sign Out button (signOutButton) not found on dashboard page.'); 
    }
  }
  
  // Add this new function inside the main IIFE, for example, after initializeSignOutButton
  async function fetchAndDisplayUserProfile(user) {
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    if (!welcomeMessageElement) {
      console.error('Welcome message element (welcomeMessage) not found.');
      return;
    }

    if (!window._supabase) {
      console.error('Fetch Profile: Supabase client not available.');
      welcomeMessageElement.textContent = 'Could not load user profile (Supabase client error).';
      return;
    }

    console.log('Fetching profile for user ID:', user.id); // DEBUG

    try {
      const { data: profileData, error: profileError } = await window._supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .single();

      console.log('Supabase profile fetch response:', { profileData, profileError }); // DEBUG

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        welcomeMessageElement.textContent = 'Error loading your profile.';
        // Display a more user-friendly error or log it appropriately
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-2';
        errorDiv.textContent = 'Could not load profile: ' + profileError.message;
        welcomeMessageElement.after(errorDiv); // Display error below welcome message
      } else if (profileData) {
        // If first_name is null or empty, provide a generic welcome.
        const displayName = profileData.first_name ? profileData.first_name : 'User';
        welcomeMessageElement.textContent = `Welcome, ${displayName}! This is your new dashboard page.`;
        console.log('Profile data:', profileData);
      } else {
        // This case (no error, no data with .single()) should ideally not happen if RLS allows access
        // and the profile row exists. Could mean profile row doesn't exist for this auth.uid().
        console.warn('No profile data returned for user:', user.id);
        welcomeMessageElement.textContent = 'Welcome! Profile not found. This is your new dashboard page.';
      }
    } catch (catchError) {
      console.error('Catch error fetching profile:', catchError);
      welcomeMessageElement.textContent = 'An unexpected error occurred loading your profile.';
    }
  }

  // Initial check when the script runs
  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', checkAuthSessionAndRedirect); 
  } else { 
    checkAuthSessionAndRedirect(); // DOMContentLoaded has already fired
  }
})();
