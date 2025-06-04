document.addEventListener('DOMContentLoaded', function () {
  // Form and Section Elements
  const signInForm = document.getElementById('signInForm');
  const signUpForm = document.getElementById('signUpForm');
  const signInMessage = document.getElementById('signInMessage');
  const signUpUserMessage = document.getElementById('signUpUserMessage');

  // New Section View and Toggle Container References
  const authToggleContainer = document.getElementById('authToggleContainer');
  const signInFormSectionView = document.getElementById('signInFormSectionView');
  const signUpFormSectionView = document.getElementById('signUpFormSectionView');

  // Account Type Selection Elements
  const accountTypeSelectionView = document.getElementById('accountTypeSelectionView');
  const accountTypeSelect = document.getElementById('accountTypeSelect');
  const accountTypeContinueButton = document.getElementById('accountTypeContinueButton');
  const userAccountInfoView = document.getElementById('userAccountInfoView');
  const agencySignupFormView = document.getElementById('agencySignupFormView');

  // Disable continue button initially
  if (accountTypeContinueButton) {
    accountTypeContinueButton.disabled = true;
  }

  // Resend Verification Modal Elements (IDs remain the same)
  const resendVerificationModalEl = document.getElementById('resendVerificationModal');
  const resendModal = resendVerificationModalEl ? new bootstrap.Modal(resendVerificationModalEl) : null;
  const resendEmailInputModal = document.getElementById('resendEmailInputModal');
  const resendEmailModalButton = document.getElementById('resendEmailModalButton');
  const resendFeedbackMessageModal = document.getElementById('resendFeedbackMessageModal');

  // Six Digit Code Modal Elements
  const sixDigitCodeModalEl = document.getElementById('sixDigitCodeModal');
  let sixDigitCodeModalInstance = null; // Initialize instance later
  const sixDigitCodeInput = document.getElementById('sixDigitCodeInput');
  const submitSixDigitCodeButton = document.getElementById('submitSixDigitCodeButton');
  const sixDigitCodeMessage = document.getElementById('sixDigitCodeMessage');


  // Initial View Setup - Updated for new section views
  if (signInFormSectionView && signUpFormSectionView) {
    signInFormSectionView.style.display = 'block'; // Show Sign In by default
    signUpFormSectionView.style.display = 'none';  // Hide Sign Up by default
    if (accountTypeSelectionView) accountTypeSelectionView.style.display = 'block'; // Show account type selection initially
    if (userAccountInfoView) userAccountInfoView.style.display = 'none';
    if (agencySignupFormView) agencySignupFormView.style.display = 'none';
    setupAuthToggle('signUp'); // Initially, display link to switch TO Sign Up
  }

  // Dynamic Year for Footer
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // New View Toggling Logic Function
  function setupAuthToggle(viewToShow) {
    if (!authToggleContainer) return;

    let promptKey, linkKey, linkId, nextViewToShow;

    if (viewToShow === 'signUp') {
      promptKey = 'authToggle.dontHaveAccount';
      linkKey = 'authToggle.signUpLinkText';
      linkId = 'switchToSignUpViewLink';
      nextViewToShow = 'signUp';
    } else {
      promptKey = 'authToggle.alreadyHaveAccount';
      linkKey = 'authToggle.signInLinkText';
      linkId = 'switchToSignInViewLink';
      nextViewToShow = 'signIn';
    }

    const promptText = typeof i18next !== 'undefined' ? i18next.t(promptKey) : promptKey;
    const linkText = typeof i18next !== 'undefined' ? i18next.t(linkKey) : linkKey;

    authToggleContainer.innerHTML = `
      <span class="text-muted me-2" data-i18n="${promptKey}">${promptText}</span>
      <a href="#" id="${linkId}" class="fw-bold text-decoration-none" data-i18n="${linkKey}">${linkText}</a>
    `;

    const newToggleLink = document.getElementById(linkId);
    if (newToggleLink) {
      newToggleLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (nextViewToShow === 'signUp') {
          if (signInFormSectionView) signInFormSectionView.style.display = 'none';
          if (signUpFormSectionView) {
            signUpFormSectionView.style.display = 'block';
            // Reset to account type selection step
            if (accountTypeSelectionView) accountTypeSelectionView.style.display = 'block';
            if (userAccountInfoView) userAccountInfoView.style.display = 'none';
            if (agencySignupFormView) agencySignupFormView.style.display = 'none';
            // Reset dropdown and button state
            if (accountTypeSelect) accountTypeSelect.value = '';
            if (accountTypeContinueButton) accountTypeContinueButton.disabled = true;
          }
          setupAuthToggle('signIn');
        } else { // Switching to Sign In
          if (signUpFormSectionView) signUpFormSectionView.style.display = 'none';
          if (signInFormSectionView) signInFormSectionView.style.display = 'block';
          // Reset dropdown and button state when switching away from sign-up view as well
          if (accountTypeSelect) accountTypeSelect.value = '';
          if (accountTypeContinueButton) accountTypeContinueButton.disabled = true;
          setupAuthToggle('signUp');
        }

        if (signInMessage) signInMessage.textContent = '';
        if (signUpUserMessage) signUpUserMessage.textContent = '';

        const resendModalEl = document.getElementById('resendVerificationModal');
        const resendModalInstance = bootstrap.Modal.getInstance(resendModalEl);
        if (resendModalInstance) {
          resendModalInstance.hide();
        }
        if (resendFeedbackMessageModal) {
             resendFeedbackMessageModal.textContent = '';
        }
      });
    }
  }

  // Account Type Selection Logic
  if (accountTypeSelect) {
    accountTypeSelect.addEventListener('change', function() {
      if (signUpUserMessage) { signUpUserMessage.textContent = ''; signUpUserMessage.className = '';}
      if (accountTypeContinueButton) {
        accountTypeContinueButton.disabled = this.value === "";
      }
    });
  }

  if (accountTypeContinueButton) {
    accountTypeContinueButton.addEventListener('click', function(event) {
      event.preventDefault();

      if (!accountTypeSelect || accountTypeSelect.value === "") {
        if (signUpUserMessage) {
          signUpUserMessage.textContent = i18next.t('mainJs.signup.selectAccountTypePrompt');
          signUpUserMessage.className = 'alert alert-warning';
        }
        return;
      }
      const selectedAccountType = accountTypeSelect.value;

      if (accountTypeSelectionView) accountTypeSelectionView.style.display = 'none';
      // Message cleared by dropdown change listener, but good to ensure
      if (signUpUserMessage) { signUpUserMessage.textContent = ''; signUpUserMessage.className = '';}


      if (selectedAccountType === 'user') {
        if (userAccountInfoView) userAccountInfoView.style.display = 'block';
        if (agencySignupFormView) agencySignupFormView.style.display = 'none';
      } else { // 'agency' or other valid types
        if (userAccountInfoView) userAccountInfoView.style.display = 'none';
        if (agencySignupFormView) agencySignupFormView.style.display = 'block';
      }
    });
  }

  // Sign-up Logic (ID of form is still 'signUpForm')
  if (signUpForm) {
    console.log('Sign-up form listener attached.');
    signUpForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      // Ensure this form submission is only for agency sign-up
      if (!agencySignupFormView || agencySignupFormView.style.display === 'none') {
        console.log('Sign up attempt ignored, agency form not visible.');
        return;
      }

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

      try {
        if (!window._supabase) { 
          if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.supabaseInitError');
            signUpUserMessage.className = 'alert alert-danger';
          }
          console.error('Supabase client not available for sign-up.'); 
          return; 
        }
        const { data, error } = await window._supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { first_name: firstName }
          }
        });
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
        } else if (data.user) {
          let firstNameDebugMessage = " (Debug: first_name NOT seen in user_metadata)";
          if (data.user.user_metadata && data.user.user_metadata.first_name) {
            firstNameDebugMessage = " (Debug: first_name '" + data.user.user_metadata.first_name + "' seen in user_metadata)";
          }

          // Generate 8-digit code and update profile
          const generatedCode = Math.floor(10000000 + Math.random() * 90000000).toString();
          const userId = data.user.id;

          try {
            const { error: profileError } = await window._supabase
              .from('profiles')
              .insert({ id: userId, verification_code: generatedCode }); // is_verified_by_code defaults to false in DB

            if (profileError) {
              console.error('Error saving verification code to profile during sign-up:', profileError);
              // Log this error, but proceed with user sign-up success message as auth.user was created.
              // The user will still get a verification email. The 6-digit code is an additional factor.
            } else {
              console.log('Successfully inserted verification code for user:', userId);
            }
          } catch (profileInsertException) {
            console.error('Exception during profile insert for verification code during sign-up:', profileInsertException);
          }

          if (data.user.identities && data.user.identities.length === 0) {
            if (signUpUserMessage) {
                signUpUserMessage.textContent = i18next.t('resendVerification.alertSignupEmailResent', { email: email }) + firstNameDebugMessage;
                signUpUserMessage.className = 'alert alert-info';
            }
            if (resendModal) resendModal.hide();
          } else {
            if (resendModal) resendModal.hide();
            if (signUpUserMessage) {
                signUpUserMessage.textContent = i18next.t('mainJs.signup.success') + firstNameDebugMessage;
                signUpUserMessage.className = 'alert alert-success';
            }
            signUpForm.reset();
          }
        } else {
          let firstNameDebugMessage = " (Debug: first_name NOT seen in user_metadata)";
          // It's unlikely user_metadata would be available here if data.user is not, but for consistency:
          if (data && data.user && data.user.user_metadata && data.user.user_metadata.first_name) {
             firstNameDebugMessage = " (Debug: first_name '" + data.user.user_metadata.first_name + "' seen in user_metadata)";
          }
          if (resendModal) resendModal.hide();
          if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.successUnexpected') + firstNameDebugMessage;
            signUpUserMessage.className = 'alert alert-info';
          }
        }
      } catch (e) { 
        console.error('Sign-up catch:', e); 
        if (signUpUserMessage) {
            signUpUserMessage.textContent = i18next.t('mainJs.signup.unexpectedError') + (e.message ? ': ' + e.message : '');
            signUpUserMessage.className = 'alert alert-danger';
        }
      }
    });
  }

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
          // signInMessage.textContent = i18next.t('mainJs.signIn.success'); // Clear previous success message
          // signInMessage.className = 'alert alert-success'; // Don't show success yet

          const userId = data.user.id;
          try {
            const { data: profile, error: profileError } = await window._supabase
              .from('profiles')
              .select('id, is_verified_by_code, verification_code, has_company_set_up, is_admin') // Fetched more fields
              .eq('id', userId)
              .single();

            if (profileError) {
              console.error('Error fetching profile from Supabase:', profileError);
              if (signInMessage) {
                signInMessage.textContent = i18next.t('mainJs.signIn.profileFetchFailed');
                signInMessage.className = 'alert alert-danger';
              }
              return;
            } else if (!profile) {
              console.warn('User profile not found for user_id:', userId);
              if (signInMessage) {
                signInMessage.textContent = i18next.t('mainJs.signIn.profileNotFound');
                signInMessage.className = 'alert alert-danger';
              }
              return;
            }

            if (profile.is_verified_by_code) {
              if (signInMessage) {
                signInMessage.textContent = i18next.t('mainJs.signIn.successVerificationDone'); // e.g. "Sign in successful. Checking account status..."
                signInMessage.className = 'alert alert-success';
              }
              // Check if company is set up
              if (profile.has_company_set_up === false) {
                // User is verified but company not set up
                localStorage.removeItem('onboardingComplete'); // Ensure it's not set
                window.location.href = 'pages/agency_setup_page.html';
              } else {
                // User is verified and company is set up
                localStorage.setItem('onboardingComplete', 'true');
                window.location.href = 'pages/dashboard.html';
              }
            } else {
              // Show 6-digit code modal
              if (signInMessage) signInMessage.textContent = ''; // Clear any previous sign-in messages

              if (!sixDigitCodeModalInstance && sixDigitCodeModalEl) {
                sixDigitCodeModalInstance = new bootstrap.Modal(sixDigitCodeModalEl);
              }

              if (sixDigitCodeModalInstance) {
                if (sixDigitCodeInput) sixDigitCodeInput.value = '';
                if (sixDigitCodeMessage) {
                  sixDigitCodeMessage.textContent = '';
                  sixDigitCodeMessage.className = '';
                }
                
                // Update modal title/description if needed, using data-i18n attributes is preferred
                // document.getElementById('sixDigitCodeModalLabel').textContent = i18next.t('sixDigitCodeModal.title');
                // sixDigitCodeModalEl.querySelector('.modal-body p').textContent = i18next.t('sixDigitCodeModal.description');

                sixDigitCodeModalInstance.show();

                // Ensure event listener is not duplicated if this path can be hit multiple times
                // For simplicity, remove and re-add, or use a flag.
                // A better approach for complex scenarios: define handler outside and manage it.
                const handleSubmitCode = async () => {
                  const enteredCode = sixDigitCodeInput ? sixDigitCodeInput.value : '';
                  if (!enteredCode || !/^\d{8}$/.test(enteredCode)) {
                    if (sixDigitCodeMessage) {
                      sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.invalidInput'); // Create i18n key
                      sixDigitCodeMessage.className = 'alert alert-warning';
                    }
                    return;
                  }

                  if (enteredCode.trim() === String(profile.verification_code).trim()) {
                    const { error: updateError } = await window._supabase
                      .from('profiles')
                      .update({ is_verified_by_code: true })
                      .eq('id', userId);

                    if (updateError) {
                      console.error('Error updating profile verification status:', updateError.message);
                      if (sixDigitCodeMessage) {
                        sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.updateError'); // Create i18n key
                        sixDigitCodeMessage.className = 'alert alert-danger';
                      }
                    } else {
                      if (sixDigitCodeMessage) {
                        sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.success'); // Create i18n key
                        sixDigitCodeMessage.className = 'alert alert-success';
                      }
                      if (sixDigitCodeModalInstance) sixDigitCodeModalInstance.hide();
                      
                      // Fetch updated profile to check has_company_set_up
                      const { data: updatedProfile, error: fetchError } = await window._supabase
                        .from('profiles')
                        .select('id, has_company_set_up, is_admin')
                        .eq('id', userId)
                        .single();

                      if (fetchError || !updatedProfile) {
                        console.error('Error fetching updated profile after 6-digit code verification:', fetchError);
                        if (signInMessage) {
                            signInMessage.textContent = i18next.t('mainJs.signIn.profileFetchFailedAfterVerification');
                            signInMessage.className = 'alert alert-warning';
                        }
                        // Fallback to dashboard to prevent user being stuck
                        localStorage.setItem('onboardingComplete', 'true');
                        window.location.href = 'pages/dashboard.html';
                      } else {
                        if (signInMessage) {
                           signInMessage.textContent = i18next.t('mainJs.signIn.verificationSuccessCheckStatus');
                           signInMessage.className = 'alert alert-success';
                        }
                        if (updatedProfile.has_company_set_up === false) {
                          localStorage.removeItem('onboardingComplete'); // Ensure it's not set
                          window.location.href = 'pages/agency_setup_page.html';
                        } else {
                          localStorage.setItem('onboardingComplete', 'true');
                          window.location.href = 'pages/dashboard.html';
                        }
                      }
                    }
                  } else {
                    if (sixDigitCodeMessage) {
                      sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.incorrectCode'); // Create i18n key
                      sixDigitCodeMessage.className = 'alert alert-danger';
                    }
                  }
                };
                
                // Manage event listener for submitSixDigitCodeButton
                // To prevent multiple listeners, clone and replace the button, or use a flag/remove first.
                // Simple approach: remove if exists, then add.
                if (submitSixDigitCodeButton) {
                    const newButton = submitSixDigitCodeButton.cloneNode(true);
                    submitSixDigitCodeButton.parentNode.replaceChild(newButton, submitSixDigitCodeButton);
                    newButton.addEventListener('click', handleSubmitCode);
                    // Update reference to the button if needed elsewhere, though here it's local to this scope.
                    // submitSixDigitCodeButton = newButton; // If it were a global/module-scoped variable
                }

              } else {
                console.error('Six digit code modal element not found or failed to initialize.');
                if (signInMessage) {
                    signInMessage.textContent = i18next.t('mainJs.signIn.modalError'); // Create i18n key
                    signInMessage.className = 'alert alert-danger';
                }
              }
            }
          } catch (fetchProfileError) {
            console.error('Catch block: Error fetching profile or during 6-digit code flow:', fetchProfileError.message);
            if (signInMessage) {
              signInMessage.textContent = i18next.t('mainJs.signIn.unexpectedProfileError'); // Create i18n key
              signInMessage.className = 'alert alert-danger';
            }
          }
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
  }

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

  // Global Sign Out Button Logic
  const globalSignOutButton = document.getElementById('globalSignOutButton');

  if (globalSignOutButton) {
    globalSignOutButton.addEventListener('click', async function(event) {
      event.preventDefault();
      console.log('Global sign out button clicked.');
      if (window._supabase) {
        try {
          const { error } = await window._supabase.auth.signOut();
          if (error) {
            console.error('Error signing out:', error.message);
            alert('Error signing out: ' + error.message); // Or handle more gracefully
          } else {
            console.log('User signed out successfully.');
            // Clear any session-related local storage if necessary (onboardingComplete is one example)
            localStorage.removeItem('onboardingComplete');
            // Redirect to login page (index.html)
            window.location.href = '../index.html'; // Assuming js/main.js is in js/ folder, so ../index.html
          }
        } catch (e) {
          console.error('Exception during sign out:', e);
          alert('An unexpected error occurred during sign out.');
        }
      } else {
        console.error('Supabase client not available for sign out.');
        alert('Supabase client not available. Cannot sign out.');
      }
    });
  } else {
    // This else block can be removed if pages without the button are expected.
    // For debugging during development, it can be useful.
    // console.log('Global sign out button not found on this page.');
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
