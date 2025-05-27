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
        } catch (e) { 
          console.error('Catch error during sign out:', e); 
          alert('An unexpected error occurred during sign out.'); 
        }
      });
    } else { 
      console.warn('Sign Out button (signOutButton) not found on dashboard page.'); 
    }
  }
  
  // Initial check when the script runs
  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', checkAuthSessionAndRedirect); 
  } else { 
    checkAuthSessionAndRedirect(); // DOMContentLoaded has already fired
  }
})();
