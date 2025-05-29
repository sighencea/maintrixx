document.addEventListener('DOMContentLoaded', function () {
    const propertiesContainer = document.querySelector('.properties-page-content .row.g-4');
    const mainContent = document.getElementById('mainContent'); // Get the main content element

    if (!propertiesContainer) {
        console.warn('Properties container for lazy loading not found.');
        return;
    }
    if (!mainContent) {
        console.warn('#mainContent element not found. Cannot attach scroll listener for lazy loading.');
        return;
    }

    const allCards = Array.from(propertiesContainer.children);
    const cardsPerLoad = 9;
    let cardsCurrentlyVisible = 0;

    function hideAllCardsBeyondInitialLoad() {
        let visibleCount = 0;
        allCards.forEach((card, index) => {
            if (index < cardsPerLoad) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        cardsCurrentlyVisible = visibleCount;
        console.log(`Initial visible cards: ${cardsCurrentlyVisible}, Total cards: ${allCards.length}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All cards are initially visible. No lazy loading needed.');
            return false;
        }
        return true;
    }

    function loadMoreCards() {
        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All properties loaded. Removing scroll listener from #mainContent.');
            mainContent.removeEventListener('scroll', scrollHandler); // Remove from mainContent
            return;
        }

        let newCardsLoadedCount = 0;
        console.log(`Attempting to load more cards. Currently visible: ${cardsCurrentlyVisible}`);
        for (let i = cardsCurrentlyVisible; i < allCards.length && newCardsLoadedCount < cardsPerLoad; i++) {
            allCards[i].style.display = '';
            cardsCurrentlyVisible++;
            newCardsLoadedCount++;
        }
        console.log(`Loaded ${newCardsLoadedCount} more properties. Total visible: ${cardsCurrentlyVisible}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All properties now loaded after this batch. Removing scroll listener from #mainContent.');
            mainContent.removeEventListener('scroll', scrollHandler); // Remove from mainContent
        }
    }

    let scrollTimeout;
    const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Calculations relative to mainContent
            const scrollableHeight = mainContent.scrollHeight - mainContent.clientHeight;
            const currentScrollTop = mainContent.scrollTop;
            
            console.log(
                `Scroll Check (#mainContent): ScrollTop: ${Math.round(currentScrollTop)}, ` +
                `ScrollableHeight: ${Math.round(scrollableHeight)}, ClientHeight: ${mainContent.clientHeight}`
            );

            const buffer = 50; // Buffer from the bottom of the scrollable area
            let triggerLoad = false;

            if (currentScrollTop >= (scrollableHeight - buffer)) {
                console.log('Triggering load: Scrolled near bottom of #mainContent.');
                triggerLoad = true;
            }

            // Fallback check: if the last visible card's bottom is near the mainContent's visible bottom
            // This is more complex if mainContent itself isn't what's visually clipping.
            // The primary check above should be more reliable for an overflow container.
            if (!triggerLoad && cardsCurrentlyVisible > 0 && cardsCurrentlyVisible < allCards.length) {
                const lastVisibleCard = allCards[cardsCurrentlyVisible - 1];
                if (lastVisibleCard) {
                    // Get bounding rect of last card relative to viewport
                    const lastCardRect = lastVisibleCard.getBoundingClientRect();
                    // Get bounding rect of mainContent relative to viewport
                    const mainContentRect = mainContent.getBoundingClientRect();
                    
                    // Check if the bottom of the last card is close to or past the bottom of mainContent's viewport area
                    if (lastCardRect.bottom <= (mainContentRect.bottom + buffer)) {
                         // This condition might be too aggressive if many cards fit in mainContent.
                         // The scrollTop check is generally better for overflow containers.
                         // console.log('Triggering load (fallback): Last visible card nearing #mainContent bottom edge.');
                         // triggerLoad = true; // Keeping this commented for now, primary check should work
                    }
                }
            }


            if (triggerLoad) {
                loadMoreCards();
            }
        }, 50); // Debounce timeout
    };
    
    if (hideAllCardsBeyondInitialLoad()) {
        console.log('Scroll listener added to #mainContent.');
        mainContent.addEventListener('scroll', scrollHandler, { passive: true }); // Attach to mainContent
    } else {
        console.log('Scroll listener NOT added as all cards are initially visible or elements missing.');
    }
});
