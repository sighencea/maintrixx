// Function to update sidebar based on admin status
function updateSidebarForPermissions() {
  const isAdminString = localStorage.getItem('userIsAdmin');
  // Only hide links if userIsAdmin is explicitly 'false'.
  // If null/undefined (not logged in, or status not set), links remain visible.
  // Access control to pages themselves should be handled by dashboard_check.js or similar.
  if (isAdminString === 'false') {
    const navLinksToHide = [
      'dashboard.html',
      'properties.html',
      'staff.html'
      // 'tasks.html' should remain visible for non-admins
      // 'notifications.html' can remain visible for all
    ];

    navLinksToHide.forEach(href => {
      // Query for the <a> tag first
      const linkElement = document.querySelector(`.nav-menu li a[href="${href}"]`);
      if (linkElement && linkElement.parentElement) {
        // Then hide its parent <li> element
        linkElement.parentElement.style.display = 'none';
      }
    });
  }
}


document.addEventListener('DOMContentLoaded', function () {
  // Call updateSidebarForPermissions early to adjust UI based on stored admin status
  // This is especially relevant for pages loaded after login, like dashboard, tasks, etc.
  // On index.html, userIsAdmin might not be set yet, so it won't hide anything.
  updateSidebarForPermissions();

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

  // Language Selection Modal Elements
  const languageSelectionModalEl = document.getElementById('languageSelectionModal');
  const languageSelectDropdown = document.getElementById('languageSelectDropdown');
  const saveLanguagePreferenceButton = document.getElementById('saveLanguagePreferenceButton');
  let languageSelectionModalInstance = null;
  if (languageSelectionModalEl) {
    languageSelectionModalInstance = new bootstrap.Modal(languageSelectionModalEl);
  }
  let currentUserIdForLanguagePref = null;


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

  // Sign-In Logic
  if (signInForm) {
    console.log('Sign-in form listener attached.');
    signInForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (resendModal) resendModal.hide();
      if (signInMessage) { signInMessage.textContent = ''; signInMessage.className = '';}

      const email = document.getElementById('signInEmail').value;
      const password = document.getElementById('signInPassword').value;

      if (!email || !password) { 
        if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.fillFields');
            signInMessage.className = 'alert alert-warning';
        }
        return; 
      }
      try {
        if (!window._supabase) { 
          if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.supabaseInitError');
            signInMessage.className = 'alert alert-danger';
          }
          console.error('Supabase client not available for sign-in.'); return;
        }
        const { data: authData, error: authError } = await window._supabase.auth.signInWithPassword({ email: email, password: password });
        
        if (authError) {
          if (authError.message && (authError.message.includes('Email not confirmed') || authError.message.includes('Please confirm your email'))) {
            if (signInMessage) {
                signInMessage.textContent = i18next.t('resendVerification.alertEmailNotVerifiedResend');
                signInMessage.className = 'alert alert-info';
            }
            if (resendEmailInputModal) resendEmailInputModal.value = email;
            if (resendFeedbackMessageModal) resendFeedbackMessageModal.textContent = '';
            if (resendModal) resendModal.show();
          } else {
            if (signInMessage) {
                signInMessage.textContent = i18next.t('mainJs.signIn.signInFailed', { message: authError.message });
                signInMessage.className = 'alert alert-danger';
            }
          }
        } else if (authData.user) {
          if (resendModal) resendModal.hide();
          const userId = authData.user.id;

          // Fetch profile immediately after successful auth
          const { data: initialProfile, error: initialProfileError } = await window._supabase
            .from('profiles')
            .select('id, is_verified_by_code, verification_code, has_company_set_up, is_admin')
            .eq('id', userId)
            .single();

          if (initialProfileError || !initialProfile) {
            console.error('Error fetching initial profile or profile not found:', initialProfileError);
            if (signInMessage) {
              signInMessage.textContent = i18next.t('mainJs.signIn.profileFetchFailed');
              signInMessage.className = 'alert alert-danger';
            }
            return;
          }

          // Store isAdmin status early
          const isAdmin = initialProfile ? initialProfile.is_admin : false;
          localStorage.setItem('userIsAdmin', isAdmin.toString());
          updateSidebarForPermissions(); // Update sidebar immediately after setting admin status

          if (initialProfile.is_verified_by_code) {
            if (signInMessage) {
              signInMessage.textContent = i18next.t('mainJs.signIn.successVerificationDone');
              signInMessage.className = 'alert alert-success';
            }
            if (!isAdmin) {
                localStorage.setItem('onboardingComplete', 'true'); // Non-admins might not have company setup
                window.location.href = 'pages/tasks.html';
            } else { // isAdmin is true
                if (initialProfile.has_company_set_up === false) {
                    currentUserIdForLanguagePref = userId;
                    localStorage.removeItem('onboardingComplete');
                    if (languageSelectionModalInstance) languageSelectionModalInstance.show();
                } else {
                    localStorage.setItem('onboardingComplete', 'true');
                    window.location.href = 'pages/dashboard.html';
                }
            }
          } else {
            // Show 6-digit code modal
            if (signInMessage) signInMessage.textContent = '';

            if (!sixDigitCodeModalInstance && sixDigitCodeModalEl) {
              sixDigitCodeModalInstance = new bootstrap.Modal(sixDigitCodeModalEl);
            }

            if (sixDigitCodeModalInstance) {
              if (sixDigitCodeInput) sixDigitCodeInput.value = '';
              if (sixDigitCodeMessage) {
                sixDigitCodeMessage.textContent = '';
                sixDigitCodeMessage.className = '';
              }
              sixDigitCodeModalInstance.show();

              const handleSubmitCode = async () => {
                const enteredCode = sixDigitCodeInput ? sixDigitCodeInput.value : '';
                if (!enteredCode || !/^\d{8}$/.test(enteredCode)) {
                  if (sixDigitCodeMessage) {
                    sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.invalidInput');
                    sixDigitCodeMessage.className = 'alert alert-warning';
                  }
                  return;
                }

                if (enteredCode.trim() === String(initialProfile.verification_code).trim()) {
                  const { error: updateError } = await window._supabase
                    .from('profiles')
                    .update({ is_verified_by_code: true })
                    .eq('id', userId);

                  if (updateError) {
                    console.error('Error updating profile verification status:', updateError.message);
                    if (sixDigitCodeMessage) {
                      sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.updateError');
                      sixDigitCodeMessage.className = 'alert alert-danger';
                    }
                  } else {
                    if (sixDigitCodeMessage) {
                      sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.success');
                      sixDigitCodeMessage.className = 'alert alert-success';
                    }
                    if (sixDigitCodeModalInstance) sixDigitCodeModalInstance.hide();

                    // isAdmin status is already in localStorage from initialProfile fetch.
                    // Re-apply redirection logic based on isAdmin and has_company_set_up.
                    if (!isAdmin) { // isAdmin was determined from initialProfile
                        localStorage.setItem('onboardingComplete', 'true');
                        window.location.href = 'pages/tasks.html';
                    } else { // isAdmin is true
                        if (initialProfile.has_company_set_up === false) {
                            currentUserIdForLanguagePref = userId;
                            localStorage.removeItem('onboardingComplete');
                            if (languageSelectionModalInstance) languageSelectionModalInstance.show();
                        } else {
                            localStorage.setItem('onboardingComplete', 'true');
                            window.location.href = 'pages/dashboard.html';
                        }
                    }
                  }
                } else {
                  if (sixDigitCodeMessage) {
                    sixDigitCodeMessage.textContent = i18next.t('sixDigitCodeModal.incorrectCode');
                    sixDigitCodeMessage.className = 'alert alert-danger';
                  }
                }
              };

              if (submitSixDigitCodeButton) {
                  const newButton = submitSixDigitCodeButton.cloneNode(true);
                  submitSixDigitCodeButton.parentNode.replaceChild(newButton, submitSixDigitCodeButton);
                  newButton.addEventListener('click', handleSubmitCode);
              }
            } else {
              console.error('Six digit code modal element not found or failed to initialize.');
              if (signInMessage) {
                  signInMessage.textContent = i18next.t('mainJs.signIn.modalError');
                  signInMessage.className = 'alert alert-danger';
              }
            }
          }
        } else { 
          if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.signInFailedCheckCredentials');
            signInMessage.className = 'alert alert-danger';
          }
        }
      } catch (e) { 
        console.error('Sign-in catch:', e);
        if (signInMessage) {
            signInMessage.textContent = i18next.t('mainJs.signIn.unexpectedError');
            signInMessage.className = 'alert alert-danger';
        }
      }
    });
  }

  // Language Preference Modal Save Button Logic
  if (saveLanguagePreferenceButton) {
    saveLanguagePreferenceButton.addEventListener('click', async function(event) {
      event.preventDefault();
      const selectedLang = languageSelectDropdown ? languageSelectDropdown.value : 'en';

      if (!currentUserIdForLanguagePref) {
        console.error('User ID not available for saving language preference.');
        alert(i18next.t('mainJs.languageModal.saveError', { message: 'User ID missing.'}) || 'Could not save language preference: User ID missing.');
        return;
      }

      this.disabled = true;

      try {
        const { error: updateError } = await window._supabase
          .from('profiles')
          .update({ preferred_ui_language: selectedLang })
          .eq('id', currentUserIdForLanguagePref);

        if (updateError) {
          console.error('Error updating language preference:', updateError);
          alert(i18next.t('mainJs.languageModal.saveError', { message: updateError.message }) || `Failed to save language preference: ${updateError.message}`);
        } else {
          localStorage.setItem('preferredLang', selectedLang);
          if (window.i18next) {
            await window.i18next.changeLanguage(selectedLang);
          }
          if (languageSelectionModalInstance) languageSelectionModalInstance.hide();
          window.location.href = 'pages/agency_setup_page.html';
        }
      } catch (e) {
        console.error('Unexpected error saving language preference:', e);
        alert(i18next.t('mainJs.languageModal.unexpectedError', { message: e.message }) || `An unexpected error occurred: ${e.message}`);
      } finally {
        this.disabled = false;
        currentUserIdForLanguagePref = null;
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
            resendFeedbackMessageModal.textContent = i18next.t('mainJs.signup.supabaseInitError');
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
            alert('Error signing out: ' + error.message);
          } else {
            console.log('User signed out successfully.');
            localStorage.removeItem('onboardingComplete');
            localStorage.removeItem('userIsAdmin'); // Clear admin status on sign out
            window.location.href = '../index.html';
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
  }
});

// Sidebar Toggler Logic
document.addEventListener('DOMContentLoaded', function() {
  updateSidebarForPermissions(); // Also call here for pages that might not have the main auth logic DOM

  const sidebar = document.getElementById('sidebar');
  const sidebarToggler = document.getElementById('sidebarToggler');
  const sidebarOverlay = document.querySelector('.sidebar-overlay');

  if (sidebar && sidebarToggler && sidebarOverlay) {
    sidebarToggler.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay.addEventListener('click', function() {
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }
});
