document.addEventListener('DOMContentLoaded', function () {
    const propertiesContainer = document.querySelector('.properties-page-content .row.g-4');
    if (!propertiesContainer) {
        console.warn('Properties container for lazy loading not found.');
        return;
    }

    const allCards = Array.from(propertiesContainer.children);
    const cardsPerLoad = 9;
    let cardsCurrentlyVisible = 0;

    function hideAllCardsBeyondInitialLoad() {
        allCards.forEach((card, index) => {
            if (index >= cardsPerLoad) {
                card.style.display = 'none';
            } else {
                card.style.display = ''; // Ensure first set is visible
                cardsCurrentlyVisible++;
            }
        });
        // If initially less than cardsPerLoad, all are visible, no scroll listener needed for more
        if (cardsCurrentlyVisible >= allCards.length) {
            return false; // No more cards to load
        }
        return true; // More cards might be loaded
    }

    function loadMoreCards() {
        if (cardsCurrentlyVisible >= allCards.length) {
            // console.log('All properties loaded.');
            window.removeEventListener('scroll', scrollHandler); // Remove listener if all loaded
            return;
        }

        let newCardsLoadedCount = 0;
        for (let i = cardsCurrentlyVisible; i < allCards.length && newCardsLoadedCount < cardsPerLoad; i++) {
            allCards[i].style.display = ''; // Or 'block', 'flex' depending on original display
            cardsCurrentlyVisible++;
            newCardsLoadedCount++;
        }
        // console.log(`Loaded ${newCardsLoadedCount} more properties. Total visible: ${cardsCurrentlyVisible}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            window.removeEventListener('scroll', scrollHandler);
        }
    }

    const scrollHandler = () => {
        // Load when user is about 300px from the bottom of the propertiesContainer or document end
        const buffer = 300; 
        // Consider either the container's bottom or the document's bottom
        const containerRect = propertiesContainer.getBoundingClientRect();
        const triggerPointContainer = containerRect.bottom - window.innerHeight < buffer;
        const triggerPointDocument = (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - buffer);


        if (triggerPointContainer || triggerPointDocument) {
            loadMoreCards();
        }
    };
    
    if (hideAllCardsBeyondInitialLoad()) { // Only add scroll listener if there are more cards to load
        window.addEventListener('scroll', scrollHandler, { passive: true });
    }
});
