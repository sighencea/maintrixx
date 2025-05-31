document.addEventListener('DOMContentLoaded', async () => {
    const propertyNameElement = document.getElementById('propertyName');
    const propertyImageElement = document.getElementById('propertyImage');
    const propertyAddressElement = document.getElementById('propertyAddress');
    const propertyTypeElement = document.getElementById('propertyType');
    const propertyOccupierElement = document.getElementById('propertyOccupier');
    const propertyDetailsTextElement = document.getElementById('propertyDetailsText');
    // Main content container for showing messages
    const mainContentContainer = document.querySelector('.container.mt-4');


    // Function to display messages to the user
    function showMessage(message, type = 'info') {
        if (!mainContentContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} mt-3`;
        messageDiv.textContent = message;
        // Clear previous messages and content before showing a new one
        mainContentContainer.innerHTML = '';
        mainContentContainer.appendChild(messageDiv);
    }

    if (!propertyNameElement || !propertyImageElement || !propertyAddressElement || !propertyTypeElement || !propertyOccupierElement || !propertyDetailsTextElement) {
        console.error('One or more placeholder elements are missing from the page.');
        showMessage('Error: Page structure is incomplete. Cannot display property details.', 'danger');
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');

    if (!propertyId) {
        console.error('Property ID is missing from the URL.');
        showMessage('Property ID is missing. Cannot load details.', 'warning');
        return;
    }

    if (!window._supabase) {
        console.error('Supabase client is not available.');
        showMessage('Cannot connect to the database. Supabase client not found.', 'danger');
        return;
    }

    try {
        const { data: property, error } = await window._supabase
            .from('properties')
            .select('property_name, address, property_details, property_image_url, property_type, property_occupier')
            .eq('id', propertyId)
            .single();

        if (error) {
            console.error('Error fetching property details:', error);
            showMessage(`Error loading property: ${error.message}`, 'danger');
            return;
        }

        if (property) {
            propertyNameElement.textContent = property.property_name || 'N/A';
            document.title = property.property_name ? `${property.property_name} - Property Details` : 'Property Details'; // Update page title as well

            propertyImageElement.src = property.property_image_url || 'https://via.placeholder.com/700x400.png?text=No+Image+Available';
            propertyImageElement.alt = property.property_name || 'Property Image';

            propertyAddressElement.textContent = property.address || 'N/A';
            propertyTypeElement.textContent = property.property_type || 'N/A';
            propertyOccupierElement.textContent = property.property_occupier || 'N/A';
            propertyDetailsTextElement.textContent = property.property_details || 'No additional details provided.';

        } else {
            console.warn('Property not found for ID:', propertyId);
            showMessage('Property not found. The link may be outdated or incorrect.', 'warning');
        }

    } catch (err) {
        console.error('An unexpected error occurred:', err);
        showMessage('An unexpected error occurred while trying to load property details.', 'danger');
    }
});
