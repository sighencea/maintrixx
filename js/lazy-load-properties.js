document.addEventListener('DOMContentLoaded', () => {
    const propertiesContainer = document.getElementById('propertiesContainer');
    let initialOffset = 0;
    const propertiesPerPage = 9; // Display 9 properties per fetch (3x3 grid)
    let isLoading = false;
    let allPropertiesLoaded = false;

    // The displayProperties function (assumed to be correctly added in a previous step,
    // but provided here for completeness of this script's context)
    // This function was designed to create property cards and link them.
    function displayProperties(properties) {
        if (!propertiesContainer) {
            console.error('Properties container not found in displayProperties.');
            return;
        }

    if (properties.length === 0 && initialOffset === 0) {
        const noPropertiesMessage = (typeof i18next !== 'undefined' && typeof i18next.t === 'function') ?
                                    i18next.t('propertiesPage.noProperties') :
                                    'No properties found for your account.';
        propertiesContainer.innerHTML = `<div class="col-12"><p>${noPropertiesMessage}</p></div>`;
        allPropertiesLoaded = true; // No properties to load
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

        if (initialOffset === 0 && propertiesContainer.innerHTML.includes('data-i18n="propertiesPage.noProperties"')) {
            // If "No properties found" was there, replace it completely
            propertiesContainer.innerHTML = propertiesHtml;
        } else if (initialOffset === 0) {
             propertiesContainer.innerHTML = propertiesHtml;
        }

        else {
            propertiesContainer.innerHTML += propertiesHtml;
        }

    }

    async function fetchProperties(offset, limit) {
        if (isLoading || allPropertiesLoaded) {
            return;
        }
        isLoading = true;
        console.log(`Fetching properties: offset=${offset}, limit=${limit}`);

        if (!window._supabase) {
            console.error('Supabase client not available.');
            isLoading = false;
            return;
        }

        try {
            // RLS is expected to filter by user
            const { data, error } = await window._supabase
                .from('properties')
                .select('id, property_name, address, property_image_url, property_type')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('Error fetching properties:', error);
                // Optionally display an error message to the user in the container
                if (offset === 0) { // Only show error on initial load
                    propertiesContainer.innerHTML = '<div class="col-12"><p class="text-danger">Error loading properties. Please try again later.</p></div>';
                }
                allPropertiesLoaded = true; // Stop trying if there's an error
                return;
            }

            if (data) {
                console.log('Properties fetched:', data.length);
                displayProperties(data);
                initialOffset += data.length;
                if (data.length < limit) {
                    allPropertiesLoaded = true;
                    console.log('All properties loaded.');
                }
            }
        } catch (err) {
            console.error('Unexpected error fetching properties:', err);
             if (offset === 0) {
                propertiesContainer.innerHTML = '<div class="col-12"><p class="text-danger">An unexpected error occurred. Please try again later.</p></div>';
            }
            allPropertiesLoaded = true; // Stop trying
        } finally {
            isLoading = false;
        }
    }

    function lazyScrollHandler() {
        // Check if the user has scrolled to near the bottom of the page
        // (window.innerHeight + window.scrollY) is the bottom of the viewport
        // document.body.offsetHeight is the total height of the page
        // The - 200 is a buffer
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200 && !isLoading && !allPropertiesLoaded) {
            console.log('Reached bottom, loading more properties...');
            fetchProperties(initialOffset, propertiesPerPage);
        }
    }

    // Initial load
    if (propertiesContainer) {
        fetchProperties(initialOffset, propertiesPerPage);
    } else {
        console.error('Properties container (propertiesContainer) not found on page load.');
    }

    // Attach scroll listener for lazy loading
    window.addEventListener('scroll', lazyScrollHandler);
    // Also consider an IntersectionObserver for a more modern/performant approach if issues with scroll handler.
});
