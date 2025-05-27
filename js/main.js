document.addEventListener('DOMContentLoaded', function () {
  // Sign-up Logic
  const signupForm = document.getElementById('signupForm');
  const signupMessage = document.getElementById('signupMessage');

  if (signupForm) {
    console.log('Sign-up form listener attached.'); // DEBUG
    signupForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      console.log('Sign-up form submitted.'); // DEBUG
      signupMessage.textContent = ''; 
      signupMessage.className = ''; 

      const firstName = document.getElementById('signupFirstName').value;
      const email = document.getElementById('signupEmail').value;
      const password = document.getElementById('signupPassword').value;

      console.log('Captured sign-up data:', { firstName, email }); // DEBUG (don't log password)

      if (!firstName || !email || !password) {
        signupMessage.textContent = 'Please fill in all required fields.';
        signupMessage.className = 'alert alert-warning';
        console.log('Validation failed: Missing fields.'); // DEBUG
        return;
      }
      if (password.length < 6) {
        signupMessage.textContent = 'Password must be at least 6 characters long.';
        signupMessage.className = 'alert alert-warning';
        console.log('Validation failed: Password too short.'); // DEBUG
        return;
      }

      try {
        if (!window._supabase) {
          signupMessage.textContent = 'Supabase client not initialized. Check console.';
          signupMessage.className = 'alert alert-danger';
          console.error('Supabase client (window._supabase) is not available during sign-up attempt.'); // DEBUG
          return;
        }
        console.log('Attempting Supabase sign-up with:', { email, first_name: firstName }); // DEBUG

        const { data, error } = await window._supabase.auth.signUp(
          { email: email, password: password },
          { data: { first_name: firstName } }
        );

        console.log('Supabase sign-up response:', { data, error }); // DEBUG

        if (error) {
          signupMessage.textContent = 'Error: ' + error.message;
          signupMessage.className = 'alert alert-danger';
        } else if (data.user && data.user.identities && data.user.identities.length === 0) {
          signupMessage.textContent = 'An account with this email already exists. If you haven\'t confirmed your email, please check your inbox for the confirmation link.';
          signupMessage.className = 'alert alert-info';
        } else if (data.user) {
          signupMessage.textContent = 'Sign-up successful! Please check your email to confirm your account.';
          signupMessage.className = 'alert alert-success';
          signupForm.reset();
        } else {
          signupMessage.textContent = 'Sign-up successful, but awaiting user confirmation (unexpected response structure). Please check your email.';
          signupMessage.className = 'alert alert-info';
        }
      } catch (catchError) {
        console.error('Sign-up catch error:', catchError); // DEBUG
        signupMessage.textContent = 'An unexpected error occurred. Please try again.';
        signupMessage.className = 'alert alert-danger';
      }
    });
  } else {
    console.error('Sign-up form (signupForm) not found.'); // DEBUG
  }

  // Placeholder for Login Logic (to be added in a later step)
  // const loginForm = document.getElementById('loginForm');
  // const loginMessage = document.getElementById('loginMessage');
  // if (loginForm) { /* ... */ }

});
