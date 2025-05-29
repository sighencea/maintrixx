// i18next initialization
async function initI18n() {
  try {
    let enResources, deResources;
    // Check if on index.html (root) or a page in a subdirectory
    const isIndexPage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html');
    const basePath = isIndexPage ? '' : '../';

    enResources = await fetch(`${basePath}locales/en.json`).then(res => res.json());
    deResources = await fetch(`${basePath}locales/de.json`).then(res => res.json());

    await i18next.init({
      lng: 'en', // Default language - will be updated from Supabase later
      debug: true, // Set to false in production
      resources: {
        en: { translation: enResources },
        de: { translation: deResources }
      },
      fallbackLng: 'en' // Fallback language if a key is missing
    });
    updateContent();
  } catch (error) {
    console.error('Error initializing i18next:', error);
    // Fallback content update even if i18next fails to load resources
    updateContentDirectlyIfAble(); 
  }
}

// Function to update text elements with translations
function updateContent() {
  if (!i18next.isInitialized) {
    console.warn('i18next not initialized, attempting direct update.');
    updateContentDirectlyIfAble();
    return;
  }
  console.log('Updating content with current language:', i18next.language);
  
  // Update document title
  const pageTitleElement = document.querySelector('title[data-i18n-title]');
  if (pageTitleElement) {
    const pageTitleKey = pageTitleElement.getAttribute('data-i18n-title');
    document.title = i18next.t(pageTitleKey);
  } else {
    // Fallback for titles not specifically tagged for i18n key
    // For example, if index.html's title was missed in tagging
    // Adjusted to check the previously used data-i18n attribute for backward compatibility if needed
    const oldTitleElement = document.querySelector('title[data-i18n]');
    if (oldTitleElement) {
        const oldTitleKey = oldTitleElement.getAttribute('data-i18n');
        document.title = i18next.t(oldTitleKey);
    }
  }

  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = i18next.t(key);
    
    // Special handling for the page title element if it's captured by querySelectorAll
    if (el.tagName === 'TITLE') {
      // Already handled above
      return; 
    }

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.type === 'submit' || el.type === 'button') {
        el.value = translation;
      } else {
        // For other input types like text, email, password, use placeholder
        el.placeholder = translation;
      }
    } else {
      el.innerHTML = translation;
    }
  });
}

// Fallback function in case i18next fails to load resources
function updateContentDirectlyIfAble() {
    console.warn("Attempting to update content directly from data-i18n attributes as a fallback.");
    document.querySelectorAll('title[data-i18n-title]').forEach(el => { // Check correct attribute
        const key = el.getAttribute('data-i18n-title');
        document.title = key || "App"; 
    });
    // For other elements, direct update from key might be too simplistic or undesirable
    // document.querySelectorAll('[data-i18n]').forEach(el => {
    //     const key = el.getAttribute('data-i18n');
    //     // el.innerHTML = key; // Or some other fallback mechanism
    // });
}

window.i18next = i18next;
window.updateContent = updateContent;
// Function to change language and re-render content
window.changeLanguage = async (lang) => {
  if (!i18next.isInitialized) {
    console.error('i18next not initialized. Cannot change language.');
    return;
  }
  await i18next.changeLanguage(lang);
  updateContent();
  // TODO: Save preference to Supabase
};

initI18n();
