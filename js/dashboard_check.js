(function() {
  // Check if onboarding is complete
  if (localStorage.getItem('onboardingComplete') !== 'true') {
    // If not complete, redirect to the onboarding page (index.html)
    // The path '../index.html' assumes dashboard.html is in a 'pages' subfolder.
    alert('Please complete the onboarding process first.'); // Optional: alert user
    window.location.href = '../index.html'; 
  }
})();
