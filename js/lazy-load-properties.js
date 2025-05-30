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

    const initialBufferCards = 3; 
    const minimumInitialCards = 6; 
    const cardsPerScrollLoad = 6;

    // Initially hide all cards
    allCards.forEach(card => {
        card.style.display = 'none';
    });

    function performInitialPropertyLoad() {
        console.log('Performing initial property load...');
        let scrollbarAppeared = false;
        for (let i = 0; i < allCards.length; i++) {
            allCards[i].style.display = ''; 
            cardsCurrentlyVisible++;

            if (cardsCurrentlyVisible >= minimumInitialCards && mainContent.scrollHeight > mainContent.clientHeight) {
                console.log(`Scrollbar detected after ${cardsCurrentlyVisible} cards. Viewport height: ${mainContent.clientHeight}, Scroll height: ${mainContent.scrollHeight}`);
                scrollbarAppeared = true;
                let bufferLoaded = 0;
                for (let j = i + 1; j < allCards.length && bufferLoaded < initialBufferCards; j++) {
                    allCards[j].style.display = '';
                    cardsCurrentlyVisible++;
                    bufferLoaded++;
                }
                console.log(`Loaded ${bufferLoaded} buffer cards. Total visible after initial + buffer: ${cardsCurrentlyVisible}`);
                break; 
            }
        }

        if (!scrollbarAppeared && cardsCurrentlyVisible > 0) {
            console.log(`All ${cardsCurrentlyVisible} cards loaded initially, no scrollbar detected, or not enough cards to trigger scrollbar check past minimum.`);
        } else if (cardsCurrentlyVisible === 0 && allCards.length > 0) {
            console.warn('No cards made visible in initial load, but cards exist.');
        }
        
        console.log(`Initial property load complete. Cards visible: ${cardsCurrentlyVisible}/${allCards.length}`);
        return cardsCurrentlyVisible < allCards.length; // True if more cards to load
    }

    function loadMoreCards() {
        if (cardsCurrentlyVisible >= allCards.length) {
            mainContent.removeEventListener('scroll', scrollHandler); 
            return;
        }

        console.log(`Scroll event triggered load. Currently visible: ${cardsCurrentlyVisible}, loading up to ${cardsPerScrollLoad} more.`);
        let newCardsLoadedCount = 0;
        for (let i = cardsCurrentlyVisible; i < allCards.length && newCardsLoadedCount < cardsPerScrollLoad; i++) {
            allCards[i].style.display = '';
            cardsCurrentlyVisible++;
            newCardsLoadedCount++;
        }
        console.log(`Loaded ${newCardsLoadedCount} more properties. Total visible: ${cardsCurrentlyVisible}`);

        if (cardsCurrentlyVisible >= allCards.length) {
            console.log('All properties have been lazy-loaded.');
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
    
    if (allCards.length > 0) {
        if (performInitialPropertyLoad()) { // Returns true if more cards to load
            console.log('Scroll listener attached for lazy loading remaining properties.');
            mainContent.addEventListener('scroll', scrollHandler, { passive: true });
        } else {
            console.log('All properties fit or were loaded initially. No scroll listener needed.');
        }
    } else {
        console.warn('No property cards found to lazy load.');
    }
});
