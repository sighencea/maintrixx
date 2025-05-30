document.addEventListener('DOMContentLoaded', function () {
    const staffTableBody = document.getElementById('staffTableBody');
    const mainContent = document.getElementById('mainContent'); // Scroll container

    if (!staffTableBody) {
        console.warn('Staff table body (staffTableBody) for lazy loading not found.');
        return;
    }
    if (!mainContent) {
        console.warn('#mainContent element not found. Cannot attach scroll listener for staff lazy loading.');
        return;
    }

    const allRows = Array.from(staffTableBody.children); // Assuming children are all <tr>
    const rowsPerLoad = 15; // Number of table rows to show per load
    let rowsCurrentlyVisible = 0;

    function hideAllRowsBeyondInitialLoad() {
        let visibleCount = 0;
        allRows.forEach((row, index) => {
            if (index < rowsPerLoad) {
                row.style.display = ''; // Or 'table-row' if needed, but '' usually works
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        rowsCurrentlyVisible = visibleCount;
        // console.log(`Initial visible staff rows: ${rowsCurrentlyVisible}, Total rows: ${allRows.length}`);

        if (rowsCurrentlyVisible >= allRows.length) {
            // console.log('All staff rows are initially visible. No lazy loading needed.');
            return false; // No more rows to load
        }
        return true; // More rows might be loaded
    }

    function loadMoreRows() {
        if (rowsCurrentlyVisible >= allRows.length) {
            mainContent.removeEventListener('scroll', scrollHandler);
            return;
        }

        let newRowsLoadedCount = 0;
        for (let i = rowsCurrentlyVisible; i < allRows.length && newRowsLoadedCount < rowsPerLoad; i++) {
            allRows[i].style.display = ''; // Or 'table-row'
            rowsCurrentlyVisible++;
            newRowsLoadedCount++;
        }

        if (rowsCurrentlyVisible >= allRows.length) {
            console.log('All staff members lazy-loaded.');
            mainContent.removeEventListener('scroll', scrollHandler);
        }
    }

    let scrollTimeout;
    const scrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollableHeight = mainContent.scrollHeight - mainContent.clientHeight;
            const currentScrollTop = mainContent.scrollTop;
            const buffer = 100; // Load when 100px from the bottom

            if (currentScrollTop >= (scrollableHeight - buffer)) {
                loadMoreRows();
            }
        }, 50); // Debounce timeout
    };

    if (allRows.length > 0 && hideAllRowsBeyondInitialLoad()) { // Check if there are rows to begin with
        mainContent.addEventListener('scroll', scrollHandler, { passive: true });
    } else if (allRows.length === 0) {
        console.warn('No rows found in staffTableBody to lazy load.');
    }
});
