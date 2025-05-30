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
        // console.log(`Initial visible cards: ${cardsCurrentlyVisible}, Total cards: ${allCards.length}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            // console.log('All cards are initially visible. No lazy loading needed.');
            return false;
        }
        return true;
    }

    function loadMoreCards() {
        if (cardsCurrentlyVisible >= allCards.length) {
            // This condition is unlikely to be met here if scroll listener is already removed,
            // but as a safeguard:
            mainContent.removeEventListener('scroll', scrollHandler); 
            return;
        }

        let newCardsLoadedCount = 0;
        // console.log(`Attempting to load more cards. Currently visible: ${cardsCurrentlyVisible}`);
        for (let i = cardsCurrentlyVisible; i < allCards.length && newCardsLoadedCount < cardsPerLoad; i++) {
            allCards[i].style.display = '';
            cardsCurrentlyVisible++;
            newCardsLoadedCount++;
        }
        // console.log(`Loaded ${newCardsLoadedCount} more properties. Total visible: ${cardsCurrentlyVisible}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All properties lazy-loaded.');
            mainContent.removeEventListener('scroll', scrollHandler);
        }
    }

    let scrollTimeout;
    const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollableHeight = mainContent.scrollHeight - mainContent.clientHeight;
            const currentScrollTop = mainContent.scrollTop;
            
            // console.log( // REMOVED
            //     `Scroll Check (#mainContent): ScrollTop: ${Math.round(currentScrollTop)}, ` +
            //     `ScrollableHeight: ${Math.round(scrollableHeight)}, ClientHeight: ${mainContent.clientHeight}`
            // );

            const buffer = 50; 
            let triggerLoad = false;

            if (currentScrollTop >= (scrollableHeight - buffer)) {
                // console.log('Triggering load: Scrolled near bottom of #mainContent.'); // REMOVED
                triggerLoad = true;
            }

            if (triggerLoad) {
                loadMoreCards();
            }
        }, 50); 
    };
    
    if (hideAllCardsBeyondInitialLoad()) {
        // console.log('Scroll listener added to #mainContent.'); // REMOVED
        mainContent.addEventListener('scroll', scrollHandler, { passive: true }); 
    } else {
        // console.log('Scroll listener NOT added as all cards are initially visible or elements missing.'); // REMOVED
    }
});
