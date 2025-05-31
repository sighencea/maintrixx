document.addEventListener('DOMContentLoaded', function () {
    const propertiesContainer = document.querySelector('.properties-page-content .row.g-4');
    const mainContent = document.getElementById('mainContent');

    if (!propertiesContainer) {
        console.warn('Properties container for lazy loading not found.');
        return;
    }
    if (!mainContent) {
        console.warn('#mainContent element not found. Cannot attach scroll listener for lazy loading.');
        return;
    }

    const allCards = Array.from(propertiesContainer.children);
    let cardsCurrentlyVisible = 0;

    // Constants for controlling load behavior
    const minimumInitialCards = 6;
    const initialBufferCards = 3;
    const cardsPerScrollLoad = 6;

    // Initially hide all cards
    allCards.forEach(card => {
        card.style.display = 'none';
    });

    function performInitialPropertyLoad() {
        console.log('Performing initial property card load...');
        // console.log(`mainContent.clientHeight: ${mainContent.clientHeight}px`); // Optional: for debugging
        // if (allCards.length > 0 && allCards[0]) { // Optional: for debugging
        //     console.log(`Height of a typical card (allCards[0].offsetHeight): ${allCards[0].offsetHeight}px`);
        // }

        let scrollbarAppeared = false;
        // let cardsVisibleBeforeScrollbarCheck = 0; // Optional: for debugging

        for (let i = 0; i < allCards.length; i++) {
            allCards[i].style.display = ''; // Revert to default display (e.g., 'block' or Bootstrap's grid style)
            cardsCurrentlyVisible++;
            // cardsVisibleBeforeScrollbarCheck = cardsCurrentlyVisible; // Optional: for debugging

            // Check if minimum cards are visible AND scrollbar has appeared
            if (cardsCurrentlyVisible >= minimumInitialCards && mainContent.scrollHeight > mainContent.clientHeight) {
                // console.log(`Scrollbar condition met: mainContent.scrollHeight (${mainContent.scrollHeight}px) > mainContent.clientHeight (${mainContent.clientHeight}px)`); // Optional
                // console.log(`Cards made visible one by one before scrollbar check: ${cardsVisibleBeforeScrollbarCheck}`); // Optional
                scrollbarAppeared = true;

                let bufferLoaded = 0;
                // Load initialBufferCards more cards
                for (let j = i + 1; j < allCards.length && bufferLoaded < initialBufferCards; j++) {
                    allCards[j].style.display = '';
                    cardsCurrentlyVisible++;
                    bufferLoaded++;
                }
                // console.log(`Loaded ${bufferLoaded} buffer cards.`); // Optional
                break;
            }
        }

        if (!scrollbarAppeared && cardsCurrentlyVisible > 0) {
            // This means all cards were loaded, or minimum wasn't met before scrollbar check (e.g. few cards total)
            // console.log(`All ${cardsCurrentlyVisible} cards loaded initially, or no scrollbar detected with current settings.`); // Optional
        } else if (allCards.length > 0 && cardsCurrentlyVisible === 0) {
            console.warn('No property cards made visible in initial load, but cards exist.');
        }

        // console.log(`Total cards made visible by performInitialPropertyLoad (including buffer): ${cardsCurrentlyVisible}`); // Optional
        const moreToLoad = cardsCurrentlyVisible < allCards.length;
        // console.log(`Will scroll listener be added for property cards? ${moreToLoad}`); // Optional
        return moreToLoad;
    }

    function loadMoreCards() {
        // console.log('loadMoreCards (properties) triggered.'); // Optional
        // console.log(`Cards currently visible before adding more: ${cardsCurrentlyVisible}`); // Optional

        if (cardsCurrentlyVisible >= allCards.length) {
            mainContent.removeEventListener('scroll', scrollHandler);
            return;
        }

        let newCardsLoadedCount = 0;
        for (let i = cardsCurrentlyVisible; i < allCards.length && newCardsLoadedCount < cardsPerScrollLoad; i++) {
            allCards[i].style.display = '';
            cardsCurrentlyVisible++;
            newCardsLoadedCount++;
        }
        // console.log(`Number of new property cards added: ${newCardsLoadedCount}`); // Optional
        // console.log(`Total property cards visible after adding more: ${cardsCurrentlyVisible}`); // Optional

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All property cards have been lazy-loaded.');
            mainContent.removeEventListener('scroll', scrollHandler);
        }
    }

    let scrollTimeout;
    const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollableHeight = mainContent.scrollHeight - mainContent.clientHeight;
            const currentScrollTop = mainContent.scrollTop;
            const buffer = 100; // Buffer in pixels to trigger load before reaching the very end

            // Trigger if scrolled near the bottom OR if the content is very short (scrollbar might not be obvious)
            if (currentScrollTop >= (scrollableHeight - buffer) || scrollableHeight < buffer) {
                // console.log('Scroll trigger activated for loading more property cards.'); // Optional
                loadMoreCards();
            }
        }, 50); // Debounce time
    };

function displayProperties(properties) {
    const propertiesContainer = document.getElementById('propertiesContainer');
    if (!propertiesContainer) {
        console.error('Properties container not found.');
        return;
    }

    if (properties.length === 0 && initialOffset === 0) { // Check initialOffset here
        propertiesContainer.innerHTML = '<p data-i18n="propertiesPage.noProperties">No properties found.</p>';
        if (typeof i18next !== 'undefined' && typeof i18next.t === 'function') {
            i18next.reloadResources().then(() => {
                 i18next.updateContent();
            });
        }
        return;
    }

    let propertiesHtml = properties.map(property => {
        const imageUrl = property.property_image_url ? property.property_image_url : 'https://via.placeholder.com/300x200.png?text=No+Image';
        const propertyName = property.property_name || 'Unnamed Property';
        const propertyAddress = property.address || 'Address not available';
        const propertyType = property.property_type || 'N/A';
        const propertyId = property.id;

        return `
          <div class="col-lg-4 col-md-6 mb-4">
            <a href="property-details.html?id=${propertyId}" class="text-decoration-none d-block h-100">
              <div class="card property-card-link h-100">
                <img src="${imageUrl}" class="card-img-top" alt="${propertyName}" style="height: 200px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title text-primary">${propertyName}</h5>
                  <p class="card-text text-secondary flex-grow-1">${propertyAddress}</p>
                  <p class="card-text"><small class="text-muted">Type: ${propertyType}</small></p>
                  <span class="btn btn-sm btn-outline-primary mt-auto align-self-start">View Details</span>
                </div>
              </div>
            </a>
          </div>
        `;
    }).join('');

    if (initialOffset === 0) { // Check initialOffset for full replacement
        propertiesContainer.innerHTML = propertiesHtml;
    } else {
        propertiesContainer.innerHTML += propertiesHtml;
    }

    if (typeof i18next !== 'undefined' && typeof i18next.t === 'function') {
        i18next.updateContent();
    }
}

    // Main execution logic
    if (allCards.length > 0) {
        if (performInitialPropertyLoad()) {
            // console.log('Scroll listener attached for lazy loading remaining property cards.'); // Optional
            mainContent.addEventListener('scroll', scrollHandler, { passive: true });
        } else {
            // console.log('All property cards fit in viewport or were loaded initially. No scroll listener needed.'); // Optional
        }
    } else {
        console.warn('No property cards found to lazy load.');
    }
});
