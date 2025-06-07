// js/set-password.js
document.addEventListener('DOMContentLoaded', () => {
    const setPasswordForm = document.getElementById('setPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const setPasswordBtn = document.getElementById('setPasswordBtn');
    const messageDiv = document.getElementById('setPasswordMessage');

    let supabase = window._supabase; // Expected to be initialized by supabase-client.js

    if (!supabase) {
        console.error('Supabase client not found. Make sure it is loaded and initialized before set-password.js');
        displayMessage('Critical error: Supabase client not available. Cannot set password.', true);
        if (setPasswordBtn) setPasswordBtn.disabled = true;
        return;
    }

    // Initialize i18n for this page if window.initI18n is available
    if (window.initI18n) {
        window.initI18n();
    } else {
        console.warn('initI18n function not found. Page translations might not apply.');
    }

    // Handle user state changes (e.g., when token from URL is processed)
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('onAuthStateChange event:', event, 'session:', session);
        if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
            // This event often fires after a recovery/invite link is used and user is ready to set a new password
            // Or after updateUser is successful.
            // No specific action needed here just from the event, form submission handles the update.
            // We could enable the form here if it was initially disabled.
            displayMessage('You can now set your new password.', false);
        } else if (event === 'SIGNED_IN' && session && session.user && session.user.recovery_sent_at) {
            // This might be another state indicating readiness for password update
            displayMessage('Please set your new password to complete your account setup.', false);
        } else if (event === 'SIGNED_IN' && session && session.user && !session.user.recovery_sent_at) {
            // If user is already fully signed in (e.g. token processed, password already set somehow)
            // displayMessage('You are already signed in. Redirecting...', false);
            // setTimeout(() => window.location.href = '../pages/dashboard.html', 2000);
            // For now, let them attempt to set password anyway, updateUser will handle if it's a valid session.
        }

        // Check if the user object contains an 'invited_at' timestamp
        // This is just for logging, actual password update doesn't depend on this.
        if (session && session.user) {
            console.log('User details:', session.user);
            if (session.user.invited_at) {
                 console.log('This user was invited at:', session.user.invited_at);
            }
        }
    });


    if (setPasswordForm) {
        setPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (setPasswordBtn) setPasswordBtn.disabled = true;
            clearMessage();

            const password = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!password || !confirmPassword) {
                displayMessage('Please fill in both password fields.', true, 'setPasswordPage.validation.bothFieldsRequired');
                if (setPasswordBtn) setPasswordBtn.disabled = false;
                return;
            }

            if (password.length < 6) {
                displayMessage('Password must be at least 6 characters long.', true, 'setPasswordPage.validation.passwordTooShort');
                if (setPasswordBtn) setPasswordBtn.disabled = false;
                return;
            }

            if (password !== confirmPassword) {
                displayMessage('Passwords do not match. Please try again.', true, 'setPasswordPage.validation.passwordsMismatch');
                if (setPasswordBtn) setPasswordBtn.disabled = false;
                return;
            }

            try {
                const { data, error } = await supabase.auth.updateUser({ password: password });

                if (error) {
                    console.error('Error updating password:', error);
                    displayMessage(`Error updating password: ${error.message}`, true);
                } else {
                    console.log('Password updated successfully:', data.user);
                    displayMessage('Password updated successfully! You can now sign in.', false, 'setPasswordPage.success.passwordUpdated');
                    // Optionally, redirect to login or dashboard after a delay
                    setTimeout(() => {
                        window.location.href = '../index.html'; // Redirect to login page
                    }, 3000);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                displayMessage('An unexpected error occurred. Please try again.', true);
            } finally {
                if (setPasswordBtn) setPasswordBtn.disabled = false;
            }
        });
    } else {
        console.error('Set password form not found.');
        displayMessage('Error: Password form not found on page.', true);
    }

    function displayMessage(message, isError, i18nKey = null) {
        if (messageDiv) {
            messageDiv.innerHTML = ''; // Clear previous messages
            const alertType = isError ? 'alert-danger' : 'alert-success';
            const messageText = i18nKey && window.i18next && window.i18next.exists(i18nKey)
                                ? window.i18next.t(i18nKey)
                                : message;
            messageDiv.innerHTML = `<div class="alert ${alertType}" role="alert">${messageText}</div>`;
        }
    }

    function clearMessage() {
        if (messageDiv) {
            messageDiv.innerHTML = '';
        }
    }
});
