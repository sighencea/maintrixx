document.addEventListener('DOMContentLoaded', async () => {
    const propertyNameElement = document.getElementById('propertyName');
    const propertyImageElement = document.getElementById('propertyImage');
    const propertyAddressElement = document.getElementById('propertyAddress');
    const propertyTypeElement = document.getElementById('propertyType');
    const propertyOccupierElement = document.getElementById('propertyOccupier');
    const propertyDetailsTextElement = document.getElementById('propertyDetailsText');
    // Main content container for showing messages
    const mainContentContainer = document.querySelector('.container.mt-4');
    const ACTIVE_TASK_STATUSES = ['New', 'Inactive', 'In Progress', 'Stuck'];


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
});
