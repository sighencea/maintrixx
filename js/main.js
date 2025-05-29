document.addEventListener('DOMContentLoaded', function () {
  // Sign-up Logic
  const signupForm = document.getElementById('signupForm');
  const signupMessage = document.getElementById('signupMessage');
  if (signupForm) {
    console.log('Sign-up form listener attached.');
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      signupMessage.textContent = ''; signupMessage.className = '';
      const firstName = document.getElementById('signupFirstName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;
      
      if (!firstName || !email || !password) { 
        signupMessage.textContent = i18next.t('mainJs.signup.fillFields');
        signupMessage.className = 'alert alert-warning';
        return; 
      }
      if (password.length < 6) { 
        signupMessage.textContent = i18next.t('mainJs.signup.passwordLength');
        signupMessage.className = 'alert alert-warning';
        return; 
      }

      // Store firstName before signUp attempt
      localStorage.setItem('pendingProfileUpdate_firstName', firstName); 

      try {
        if (!window._supabase) { 
          signupMessage.textContent = i18next.t('mainJs.signup.supabaseInitError'); 
          signupMessage.className = 'alert alert-danger';
          console.error('Supabase client not available for sign-up.'); 
          localStorage.removeItem('pendingProfileUpdate_firstName'); // Clear on error
          return; 
        }
        const { data, error } = await window._supabase.auth.signUp(
          { email: email, password: password },
          { data: { first_name: firstName } } // This metadata might be handled by Supabase triggers to populate profiles
        );
        if (error) { 
          signupMessage.textContent = i18next.t('mainJs.signup.errorMessage', { message: error.message }); 
          signupMessage.className = 'alert alert-danger'; 
          localStorage.removeItem('pendingProfileUpdate_firstName'); // Clear on error
        } else if (data.user && data.user.identities && data.user.identities.length === 0) { 
          signupMessage.textContent = i18next.t('mainJs.signup.accountExists'); 
          signupMessage.className = 'alert alert-info'; 
          localStorage.removeItem('pendingProfileUpdate_firstName'); // Clear if user already exists
        } else if (data.user) { 
          signupMessage.textContent = i18next.t('mainJs.signup.success'); 
          signupMessage.className = 'alert alert-success'; 
          signupForm.reset(); 
          // localStorage item remains for login to pick up
        } else { 
          signupMessage.textContent = i18next.t('mainJs.signup.successUnexpected'); 
          signupMessage.className = 'alert alert-info';
          localStorage.removeItem('pendingProfileUpdate_firstName'); // Clear on other outcomes
        }
      } catch (e) { 
        console.error('Sign-up catch:', e); 
        signupMessage.textContent = i18next.t('mainJs.signup.unexpectedError'); 
        signupMessage.className = 'alert alert-danger'; 
        localStorage.removeItem('pendingProfileUpdate_firstName'); // Clear on catch
      }
    });
  } else { console.error('signupForm not found'); }

  // Login Logic
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');
  if (loginForm) {
    console.log('Login form listener attached.');
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      loginMessage.textContent = ''; loginMessage.className = '';
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) { 
        loginMessage.textContent = i18next.t('mainJs.login.fillFields');
        loginMessage.className = 'alert alert-warning';
        return; 
      }
      try {
        if (!window._supabase) { 
          loginMessage.textContent = i18next.t('mainJs.login.supabaseInitError');
          loginMessage.className = 'alert alert-danger';
          console.error('Supabase client not available for login.'); return; 
        }
        const { data, error } = await window._supabase.auth.signInWithPassword({ email: email, password: password });
        
        if (error) { 
          loginMessage.textContent = i18next.t('mainJs.login.loginFailed', { message: error.message }); 
          loginMessage.className = 'alert alert-danger'; 
        } else if (data.user) {
          // Login successful
          const storedFirstName = localStorage.getItem('pendingProfileUpdate_firstName');
          if (storedFirstName) {
            console.log('Found pending first_name in localStorage:', storedFirstName); // DEBUG
            console.log('Attempting to update profile for user ID:', data.user.id, 'with first_name:', storedFirstName); // DEBUG
            const { error: updateError } = await window._supabase
              .from('profiles')
              .update({ first_name: storedFirstName })
              .eq('id', data.user.id);

            if (updateError) {
              console.error('Error updating profile first_name during login:', updateError.message);
              // Optionally, inform the user that updating their name failed but login was successful
            } else {
              console.log('Successfully updated profile first_name during login.');
            }
            localStorage.removeItem('pendingProfileUpdate_firstName'); // Clear item after attempt
          }

          loginMessage.textContent = i18next.t('mainJs.login.success');
          loginMessage.className = 'alert alert-success'; // Ensure success message is styled
          localStorage.setItem('onboardingComplete', 'true'); // Using this as a simple session flag proxy
          // Optionally reset form: loginForm.reset();
          window.location.href = 'pages/dashboard.html';
        } else { 
          loginMessage.textContent = i18next.t('mainJs.login.loginFailedCheckCredentials'); 
          loginMessage.className = 'alert alert-danger'; 
        }
      } catch (e) { 
        console.error('Login catch:', e); 
        loginMessage.textContent = i18next.t('mainJs.login.unexpectedError'); 
        loginMessage.className = 'alert alert-danger'; 
      }
    });
  } else { console.error('loginForm not found'); }
});

// Sidebar Toggler Logic
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggler = document.getElementById('sidebarToggler');
  const sidebarOverlay = document.querySelector('.sidebar-overlay'); // Get the overlay

  if (sidebar && sidebarToggler && sidebarOverlay) { // Check for overlay too
    sidebarToggler.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active'); // Toggle overlay's active class
    });

    // Optional: Close sidebar if overlay is clicked
    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }
});
