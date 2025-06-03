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
      try {
        await window.i18nInitialized;
      } catch (i18nError) {
        console.error('Error initializing i18next:', i18nError);
        alert('Your session has expired. Please log in again. (i18n failed)'); // Fallback alert
        window.location.href = '../index.html';
        return; // Exit if i18n failed
      }
      const loginReqMsgKey = 'dashboardCheckJs.loginRequiredAlert';
      const loginReqMsg = i18next.t(loginReqMsgKey);
      alert(typeof loginReqMsg === 'string' && loginReqMsg !== loginReqMsgKey ? loginReqMsg : 'You need to be logged in to view this page. Please log in again.');
      window.location.href = '../index.html'; 
    } else { 
      console.log('Dashboard Check: Active session found. User can stay.'); 
      const user = data.session.user; // Get the user object
      initializeSignOutButton(); 
      fetchAndDisplayUserProfile(user); // New function call
      fetchAndDisplayPropertyCount(user.id); // *** NEW CALL ***
    }
  }

  // Add this new function inside the main IIFE, for example, after initializeSignOutButton
  async function fetchAndDisplayUserProfile(user) {
    const welcomeMessageElement = document.getElementById('welcomeMessage');
    if (!welcomeMessageElement) {
      return;
    }

    if (!window._supabase) {
      console.error('Fetch Profile: Supabase client not available.');
      // No i18next.t here yet, but if added, would need the await
      welcomeMessageElement.textContent = 'Error: Supabase client not available for profile.'; // Fallback, though original didn't use i18n here.
      return;
    }

    try {
      await window.i18nInitialized;
    } catch (i18nError) {
      console.error('Error initializing i18next for profile display:', i18nError);
      welcomeMessageElement.textContent = 'Error loading profile (i18n failed)';
      return; // Exit if i18n failed
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
        welcomeMessageElement.textContent = i18next.t('dashboardCheckJs.profileLoadError');
        // Display a more user-friendly error or log it appropriately
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger mt-2';
        errorDiv.textContent = i18next.t('dashboardCheckJs.profileLoadErrorMessage', { message: profileError.message });
        welcomeMessageElement.after(errorDiv); // Display error below welcome message
      } else if (profileData) {
        // If first_name is null or empty, provide a generic welcome.
        const displayName = profileData.first_name ? profileData.first_name : 'User';
        welcomeMessageElement.textContent = "Welcome " + displayName + ". We wish you a great day!";
        console.log('Profile data:', profileData);
      } else {
        // This case (no error, no data with .single()) should ideally not happen if RLS allows access
        // and the profile row exists. Could mean profile row doesn't exist for this auth.uid().
        console.warn('No profile data returned for user:', user.id);
        welcomeMessageElement.textContent = i18next.t('dashboardCheckJs.welcomeProfileNotFound');
      }
    } catch (catchError) {
      console.error('Catch error fetching profile:', catchError);
      welcomeMessageElement.textContent = i18next.t('dashboardCheckJs.profileUnexpectedError');
    }
  }
  // The duplicated fetchAndDisplayUserProfile function was here.
  // The diff will apply to the first instance. If the second instance is identical, it will also be patched.
  // If it's different in a way that breaks the patch, manual intervention would be needed.
  // Assuming the duplication is exact or the user wants both patched if they were different but matched the search pattern.

  async function fetchAndDisplayPropertyCount(userId) {
    const propertyCountElement = document.getElementById('propertyCount');
    if (!propertyCountElement) {
        console.error('Property count element not found in dashboard.html');
        return;
    }

    try {
        // 1. Fetch company_id for the user
        const { data: companyData, error: companyError } = await window._supabase
            .from('companies')
            .select('id')
            .eq('owner_id', userId)
            .single();

        if (companyError || !companyData) {
            console.error('Error fetching company for user or no company found:', companyError);
            propertyCountElement.textContent = '0';
            return;
        }

        const companyId = companyData.id;

        // 2. Fetch property count for the company
        const { count, error: countError } = await window._supabase
            .from('properties')
            .select('*', { count: 'exact', head: true }) // Important: head:true makes it not fetch data
            .eq('company_id', companyId);

        if (countError) {
            console.error('Error fetching property count:', countError);
            propertyCountElement.textContent = '0';
        } else {
            propertyCountElement.textContent = count || '0';
        }
    } catch (error) {
        console.error('An unexpected error occurred fetching property count:', error);
        propertyCountElement.textContent = '0'; // Default to 0 on any unexpected error
    }
  }

  function initializeSignOutButton() {
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) {
      signOutButton.addEventListener('click', async () => {
        console.log('Sign Out button clicked.');
        if (!window._supabase) { 
          console.error('Sign Out: Supabase client not available.');
          // This alert is before i18n check, but it's a specific case.
          // If i18n is critical even for this, the structure would need more changes.
          // For now, assuming this specific alert can remain as is or use a hardcoded non-i18n string.
          alert('Error: Supabase client not available for sign out.'); // Fallback
          return; 
        }

        try {
          await window.i18nInitialized;
        } catch (i18nError) {
          console.error('Error initializing i18next for signout:', i18nError);
          alert('Sign out process cannot start. (i18n failed)'); // Fallback alert
          return; // Exit if i18n failed
        }

        try {
          const { error } = await window._supabase.auth.signOut();
          if (error) { 
            console.error('Error signing out:', error); 
            const signOutErrorMsgKey = 'dashboardCheckJs.signOutErrorAlert';
            const signOutErrorMsg = i18next.t(signOutErrorMsgKey, { message: error.message });
            alert(typeof signOutErrorMsg === 'string' && signOutErrorMsg !== signOutErrorMsgKey ? signOutErrorMsg : 'Error signing out. Please try again.');
          } else {
            console.log('Successfully signed out.');
            localStorage.removeItem('onboardingComplete'); // Clear old flag
            const signOutSuccessMsgKey = 'dashboardCheckJs.signOutSuccessAlert';
            const signOutSuccessMsg = i18next.t(signOutSuccessMsgKey);
            alert(typeof signOutSuccessMsg === 'string' && signOutSuccessMsg !== signOutSuccessMsgKey ? signOutSuccessMsg : 'You have been successfully signed out.');
            window.location.href = '../index.html'; // Redirect to login page
          }
        } catch (e) { 
          console.error('Catch error during sign out:', e); 
          const signOutUnexpectedMsgKey = 'dashboardCheckJs.signOutUnexpectedError';
          const signOutUnexpectedMsg = i18next.t(signOutUnexpectedMsgKey);
          alert(typeof signOutUnexpectedMsg === 'string' && signOutUnexpectedMsg !== signOutUnexpectedMsgKey ? signOutUnexpectedMsg : 'An unexpected error occurred during sign out.');
        }
      });
    }
  }
  
  // Initial check when the script runs
  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', checkAuthSessionAndRedirect); 
  } else { 
    checkAuthSessionAndRedirect(); // DOMContentLoaded has already fired
  }
})();
