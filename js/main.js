document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('startOnboarding');
  const onboardingCarouselElement = document.getElementById('onboardingCarousel');
  
  if (!startButton || !onboardingCarouselElement) {
    console.error('Required elements (startButton or onboardingCarouselElement) not found.');
    return;
  }
  
  const onboardingCarousel = new bootstrap.Carousel(onboardingCarouselElement, {
    interval: false, // Disable auto-sliding
    wrap: false      // Prevent wrapping from last slide to first
  });

  // When the "Let's start" button is clicked:
  startButton.addEventListener('click', function () {
    // Hide the welcome message and start button
    document.querySelector('h1').classList.add('d-none'); // Hides "Welcome!"
    startButton.classList.add('d-none');
    
    // Show the carousel
    onboardingCarouselElement.classList.remove('d-none');
    onboardingCarousel.to(0); // Go to the first slide explicitly
  });

  // Listen for the slide event to capture data
  onboardingCarouselElement.addEventListener('slid.bs.carousel', function (event) {
    // Check if the previous slide was the Email slide (index 1, as slides are 0-indexed)
    // and the current slide is the confirmation slide (index 2)
    if (event.from === 1 && event.to === 2) {
      const firstNameInput = document.getElementById('firstName');
      const emailInput = document.getElementById('email');

      if (!firstNameInput || !emailInput) {
        console.error('Input fields (firstName or email) not found.');
        return;
      }

      const userData = {
        firstName: firstNameInput.value,
        email: emailInput.value
      };

      console.log('User Data:', JSON.stringify(userData, null, 2));
      localStorage.setItem('onboardingComplete', 'true'); // Mark onboarding as complete
    }
  });
});
