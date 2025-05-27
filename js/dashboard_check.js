// js/dashboard_check.js
(async function() {
  // Ensure Supabase client is available (it should be loaded by ../js/supabase-client.js)
  // A small delay might be needed if supabase-client.js is also async and not yet run.
  // However, since both are modules now and supabase-client.js should execute first,
  // window._supabase should be available. A more robust way would be for supabase-client.js
  // to dispatch an event or for this script to import supabase client directly.
  // For now, let's assume window._supabase is ready or will be shortly.

  // Function to perform the check and redirect
  async function checkAuthSessionAndRedirect() {
    if (!window._supabase) {
      console.error('Dashboard Check: Supabase client (window._supabase) not available. Retrying...');
      // Retry mechanism or fail if not available after a few tries
      setTimeout(checkAuthSessionAndRedirect, 100); // Retry after 100ms
      return;
    }

    const { data, error } = await window._supabase.auth.getSession();

    if (error) {
      console.error('Dashboard Check: Error getting session:', error);
      // Potentially redirect to login even on error, as we can't confirm auth status
      window.location.href = '../index.html';
      return;
    }

    if (!data.session) {
      console.log('Dashboard Check: No active session found. Redirecting to login.');
      alert('You need to be logged in to view this page. Redirecting to login...');
      window.location.href = '../index.html'; 
    } else {
      console.log('Dashboard Check: Active session found. User can stay.');
      // User is authenticated, allow them to see the page.
      // We can also now implement the Sign Out button functionality here.
      initializeSignOutButton(); 
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
        } catch (catchError) {
          console.error('Catch error during sign out:', catchError);
          alert('An unexpected error occurred during sign out.');
        }
      });
    } else {
      console.warn('Sign Out button (signOutButton) not found on dashboard page.');
    }
  }
  
  // Initial check when the script runs
  // Wrap in DOMContentLoaded if we are manipulating elements that need to be loaded first (like adding sign out button listener)
  // However, the redirect should happen ASAP if not logged in.
  // The current structure of dashboard_check.js being loaded as a module at end of body for dashboard.html
  // means DOM should be ready or nearly ready.
  // Let's ensure it runs after DOM is fully parsed for button access.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthSessionAndRedirect);
  } else {
    checkAuthSessionAndRedirect(); // DOMContentLoaded has already fired
  }

})();
