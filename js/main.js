document.addEventListener('DOMContentLoaded', function () {
  // Form and Section Elements
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const signInMessage = document.getElementById('signInMessage');
  const signUpUserMessage = document.getElementById('signUpUserMessage'); // Renamed

  const signInFormSection = document.getElementById('signInFormSection');
  const signUpFormSection = document.getElementById('signUpFormSection');
  const switchToSignUpLink = document.getElementById('switchToSignUpLink');
  const switchToSignInLink = document.getElementById('switchToSignInLink');

  // Resend Verification Modal Elements
  const resendVerificationModalEl = document.getElementById('resendVerificationModal');
  const resendModal = resendVerificationModalEl ? new bootstrap.Modal(resendVerificationModalEl) : null;
  const resendEmailInputModal = document.getElementById('resendEmailInputModal');
  const resendEmailModalButton = document.getElementById('resendEmailModalButton');
  const resendFeedbackMessageModal = document.getElementById('resendFeedbackMessageModal');

  // Initial View Setup
  if (signInFormSection && signUpFormSection) {
    signInFormSection.style.display = 'block'; // Show Sign In by default
    signUpFormSection.style.display = 'none';  // Hide Sign Up by default
  }

  // View Toggling Logic
  if (switchToSignUpLink) {
    switchToSignUpLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (signInFormSection) signInFormSection.style.display = 'none';
      if (signUpFormSection) signUpFormSection.style.display = 'block';
      if (signInMessage) signInMessage.textContent = '';
      if (signUpUserMessage) signUpUserMessage.textContent = '';
      if (resendModal) resendModal.hide();
      if (resendFeedbackMessageModal) resendFeedbackMessageModal.textContent = '';
    });
  }

  if (switchToSignInLink) {
    switchToSignInLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (signUpFormSection) signUpFormSection.style.display = 'none';
      if (signInFormSection) signInFormSection.style.display = 'block';
      if (signInMessage) signInMessage.textContent = '';
      if (signUpUserMessage) signUpUserMessage.textContent = '';
      if (resendModal) resendModal.hide();
      if (resendFeedbackMessageModal) resendFeedbackMessageModal.textContent = '';
    });
  }

  // Sign-up Logic (ID of form is still 'signUpForm')
  if (signUpForm) {
    console.log('Sign-up form listener attached.');
    signUpForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (resendModal) resendModal.hide(); // Hide modal on new submission attempt
      if (signUpUserMessage) { signUpUserMessage.textContent = ''; signUpUserMessage.className = '';}

      const firstName = document.getElementById('signUpFirstName').value;
      const email = document.getElementById('signUpEmail').value; // Use specific ID
      const password = document.getElementById('signUpPassword').value; // Use specific ID
      
      if (!firstName || !email || !password) { 
        if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.fillFields');
            signUpUserMessage.className = 'alert alert-warning';
        }
        return; 
      }
      if (password.length < 6) { 
        if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.passwordLength');
            signUpUserMessage.className = 'alert alert-warning';
        }
        return; 
      }

      localStorage.setItem('pendingProfileUpdate_firstName', firstName); 

      try {
        if (!window._supabase) { 
          if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.supabaseInitError');
            signUpUserMessage.className = 'alert alert-danger';
          }
          console.error('Supabase client not available for sign-up.'); 
          localStorage.removeItem('pendingProfileUpdate_firstName');
          return; 
        }
        const { data, error } = await window._supabase.auth.signUp(
          { email: email, password: password },
          { data: { first_name: firstName } }
        );
        if (error) {
          if (error.message && (error.message.includes('User already registered') || error.message.includes('already registered'))) {
            if (signUpUserMessage) {
               signUpUserMessage.textContent = i18next.t('resendVerification.alertAccountExistsResend');
               signUpUserMessage.className = 'alert alert-info';
            }
            if (resendEmailInputModal) resendEmailInputModal.value = email;
            if (resendFeedbackMessageModal) resendFeedbackMessageModal.textContent = '';
            if (resendModal) resendModal.show();
          } else {
            if (signUpUserMessage) {
                signUpUserMessage.textContent = i18next.t('mainJs.signup.errorMessage', { message: error.message });
                signUpUserMessage.className = 'alert alert-danger';
            }
          }
          localStorage.removeItem('pendingProfileUpdate_firstName');
        } else if (data.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            if (signUpUserMessage) {
                signUpUserMessage.textContent = i18next.t('resendVerification.alertSignupEmailResent', { email: email });
                signUpUserMessage.className = 'alert alert-info';
            }
            if (resendModal) resendModal.hide();
            localStorage.removeItem('pendingProfileUpdate_firstName');
          } else {
            if (resendModal) resendModal.hide();
            if (signUpUserMessage) {
                signUpUserMessage.textContent = i18next.t('mainJs.signup.success');
                signUpUserMessage.className = 'alert alert-success';
            }
            signupForm.reset();
          }
        } else {
          if (resendModal) resendModal.hide();
          if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.successUnexpected');
            signUpUserMessage.className = 'alert alert-info';
          }
          localStorage.removeItem('pendingProfileUpdate_firstName');
        }
      } catch (e) { 
        console.error('Sign-up catch:', e); 
        if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.unexpectedError');
            signUpUserMessage.className = 'alert alert-danger';
        }
        localStorage.removeItem('pendingProfileUpdate_firstName');
      }
    });
  } else { console.error('signUpForm not found'); }

  // Sign-In Logic (formerly loginForm, ID of form is 'signInForm')
  if (signInForm) {
    console.log('Sign-in form listener attached.');
    signInForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (resendModal) resendModal.hide();
      if (signInMessage) { signInMessage.textContent = ''; signInMessage.className = '';}

      const email = document.getElementById('signInEmail').value; // Use specific ID
      const password = document.getElementById('signInPassword').value; // Use specific ID

      if (!email || !password) { 
        if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.fillFields'); // Assumes mainJs.signIn keys
            signInMessage.className = 'alert alert-warning';
        }
        return; 
      }
      try {
        if (!window._supabase) { 
          if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.supabaseInitError'); // Assumes mainJs.signIn keys
            signInMessage.className = 'alert alert-danger';
          }
          console.error('Supabase client not available for sign-in.'); return;
        }
        const { data, error } = await window._supabase.auth.signInWithPassword({ email: email, password: password });
        
        if (error) {
          if (error.message && (error.message.includes('Email not confirmed') || error.message.includes('Please confirm your email'))) {
            if (signInMessage) {
                signInMessage.textContent = i18next.t('resendVerification.alertEmailNotVerifiedResend');
                signInMessage.className = 'alert alert-info';
            }
            if (resendEmailInputModal) resendEmailInputModal.value = email;
            if (resendFeedbackMessageModal) resendFeedbackMessageModal.textContent = '';
            if (resendModal) resendModal.show();
          } else {
            if (signInMessage) {
                signInMessage.textContent = i18next.t('mainJs.signIn.signInFailed', { message: error.message }); // Assumes mainJs.signIn keys
                signInMessage.className = 'alert alert-danger';
            }
          }
        } else if (data.user) {
          if (resendModal) resendModal.hide();
          const storedFirstName = localStorage.getItem('pendingProfileUpdate_firstName');
          if (storedFirstName) { // Profile update logic remains
            console.log('Found pending first_name in localStorage:', storedFirstName);
            console.log('Attempting to update profile for user ID:', data.user.id, 'with first_name:', storedFirstName);
            const { error: updateError } = await window._supabase
              .from('profiles')
              .update({ first_name: storedFirstName })
              .eq('id', data.user.id);

            if (updateError) {
              console.error('Error updating profile first_name during sign-in:', updateError.message);
            } else {
              console.log('Successfully updated profile first_name during sign-in.');
            }
            localStorage.removeItem('pendingProfileUpdate_firstName');
          }
          if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.success'); // Assumes mainJs.signIn keys
            signInMessage.className = 'alert alert-success';
          }
          localStorage.setItem('onboardingComplete', 'true');
          window.location.href = 'pages/dashboard.html';
        } else { 
          if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.signInFailedCheckCredentials'); // Assumes mainJs.signIn keys
            signInMessage.className = 'alert alert-danger';
          }
        }
      } catch (e) { 
        console.error('Sign-in catch:', e);
        if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.unexpectedError'); // Assumes mainJs.signIn keys
            signInMessage.className = 'alert alert-danger';
        }
      }
    });
  } else { console.error('signInForm not found'); }

  // Resend Verification Email Modal Logic
  if (resendEmailModalButton) {
    resendEmailModalButton.addEventListener('click', async function() {
      const emailToResend = resendEmailInputModal.value;
      if (resendFeedbackMessageModal) {
         resendFeedbackMessageModal.textContent = '';
         resendFeedbackMessageModal.className = '';
      } else {
         console.error("resendFeedbackMessageModal element not found");
         return;
      }

      if (!emailToResend) {
        if (resendFeedbackMessageModal) {
            resendFeedbackMessageModal.textContent = i18next.t('resendVerification.feedbackMissingEmail');
            resendFeedbackMessageModal.className = 'alert alert-warning d-block';
        }
        return;
      }

      try {
        if (!window._supabase) {
          if (resendFeedbackMessageModal) {
            resendFeedbackMessageModal.textContent = i18next.t('mainJs.signup.supabaseInitError'); // Generic enough
            resendFeedbackMessageModal.className = 'alert alert-danger d-block';
          }
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
          if (resendFeedbackMessageModal) {
            resendFeedbackMessageModal.textContent = i18next.t('resendVerification.feedbackError', { message: resendError.message });
            resendFeedbackMessageModal.className = 'alert alert-danger d-block';
          }
        } else {
          if (resendFeedbackMessageModal) {
            resendFeedbackMessageModal.textContent = i18next.t('resendVerification.feedbackSuccess', { email: emailToResend });
            resendFeedbackMessageModal.className = 'alert alert-success d-block';
          }
          // Optionally hide modal after a delay, or let user close it.
          // setTimeout(() => { if (resendModal) resendModal.hide(); }, 3000);
        }
      } catch (e) {
        console.error('Resend email modal catch:', e);
        if (resendFeedbackMessageModal) {
            resendFeedbackMessageModal.textContent = i18next.t('resendVerification.feedbackError', { message: e.message });
            resendFeedbackMessageModal.className = 'alert alert-danger d-block';
        }
      }
    });
  }
});

// Sidebar Toggler Logic (This remains unchanged and in its own DOMContentLoaded listener)
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
