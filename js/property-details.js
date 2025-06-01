document.addEventListener('DOMContentLoaded', async () => {
    let loadedPropertyDataForEditing = null;

    const propertyNameElement = document.getElementById('propertyName');
    const propertyImageElement = document.getElementById('propertyImage');
    const propertyAddressElement = document.getElementById('propertyAddress');
    const propertyTypeElement = document.getElementById('propertyType');
    const propertyOccupierElement = document.getElementById('propertyOccupier');
    const propertyDetailsTextElement = document.getElementById('propertyDetailsText');
    // Main content container for showing messages
    const mainContentContainer = document.querySelector('.container.mt-4');
    const ACTIVE_TASK_STATUSES = ['New', 'Inactive', 'In Progress', 'Stuck'];

    function getImagePathFromUrl(imageUrl) {
      if (!imageUrl) return null;
      try {
        const url = new URL(imageUrl);
        // Pathname looks like /storage/v1/object/public/property-images/users/user_id/image.jpg
        const pathSegments = url.pathname.split('/');
        const bucketName = 'property-images'; // Make sure this matches
        const bucketIndex = pathSegments.findIndex(segment => segment === bucketName);
        if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
          return pathSegments.slice(bucketIndex + 1).join('/');
        }
        console.warn('Could not determine image path from URL:', imageUrl);
        return null; // Or throw an error if path structure is unexpected
      } catch (e) {
        console.error('Error parsing image URL to get path:', e, imageUrl);
        return null;
      }
    }

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
        const { data: propertyDataResult, error } = await window._supabase
            .from('properties')
            .select('property_name, address, property_details, property_image_url, property_type, property_occupier')
            .eq('id', propertyId)
            .single();

        if (error) {
            console.error('Error fetching property details:', error);
            showMessage(`Error loading property: ${error.message}`, 'danger');
            return;
        }

        if (propertyDataResult) {
            const imagePath = getImagePathFromUrl(propertyDataResult.property_image_url);
            // Store the fetched data (including the ID from URL params and parsed image path) for editing
            loadedPropertyDataForEditing = {
                ...propertyDataResult,
                id: propertyId,
                property_image_path: imagePath
            };

            propertyNameElement.textContent = propertyDataResult.property_name || 'N/A';
            document.title = propertyDataResult.property_name ? `${propertyDataResult.property_name} - Property Details` : 'Property Details'; // Update page title as well

            propertyImageElement.src = propertyDataResult.property_image_url || 'https://via.placeholder.com/700x400.png?text=No+Image+Available';
            propertyImageElement.alt = propertyDataResult.property_name || 'Property Image';

            propertyAddressElement.textContent = propertyDataResult.address || 'N/A';
            propertyTypeElement.textContent = propertyDataResult.property_type || 'N/A';
            propertyOccupierElement.textContent = propertyDataResult.property_occupier || 'N/A';
            propertyDetailsTextElement.textContent = propertyDataResult.property_details || 'No additional details provided.';

            if (propertyId) { // Ensure propertyId is valid before fetching tasks
                fetchAndDisplayTasks(propertyId);
            }
        } else {
            console.warn('Property not found for ID:', propertyId);
            showMessage('Property not found. The link may be outdated or incorrect.', 'warning');
        }

    } catch (err) {
        console.error('An unexpected error occurred:', err);
        showMessage('An unexpected error occurred while trying to load property details.', 'danger');
    }

    async function fetchAndDisplayTasks(propertyId) {
        const activeTasksPane = document.getElementById('active-tasks-pane');
        const completedTasksPane = document.getElementById('completed-tasks-pane');

        if (!activeTasksPane || !completedTasksPane) {
            console.error('Task panes not found in the DOM.');
            return;
        }

        // Clear initial "Loading..." messages
        activeTasksPane.innerHTML = '';
        completedTasksPane.innerHTML = '';

        try {
            // Fetch tasks for the property
            const { data: tasks, error: tasksError } = await window._supabase
                .from('tasks')
                .select('task_title, task_due_date, task_status, task_priority, staff_id') // Corrected column names
                .eq('property_id', propertyId)
                .order('task_due_date', { ascending: true });

            if (tasksError) {
                console.error('Error fetching tasks:', tasksError);
                activeTasksPane.innerHTML = '<p class="text-danger">Error loading tasks.</p>';
                return;
            }

            if (!tasks || tasks.length === 0) {
                activeTasksPane.innerHTML = '<p class="text-muted no-tasks-message">No active tasks.</p>';
                completedTasksPane.innerHTML = '<p class="text-muted no-tasks-message">No completed tasks.</p>';
                return;
            }

            // Fetch staff names
            const staffIds = [...new Set(tasks.map(task => task.staff_id).filter(id => id))];
            let staffNamesMap = new Map();

            if (staffIds.length > 0) {
                const { data: profiles, error: profilesError } = await window._supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .in('id', staffIds);

                if (profilesError) {
                    console.error('Error fetching profiles:', profilesError);
                    // Continue without staff names, or show partial error
                } else {
                    profiles.forEach(profile => {
                        staffNamesMap.set(profile.id, `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unnamed Staff');
                    });
                }
            }

            let activeTasksHtml = [];
            let completedTasksHtml = [];

            tasks.forEach(task => {
                const staffName = task.staff_id ? (staffNamesMap.get(task.staff_id) || 'Assignee N/A') : 'Unassigned';
                const dueDate = task.task_due_date ? new Date(task.task_due_date).toLocaleDateString() : 'No due date';
                // Basic card structure for a task
                const taskCardHtml = `
                    <div class="card mb-2">
                        <div class="card-body">
                            <h6 class="card-title">${task.task_title || 'Untitled Task'}</h6>
                            <p class="card-text mb-1"><small class="text-muted">Assignee: ${staffName}</small></p>
                            <p class="card-text mb-1"><small class="text-muted">Due: ${dueDate}</small></p>
                            <p class="card-text mb-1"><small class="text-muted">Priority: ${task.task_priority || 'N/A'}</small></p>
                            <p class="card-text mb-0"><small class="text-muted">Status: ${task.task_status || 'N/A'}</small></p>
                        </div>
                    </div>
                `;

                if (task.task_status === 'Completed') {
                    completedTasksHtml.push(taskCardHtml);
                } else if (ACTIVE_TASK_STATUSES.includes(task.task_status)) {
                    activeTasksHtml.push(taskCardHtml);
                }
            });

            activeTasksPane.innerHTML = activeTasksHtml.length > 0 ? activeTasksHtml.join('') : '<p class="text-muted no-tasks-message">No active tasks.</p>';
            completedTasksPane.innerHTML = completedTasksHtml.length > 0 ? completedTasksHtml.join('') : '<p class="text-muted no-tasks-message">No completed tasks.</p>';

        } catch (error) {
            console.error('Unexpected error in fetchAndDisplayTasks:', error);
            if (activeTasksPane) activeTasksPane.innerHTML = '<p class="text-danger">Could not load tasks due to an unexpected error.</p>';
        }
    }

    // Event listeners for the new dropdown menu items
    const editPropertyLink = document.getElementById('editPropertyLink');
    const addTaskLink = document.getElementById('addTaskLink');
    const deletePropertyLink = document.getElementById('deletePropertyLink');

    if (editPropertyLink) {
        editPropertyLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            if (loadedPropertyDataForEditing) {
                // Ensure the data structure matches what openEditModal expects
                // openEditModal expects: id, property_name, address, property_type,
                // occupier/property_occupier, description/property_details, property_image_url
                const modalData = {
                    id: loadedPropertyDataForEditing.id, // Already included
                    property_name: loadedPropertyDataForEditing.property_name,
                    address: loadedPropertyDataForEditing.address,
                    property_type: loadedPropertyDataForEditing.property_type,
                    property_occupier: loadedPropertyDataForEditing.property_occupier,
                    property_details: loadedPropertyDataForEditing.property_details,
                    property_image_url: loadedPropertyDataForEditing.property_image_url,
                    old_image_path: loadedPropertyDataForEditing.property_image_path // Pass the path
                };
                if (typeof window.openEditModal === 'function') {
                    window.openEditModal(modalData);
                } else {
                    console.error('openEditModal function is not defined. Make sure addProperty.js is loaded.');
                    alert('Edit functionality is currently unavailable.');
                }
            } else {
                console.error('Property data not available for editing or not loaded yet.');
                alert('Could not load property data for editing. Please ensure details are fully loaded or try again.');
            }
        });
    }

    if (addTaskLink) {
        addTaskLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            console.log('Add Task clicked');
            // Future implementation: Redirect to add task page or open modal
        });
    }

    if (deletePropertyLink) {
        deletePropertyLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            if (confirm('Are you sure you want to delete this property?')) {
                console.log('Delete Property confirmed');
                // Future implementation: Call Supabase to delete the property
                // and then redirect or update UI.
            } else {
                console.log('Delete Property cancelled');
            }
        });
    }
});
