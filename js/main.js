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

  // Login Logic
  const loginForm = document.getElementById('loginForm');
  const loginMessage = document.getElementById('loginMessage');

  if (loginForm) {
    console.log('Login form listener attached.'); // DEBUG
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      console.log('Login form submitted.'); // DEBUG
      loginMessage.textContent = ''; // Clear previous messages
      loginMessage.className = ''; // Clear previous classes

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      console.log('Captured login data:', { email }); // DEBUG (don't log password)

      if (!email || !password) {
        loginMessage.textContent = 'Please fill in both email and password.';
        loginMessage.className = 'alert alert-warning';
        console.log('Validation failed: Missing login fields.'); // DEBUG
        return;
      }

      try {
        if (!window._supabase) {
          loginMessage.textContent = 'Supabase client not initialized. Check console.';
          loginMessage.className = 'alert alert-danger';
          console.error('Supabase client (window._supabase) is not available during login attempt.'); // DEBUG
          return;
        }
        console.log('Attempting Supabase login with:', { email }); // DEBUG

        const { data, error } = await window._supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        console.log('Supabase login response:', { data, error }); // DEBUG

        if (error) {
          loginMessage.textContent = 'Login failed: ' + error.message;
          loginMessage.className = 'alert alert-danger';
        } else if (data.user) {
          loginMessage.textContent = 'Login successful! Redirecting...';
          loginMessage.className = 'alert alert-success';
          localStorage.setItem('onboardingComplete', 'true'); // Mark as "onboarded"
          // Optionally reset form: loginForm.reset();
          window.location.href = 'pages/dashboard.html'; // Redirect to dashboard
        } else {
          // Fallback for unexpected response where there's no error but also no user
          loginMessage.textContent = 'Login failed. Please check your credentials and try again.';
          loginMessage.className = 'alert alert-danger';
          console.warn('Supabase login response did not contain user data but no explicit error.');
        }
      } catch (catchError) {
        console.error('Login catch error:', catchError); // DEBUG
        loginMessage.textContent = 'An unexpected error occurred during login. Please try again.';
        loginMessage.className = 'alert alert-danger';
      }
    });
  } else {
    console.error('Login form (loginForm) not found.'); // DEBUG
  }
}); // End of DOMContentLoaded
