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
        if (!window._supabase) { 
          signupMessage.textContent = 'Supabase client not initialized. Check console.'; 
          signupMessage.className = 'alert alert-danger';
          console.error('Supabase client not available for sign-up.'); return; 
        }
        const { data, error } = await window._supabase.auth.signUp(
          { email: email, password: password },
          { data: { first_name: firstName } }
        );
        if (error) { signupMessage.textContent = 'Error: ' + error.message; signupMessage.className = 'alert alert-danger'; }
        else if (data.user && data.user.identities && data.user.identities.length === 0) { signupMessage.textContent = 'Account exists, check email for confirmation.'; signupMessage.className = 'alert alert-info'; }
        else if (data.user) { signupMessage.textContent = 'Sign-up successful! Please check your email to confirm.'; signupMessage.className = 'alert alert-success'; signupForm.reset(); }
        else { signupMessage.textContent = 'Sign-up successful, awaiting confirmation (unexpected response). Check email.'; signupMessage.className = 'alert alert-info';}
      } catch (e) { console.error('Sign-up catch:', e); signupMessage.textContent = 'Unexpected sign-up error.'; signupMessage.className = 'alert alert-danger'; }
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
        loginMessage.textContent = 'Please fill in both email and password.';
        loginMessage.className = 'alert alert-warning';
        return; 
      }
      try {
        if (!window._supabase) { 
          loginMessage.textContent = 'Supabase client not initialized. Check console.';
          loginMessage.className = 'alert alert-danger';
          console.error('Supabase client not available for login.'); return; 
        }
        const { data, error } = await window._supabase.auth.signInWithPassword({ email: email, password: password });
        if (error) { loginMessage.textContent = 'Login failed: ' + error.message; loginMessage.className = 'alert alert-danger'; }
        else if (data.user) {
          localStorage.setItem('onboardingComplete', 'true'); // Using this as a simple session flag proxy
          window.location.href = 'pages/dashboard.html';
        } else { loginMessage.textContent = 'Login failed. Check credentials.'; loginMessage.className = 'alert alert-danger'; }
      } catch (e) { console.error('Login catch:', e); loginMessage.textContent = 'Unexpected login error.'; loginMessage.className = 'alert alert-danger'; }
    });
  } else { console.error('loginForm not found'); }
});
