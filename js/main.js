document.addEventListener('DOMContentLoaded', function () {
  // Sign-up Logic
  const signupForm = document.getElementById('signupForm');
  const signupMessage = document.getElementById('signupMessage');

  if (signupForm) {
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      signupMessage.textContent = ''; // Clear previous messages
      signupMessage.className = ''; // Clear previous classes

      const firstName = document.getElementById('signupFirstName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;

      if (!firstName || !email || !password) {
        signupMessage.textContent = 'Please fill in all required fields.';
        signupMessage.className = 'alert alert-warning';
        return;
      }
      if (password.length < 6) {
        signupMessage.textContent = 'Password must be at least 6 characters long.';
        signupMessage.className = 'alert alert-warning';
        return;
      }

      try {
        // Ensure Supabase client is available
        if (!window._supabase) {
          signupMessage.textContent = 'Supabase client not initialized. Check console.';
          signupMessage.className = 'alert alert-danger';
          console.error('Supabase client (window._supabase) is not available.');
          return;
        }

        const { data, error } = await window._supabase.auth.signUp(
          {
            email: email,
            password: password,
          },
          {
            data: { 
              first_name: firstName
              // If you add more fields to your sign-up form for profile data, pass them here:
              // last_name: document.getElementById('signupLastName').value, 
            }
          }
        );

        if (error) {
          signupMessage.textContent = 'Error: ' + error.message;
          signupMessage.className = 'alert alert-danger';
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          // This condition often means the user exists but email is not confirmed.
          // Supabase might return a user object with an empty identities array in this scenario.
          signupMessage.textContent = 'An account with this email already exists. If you haven\'t confirmed your email, please check your inbox for the confirmation link.';
          signupMessage.className = 'alert alert-info';
        } else if (data.user) {
          signupMessage.textContent = 'Sign-up successful! Please check your email to confirm your account.';
          signupMessage.className = 'alert alert-success';
          signupForm.reset(); // Clear the form
        } else {
          // Fallback for unexpected response structure, though data.user should generally be present on success
          signupMessage.textContent = 'Sign-up successful, but awaiting user confirmation. Please check your email.';
           signupMessage.className = 'alert alert-info';
        }
      } catch (catchError) {
        console.error('Sign-up catch error:', catchError);
        signupMessage.textContent = 'An unexpected error occurred. Please try again.';
        signupMessage.className = 'alert alert-danger';
      }
    });
  }

  // Placeholder for Login Logic (to be added in a later step)
  // const loginForm = document.getElementById('loginForm');
  // const loginMessage = document.getElementById('loginMessage');
  // if (loginForm) { /* ... */ }

});
