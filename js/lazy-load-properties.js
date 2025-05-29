document.addEventListener('DOMContentLoaded', function () {
    const propertiesContainer = document.querySelector('.properties-page-content .row.g-4');
    if (!propertiesContainer) {
        console.warn('Properties container for lazy loading not found.');
        return;
    }

    const allCards = Array.from(propertiesContainer.children);
    const cardsPerLoad = 9;
    let cardsCurrentlyVisible = 0; // This will be updated by hideAllCardsBeyondInitialLoad

    function hideAllCardsBeyondInitialLoad() {
        let visibleCount = 0;
        allCards.forEach((card, index) => {
            if (index < cardsPerLoad) {
                card.style.display = ''; // Ensure first set is visible (e.g., 'flex' or 'block' based on CSS)
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        cardsCurrentlyVisible = visibleCount;
        console.log(`Initial visible cards: ${cardsCurrentlyVisible}, Total cards: ${allCards.length}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All cards are initially visible. No lazy loading needed.');
            return false; // No more cards to load
        }
        return true; // More cards might be loaded
    }

    function loadMoreCards() {
        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All properties loaded. Removing scroll listener.');
            window.removeEventListener('scroll', scrollHandler);
            return;
        }

        let newCardsLoadedCount = 0;
        console.log(`Attempting to load more cards. Currently visible: ${cardsCurrentlyVisible}`);
        for (let i = cardsCurrentlyVisible; i < allCards.length && newCardsLoadedCount < cardsPerLoad; i++) {
            allCards[i].style.display = ''; // Make card visible
            cardsCurrentlyVisible++;
            newCardsLoadedCount++;
        }
        console.log(`Loaded ${newCardsLoadedCount} more properties. Total visible: ${cardsCurrentlyVisible}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All properties now loaded after this batch. Removing scroll listener.');
            window.removeEventListener('scroll', scrollHandler);
        }
    }

    let scrollTimeout;
    const scrollHandler = () => {
        // Debounce scroll event
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const viewportBottom = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.scrollHeight; // More reliable than body.offsetHeight
            const containerRect = propertiesContainer.getBoundingClientRect();
            // Distance from the bottom of the viewport to the bottom of the container
            const containerBottomRelativeToViewport = containerRect.bottom; 
            
            console.log(
                `Scroll Check: VP Bottom: ${Math.round(viewportBottom)}, Doc H: ${documentHeight}, ` +
                `Cont.Rect.Top: ${Math.round(containerRect.top)}, Cont.Rect.Bottom: ${Math.round(containerRect.bottom)}, ` +
                `Win.InnerH: ${window.innerHeight}`
            );

            // Condition 1: If the container's bottom is visible within the viewport + buffer
            // This is useful if the container itself is scrollable or has a defined end within the viewport
            const buffer = 200; // Slightly reduced buffer
            // Check if the bottom of the container is near the bottom of the viewport
            // OR if the overall scroll is near the end of the document.
            
            // Let's simplify: trigger if the last *loaded* card is visible and we are near the end of it.
            // Or if the general scroll is near the document end.
            let triggerLoad = false;
            if (cardsCurrentlyVisible > 0 && cardsCurrentlyVisible < allCards.length) {
                const lastVisibleCard = allCards[cardsCurrentlyVisible - 1];
                if (lastVisibleCard) {
                    const lastCardRect = lastVisibleCard.getBoundingClientRect();
                    // If the bottom of the last visible card is within the viewport + buffer
                    if (lastCardRect.bottom < (window.innerHeight + buffer)) {
                        console.log('Triggering load: Last visible card is nearing/in viewport bottom.');
                        triggerLoad = true;
                    }
                }
            }
            
            // Fallback: if scrolling near the very end of the document and there are still cards
            if (!triggerLoad && (viewportBottom >= documentHeight - buffer) && cardsCurrentlyVisible < allCards.length) {
                 console.log('Triggering load: Near document end.');
                 triggerLoad = true;
            }


            if (triggerLoad) {
                loadMoreCards();
            }
        }, 50); // Debounce timeout
    };
    
    if (hideAllCardsBeyondInitialLoad()) {
        console.log('Scroll listener added.');
        window.addEventListener('scroll', scrollHandler, { passive: true });
    } else {
        console.log('Scroll listener NOT added as all cards are initially visible or no container.');
    }
});
