document.addEventListener('DOMContentLoaded', function () {
  // Form and Message Elements
  const signupForm = document.getElementById('signupForm');
  const signupMessage = document.getElementById('signupMessage');
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  // Resend Verification Email UI Elements
  const resendVerificationSection = document.getElementById('resendVerificationSection');
  const resendEmailInput = document.getElementById('resendEmailInput');
  const resendEmailButton = document.getElementById('resendEmailButton');
  const resendFeedbackMessage = document.getElementById('resendFeedbackMessage');

  function showResendVerification(email, messageKey, messageType = 'alert-info') {
    if (resendVerificationSection && resendEmailInput) {
      // Clear previous main form messages first
      if (signupMessage) { signupMessage.textContent = ''; signupMessage.className = ''; }
      if (loginMessage) { loginMessage.textContent = ''; loginMessage.className = ''; }

      let targetMessageArea = signupMessage;
      const loginEmailField = document.getElementById('loginEmail');
      if (loginEmailField && loginEmailField.offsetParent !== null) {
         if (loginForm && loginForm.contains(document.activeElement) || (loginMessage && loginMessage.textContent !== '')) {
              targetMessageArea = loginMessage;
         }
      }

      if (messageKey && targetMessageArea) {
          targetMessageArea.textContent = i18next.t(messageKey);
          targetMessageArea.className = `alert ${messageType}`;
      } else if (messageKey && signupMessage) {
         signupMessage.textContent = i18next.t(messageKey);
         signupMessage.className = `alert ${messageType}`;
      }

      resendEmailInput.value = email || '';
      resendVerificationSection.style.display = 'block';
      if (resendFeedbackMessage) {
         resendFeedbackMessage.textContent = '';
         resendFeedbackMessage.className = '';
      }
    }
  }

  function hideResendVerification() {
    if (resendVerificationSection) {
      resendVerificationSection.style.display = 'none';
    }
    if (resendFeedbackMessage) {
       resendFeedbackMessage.textContent = '';
       resendFeedbackMessage.className = '';
    }
  }

  // Sign-up Logic
  if (signupForm) {
    console.log('Sign-up form listener attached.');
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      hideResendVerification();
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
          if (error.message && (error.message.includes('User already registered') || error.message.includes('already registered'))) {
            showResendVerification(email, 'resendVerification.alertAccountExistsResend', 'alert-info');
          } else {
            signupMessage.textContent = i18next.t('mainJs.signup.errorMessage', { message: error.message });
            signupMessage.className = 'alert alert-danger';
          }
          localStorage.removeItem('pendingProfileUpdate_firstName');
        } else if (data.user) {
          // Case 2: No immediate error, and a user object exists.
          if (data.user.identities && data.user.identities.length === 0) {
            // This condition often means the user exists and is unconfirmed.
            // Supabase likely attempted an automatic resend of the confirmation email.
            signupMessage.textContent = i18next.t('resendVerification.alertSignupEmailResent', { email: email });
            signupMessage.className = 'alert alert-info';
            hideResendVerification(); // Ensure custom UI is hidden
            localStorage.removeItem('pendingProfileUpdate_firstName'); // Existing unconfirmed user
          } else {
            // This is a successful NEW signup or a signup where the user is immediately confirmed.
            hideResendVerification();
            signupMessage.textContent = i18next.t('mainJs.signup.success');
            signupMessage.className = 'alert alert-success';
            signupForm.reset();
            // localStorage item for first_name remains for login to pick up ONLY for new successful signups.
          }
        } else {
          // Case 3: No error, but also no user data (unexpected scenario).
          hideResendVerification();
          signupMessage.textContent = i18next.t('mainJs.signup.successUnexpected'); 
          signupMessage.className = 'alert alert-info';
          localStorage.removeItem('pendingProfileUpdate_firstName');
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
  if (loginForm) {
    console.log('Login form listener attached.');
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      hideResendVerification();
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
          if (error.message && (error.message.includes('Email not confirmed') || error.message.includes('Please confirm your email'))) {
            showResendVerification(email, 'resendVerification.alertEmailNotVerifiedResend', 'alert-info');
          } else {
            loginMessage.textContent = i18next.t('mainJs.login.loginFailed', { message: error.message });
            loginMessage.className = 'alert alert-danger';
          }
        } else if (data.user) {
          hideResendVerification();
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

  // Resend Verification Email Logic
  if (resendEmailButton) {
    resendEmailButton.addEventListener('click', async function() {
      const emailToResend = resendEmailInput.value;
      if (resendFeedbackMessage) {
         resendFeedbackMessage.textContent = '';
         resendFeedbackMessage.className = '';
      } else {
         console.error("resendFeedbackMessage element not found");
         return;
      }

      if (!emailToResend) {
        resendFeedbackMessage.textContent = i18next.t('resendVerification.feedbackMissingEmail');
        resendFeedbackMessage.className = 'alert alert-warning d-block';
        return;
      }

      try {
        if (!window._supabase) {
          resendFeedbackMessage.textContent = i18next.t('mainJs.signup.supabaseInitError');
          resendFeedbackMessage.className = 'alert alert-danger d-block';
          return;
        }

        const redirectTo = window.location.origin + '/pages/email-verified-success.html';

        const { error: resendError } = await window._supabase.auth.resend({
          type: 'signup',
          email: emailToResend,
          options: {
            emailRedirectTo: redirectTo
          }
        });

        if (resendError) {
          resendFeedbackMessage.textContent = i18next.t('resendVerification.feedbackError', { message: resendError.message });
          resendFeedbackMessage.className = 'alert alert-danger d-block';
        } else {
          resendFeedbackMessage.textContent = i18next.t('resendVerification.feedbackSuccess', { email: emailToResend });
          resendFeedbackMessage.className = 'alert alert-success d-block';
          // resendEmailInput.value = ''; // Optionally clear input
        }
      } catch (e) {
        console.error('Resend email catch:', e);
        resendFeedbackMessage.textContent = i18next.t('resendVerification.feedbackError', { message: e.message });
        resendFeedbackMessage.className = 'alert alert-danger d-block';
      }
    });
  }
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
