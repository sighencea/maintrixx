// Global modal instances
let viewTaskModalInstance = null;
let editTaskModalInstance = null;
let addNewTaskModalInstance = null;

// Asynchronous function to fetch current user's profile (especially admin status)
async function getCurrentUserProfile() {
  if (!window._supabase) {
    console.error('Supabase client is not available.');
    return null;
  }
  const { data: { user }, error: userError } = await window._supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user or no user logged in:', userError);
    return null;
  }

  // Now fetch the profile for this user
  try {
    const { data: profile, error: profileError } = await window._supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }
    return profile; // Expected to be an object like { is_admin: true/false } or null
  } catch (e) {
    console.error('Exception while fetching user profile:', e);
    return null;
  }
}

// Function to populate dropdowns in the Create Task Modal
async function populateCreateTaskModalDropdowns() {
  const supabase = window._supabase;
  const saveNewTaskButton = document.getElementById('saveNewTaskBtn'); // Get save button reference

  // Helper to update dropdown and disable save button on error
  const setDropdownError = (selectElement, message) => {
    selectElement.innerHTML = `<option value="" selected disabled>${message}</option>`;
    selectElement.disabled = true;
    if (saveNewTaskButton) saveNewTaskButton.disabled = true;
  };

  // Helper to reset/enable save button
  const enableSaveButton = () => {
    if (saveNewTaskButton) saveNewTaskButton.disabled = false;
  };

  // Disable save button initially
  if (saveNewTaskButton) saveNewTaskButton.disabled = true;

  if (!supabase) {
    console.error('Supabase client is not available.');
    // Potentially update UI to inform user
    return;
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Error fetching user or no user logged in:', userError);
    // Potentially update UI
    return;
  }

  const propertySelect = document.getElementById('taskPropertySelect');
  const staffSelect = document.getElementById('taskStaffSelect');

  if (!propertySelect || !staffSelect) {
    console.error('Property or Staff select dropdown not found.');
    return;
  }

  // Reset dropdowns to "Loading..."
  propertySelect.innerHTML = '<option value="" selected disabled>Loading properties...</option>';
  propertySelect.disabled = true;
  staffSelect.innerHTML = '<option value="" selected disabled>Loading staff...</option>';
  staffSelect.disabled = true;

  try {
    // Get company_id for the admin user
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (companyError || !companyData) {
      console.error('Error fetching company for admin or admin not linked to a company:', companyError);
      setDropdownError(propertySelect, 'Error loading properties (admin company issue).');
      setDropdownError(staffSelect, 'Error loading staff (admin company issue).');
      return;
    }
    const adminCompanyId = companyData.id;

    // Fetch properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, property_name')
      .eq('company_id', adminCompanyId);

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      setDropdownError(propertySelect, `Error: ${propertiesError.message}`);
    } else if (properties && properties.length > 0) {
      propertySelect.innerHTML = '<option value="" selected disabled>Select a property</option>';
      properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.id;
        option.textContent = prop.property_name;
        propertySelect.appendChild(option);
      });
      propertySelect.disabled = false;
    } else {
      setDropdownError(propertySelect, 'No properties found for your company.');
    }

    // Fetch staff members
    let staffMembers = [];
    const { data: companyStaff, error: staffError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_id') // Select company_id for verification
      .eq('company_id', adminCompanyId);

    if (staffError) {
      console.error('Error fetching staff members:', staffError);
      setDropdownError(staffSelect, `Error: ${staffError.message}`);
      // If properties loaded, save button might still be enabled by property logic.
      // So, ensure it's disabled if staff loading fails critically.
      if (saveNewTaskButton) saveNewTaskButton.disabled = true;
    } else {
      staffMembers = companyStaff || [];
    }

    // Fetch the admin's own profile to ensure they can be assigned
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_id')
      .eq('id', user.id)
      .single();

    if (adminProfileError) {
      console.error("Error fetching admin's profile:", adminProfileError);
      // Non-critical for the overall staff list if other staff loaded, but log it.
      // The admin might not appear if this fails.
    } else if (adminProfile) {
      // Ensure admin's company_id matches the one they are managing tasks for
      // This is important if an admin could theoretically be part of multiple companies in their profile,
      // but here we assume their primary company is the one linked via 'companies' table owner_id.
      // So, we check if their profile's company_id is the one we are currently managing.
      if (adminProfile.company_id === adminCompanyId) {
        const isAdminAlreadyInList = staffMembers.some(staff => staff.id === adminProfile.id);
        if (!isAdminAlreadyInList) {
          staffMembers.push({ // Push a consistent object structure
            id: adminProfile.id,
            first_name: adminProfile.first_name,
            last_name: adminProfile.last_name
            // company_id is not strictly needed for dropdown text but good for consistency
          });
        }
      } else {
        // This case implies admin's profile.company_id is not set or doesn't match adminCompanyId.
        // They might still want to assign to themselves if they are the owner.
        // For now, we require adminProfile.company_id to match adminCompanyId to be listed as staff of *this* company.
        // A more complex setup might allow an owner to self-assign even if their profile.company_id is different or null,
        // but that requires careful consideration of how staff are defined.
        // The current setup is: staff are profiles explicitly linked to the company via profiles.company_id.
         console.warn(`Admin's profile company_id (${adminProfile.company_id}) does not match the managed company_id (${adminCompanyId}). Admin will not be added to staff list based on this check.`);
      }
    }

    // Remove duplicates just in case (e.g. if admin was already fetched in companyStaff and then again)
    const uniqueStaffMap = new Map();
    staffMembers.forEach(staff => uniqueStaffMap.set(staff.id, staff));
    const uniqueStaffMembers = Array.from(uniqueStaffMap.values());


    if (uniqueStaffMembers.length > 0) {
      staffSelect.innerHTML = '<option value="" selected disabled>Assign to staff</option>';
      uniqueStaffMembers.forEach(staff => {
        const option = document.createElement('option');
        option.value = staff.id;
        option.textContent = `${staff.first_name || ''} ${staff.last_name || ''}`.trim() || 'Unnamed Staff';
        staffSelect.appendChild(option);
      });
      staffSelect.disabled = false;
    } else if (!staffError) { // Only show "No staff" if there wasn't a loading error
      setDropdownError(staffSelect, 'No staff found for your company (or admin profile mismatch).');
    }
    // If staffError occurred, staffSelect is already in an error state from above.

    // Enable save button only if both properties and staff were loaded (or handled, e.g., "No properties found" is a valid loaded state)
    // Check if both selects are not in an error state (i.e. enabled)
    if (!propertySelect.disabled && !staffSelect.disabled) {
      enableSaveButton();
    } else {
      // If either is still disabled (e.g. due to an error or "No items found" which also disables them via setDropdownError), keep save disabled.
      if (saveNewTaskButton) saveNewTaskButton.disabled = true;
    }

  } catch (error) {
    console.error('General error in populateCreateTaskModalDropdowns:', error);
    setDropdownError(propertySelect, 'Failed to load data.');
    setDropdownError(staffSelect, 'Failed to load data.');
    // Ensure save button is disabled on any general error
    if (saveNewTaskButton) saveNewTaskButton.disabled = true;
  }
}

// Asynchronous function to fetch tasks and related data from Supabase
async function fetchTasksAndRelatedData() {
  if (!window._supabase) {
    console.error("Supabase client is not available.");
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
      tasksTableBody.innerHTML = '<tr><td colspan="6">Error: Could not connect to the database. Please try again later.</td></tr>';
    }
    return [];
  }

  try {
    const { data: fetchedTasks, error } = await window._supabase
      .from('tasks')
      .select(`
        task_id,
        task_title,
        task_status,
        task_due_date,
        property_id,
        staff_id,
        properties ( property_name ),
        profiles ( first_name, last_name )
      `);

    if (error) {
      console.error("Error fetching tasks:", error);
      const tasksTableBody = document.getElementById('tasksTableBody');
      if (tasksTableBody) {
        tasksTableBody.innerHTML = `<tr><td colspan="6">Error fetching tasks: ${error.message}</td></tr>`;
      }
      return [];
    }

    if (!fetchedTasks) {
      return [];
    }

    const mappedTasks = fetchedTasks.map(task => ({
      id: task.task_id,
      title: task.task_title,
      property: task.properties ? task.properties.property_name : 'N/A',
      assignedTo: task.profiles ? `${task.profiles.first_name || ''} ${task.profiles.last_name || ''}`.trim() : 'N/A',
      status: task.task_status, // Keep original status for logic
      dueDate: task.task_due_date
    }));

    return mappedTasks;

  } catch (e) {
    console.error("Exception while fetching tasks:", e);
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
      tasksTableBody.innerHTML = `<tr><td colspan="6">An unexpected error occurred: ${e.message}</td></tr>`;
    }
    return [];
  }
}

// Function to format ISO date string to dd/MMM/yyyy
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) {
        const dateWithTime = new Date(isoDate + 'T00:00:00');
        if(isNaN(dateWithTime.getTime())) {
            console.error("Invalid date value:", isoDate);
            return 'Invalid Date';
        }
        const day = String(dateWithTime.getUTCDate()).padStart(2, '0');
        const month = dateWithTime.toLocaleString('default', { month: 'short', timeZone: 'UTC' }).toUpperCase();
        const year = dateWithTime.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", isoDate, error);
    return 'Invalid Date';
  }
}

// Function to render tasks into the table
function renderTasks(tasks) {
  const tasksTableBody = document.getElementById('tasksTableBody');
  if (!tasksTableBody) {
    console.error("Tasks table body not found!");
    return;
  }

  tasksTableBody.innerHTML = '';

  if (tasks.length === 0) {
    tasksTableBody.innerHTML = '<tr><td colspan="6">No tasks found.</td></tr>';
    return;
  }

  tasks.forEach(task => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-task-id', task.id);

    const tdTitle = document.createElement('td');
    tdTitle.textContent = task.title || 'N/A';
    tr.appendChild(tdTitle);

    const tdProperty = document.createElement('td');
    tdProperty.textContent = task.property || 'N/A';
    tr.appendChild(tdProperty);

    const tdAssignedTo = document.createElement('td');
    tdAssignedTo.textContent = task.assignedTo || 'N/A';
    tr.appendChild(tdAssignedTo);

    const tdStatus = document.createElement('td');
    const statusSpan = document.createElement('span');
    statusSpan.classList.add('badge-custom-base');
    let statusText = task.status || 'N/A'; // Default text

    // Normalize status for comparison and determine display text
    const lowerCaseStatus = (task.status || '').toLowerCase();

    switch (lowerCaseStatus) {
      case 'new':
        statusSpan.classList.add('badge-custom-blue');
        statusText = 'New';
        break;
      case 'not started':
        statusSpan.style.cssText = "background-color: #F1F3F4; color: #666666;";
        statusText = 'Not started';
        break;
      case 'in progress':
        statusSpan.classList.add('badge-custom-yellow');
        statusText = 'In progress'; // Matching filter option
        break;
      case 'completed': // Data might have "Completed"
      case 'done':      // Filter and display use "Done"
        statusSpan.classList.add('badge-custom-green');
        statusText = 'Done';
        break;
      case 'cancelled':
        statusSpan.classList.add('badge-custom-red');
        statusText = 'Cancelled';
        break;
      default:
        // For unknown statuses, use a generic badge or just base styling
        // statusSpan.classList.add('badge', 'bg-secondary'); // Option for Bootstrap's generic badge
        statusText = task.status || 'N/A'; // Show original status if not mapped
        break;
    }
    statusSpan.textContent = statusText;
    tdStatus.appendChild(statusSpan);
    tr.appendChild(tdStatus);

    const tdDueDate = document.createElement('td');
    tdDueDate.textContent = formatDate(task.dueDate);
    tr.appendChild(tdDueDate);

    const tdActions = document.createElement('td');

    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-sm btn-info me-1 view-task-btn';
    viewButton.innerHTML = '<i class="bi bi-eye"></i>';
    viewButton.setAttribute('data-task-id', task.id);
    viewButton.setAttribute('aria-label', 'View Task');
    tdActions.appendChild(viewButton);

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-sm btn-warning edit-task-btn';
    editButton.innerHTML = '<i class="bi bi-pencil"></i>';
    editButton.setAttribute('data-task-id', task.id);
    editButton.setAttribute('aria-label', 'Edit Task');
    tdActions.appendChild(editButton);

    tr.appendChild(tdActions);
    tasksTableBody.appendChild(tr);
  });
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Modal instances
  if (document.getElementById('viewTaskModal')) {
    viewTaskModalInstance = new bootstrap.Modal(document.getElementById('viewTaskModal'));
  }
  if (document.getElementById('editTaskModal')) {
    editTaskModalInstance = new bootstrap.Modal(document.getElementById('editTaskModal'));
  }
  const addNewTaskModalEl = document.getElementById('addNewTaskModal');
  if (addNewTaskModalEl) {
    addNewTaskModalInstance = new bootstrap.Modal(addNewTaskModalEl);
  }

  try {
    const userProfile = await getCurrentUserProfile();
    const isAdmin = userProfile ? userProfile.is_admin : false;
    console.log('User isAdmin status:', isAdmin); // For verification, can be removed later

    // Get DOM elements for staff filter container and add new task button container
    const staffFilterContainer = document.getElementById('staffFilterContainer');
    const addNewTaskBtnContainer = document.getElementById('addNewTaskBtnContainer');
    const addNewTaskBtn = document.getElementById('addNewTaskBtn'); // Still need the button itself for listener

    if (isAdmin) {
      if (staffFilterContainer) {
        staffFilterContainer.classList.remove('d-none');
      }
      if (addNewTaskBtnContainer) {
        addNewTaskBtnContainer.classList.remove('d-none');
      }
      // Add event listener for the "Add New Task" button if admin and button exists
      if (addNewTaskBtn && addNewTaskModalInstance) {
        addNewTaskBtn.addEventListener('click', async function() { // Made async
          try {
            await populateCreateTaskModalDropdowns(); // Call the new function
          } catch (error) {
            console.error("Error populating create task modal dropdowns:", error);
            // Modal will still open, dropdowns will show their error/loading state.
          }
          addNewTaskModalInstance.show();
        });
      }
    }

    const tasks = await fetchTasksAndRelatedData();
    renderTasks(tasks);
  } catch (error) {
    console.error('Error during page initialization, user profile fetching, or task fetching:', error);
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
      tasksTableBody.innerHTML = `<tr><td colspan="6">Failed to load tasks. Error: ${error.message}</td></tr>`;
    } else {
      alert("Failed to load tasks. Please check the console for more details.");
    }
  }

  // Setup event delegation for task actions (view/edit)
  const tasksTableBody = document.getElementById('tasksTableBody');
  if (tasksTableBody) {
    tasksTableBody.addEventListener('click', function(event) {
      const viewTarget = event.target.closest('.view-task-btn');
      if (viewTarget && viewTaskModalInstance) {
        const taskId = viewTarget.getAttribute('data-task-id');
        const viewTaskModalBody = document.getElementById('viewTaskModalBody');
        if (viewTaskModalBody) {
          viewTaskModalBody.innerHTML = `<p>Details for Task ID: ${taskId}</p><p><em>(Full details will be loaded here)</em></p>`;
        }
        viewTaskModalInstance.show();
      }

      const editTarget = event.target.closest('.edit-task-btn');
      if (editTarget && editTaskModalInstance) {
        const taskId = editTarget.getAttribute('data-task-id');
        const editTaskModalBody = document.getElementById('editTaskModalBody');
        if (editTaskModalBody) {
          editTaskModalBody.innerHTML = `<p>Editing Task ID: ${taskId}</p><p><em>(Edit form will go here)</em></p>`;
        }
        editTaskModalInstance.show();
      }
    });
  }

  // Event listener for the "Save Task" button in the "Add New Task" modal
  const saveNewTaskButton = document.getElementById('saveNewTaskBtn');
  if (saveNewTaskButton && addNewTaskModalInstance) {
    saveNewTaskButton.addEventListener('click', async function(event) {
      event.preventDefault(); // Good practice, though current button type isn't submit

      const title = document.getElementById('taskTitleInput').value.trim();
      const description = document.getElementById('taskDescriptionInput').value.trim();
      const dueDate = document.getElementById('taskDueDateInput').value;
      const priority = document.getElementById('taskPriorityInput').value; // New field
      const status = document.getElementById('taskStatusInput').value; // Changed ID
      const propertyId = document.getElementById('taskPropertySelect').value;
      const staffId = document.getElementById('taskStaffSelect').value;

      // Client-side validation
      if (!title) {
        alert('Task title is required.');
        return;
      }
      if (!propertyId) {
        alert('Please select a property.');
        saveNewTaskButton.disabled = false;
        saveNewTaskButton.textContent = 'Save Task';
        return;
      }
      if (!staffId) {
        alert('Please assign a staff member.');
        saveNewTaskButton.disabled = false;
        saveNewTaskButton.textContent = 'Save Task';
        return;
      }
      if (!priority) {
        alert('Please select a task priority.');
        saveNewTaskButton.disabled = false;
        saveNewTaskButton.textContent = 'Save Task';
        return;
      }
      if (!status) {
        alert('Please select a task status.');
        saveNewTaskButton.disabled = false;
        saveNewTaskButton.textContent = 'Save Task';
        return;
      }

      saveNewTaskButton.disabled = true;
      saveNewTaskButton.textContent = 'Saving...';

      const taskPayload = {
        task_title: title,
        task_description: description,
        task_due_date: dueDate || null,
        property_id: propertyId,
        staff_id: staffId,
        task_status: status, // Value from the new taskStatusInput
        task_priority: priority // Add new priority field
      };

      try {
        if (!window._supabase || !window._supabase.functions) {
          throw new Error('Supabase client or functions API is not available.');
        }

        const { data: responseData, error: functionError } = await window._supabase.functions.invoke('create-task', {
          body: taskPayload
        });

        if (functionError) {
          // Attempt to parse Supabase Edge Function error details if available
          let errMsg = functionError.message;
          if (functionError.context && functionError.context.error && functionError.context.error.message) {
            errMsg = functionError.context.error.message;
          } else if (typeof functionError === 'object' && functionError !== null && functionError.details) {
             errMsg = functionError.details;
          }
          throw new Error(`Function error: ${errMsg}`);
        }

        // Check for errors returned in the responseData structure itself
        // This depends on how your Edge Function is structured to return errors.
        // Assuming your function might return { error: "message" } for application-level errors
        if (responseData && responseData.error) {
          throw new Error(responseData.error);
        }

        // Assuming your function returns { success: true, ... } or similar for success
        // and might not have a specific success flag but implies success if no error.
        // If responseData is null or doesn't indicate success explicitly (and no error was thrown),
        // it might be an unexpected response from the function.
        if (!responseData) { // Or check for a specific success flag like !responseData.success
          throw new Error('Task creation failed or function returned an unexpected response. Please try again.');
        }

        // If functionError was null, but responseData indicates failure (e.g. through a specific field)
        // Example: if (responseData && responseData.status === 'error') { throw new Error(responseData.message); }


        alert('Task created successfully!'); // Replace with a nicer notification if available

        const createTaskForm = document.getElementById('createTaskForm');
        if (createTaskForm) {
          createTaskForm.reset();
        }

        addNewTaskModalInstance.hide();

        // Refresh the tasks list
        const tasks = await fetchTasksAndRelatedData();
        renderTasks(tasks);

      } catch (error) {
        console.error('Error creating task:', error);
        alert(`Error creating task: ${error.message}`); // Replace with a nicer notification
      } finally {
        saveNewTaskButton.disabled = false;
        saveNewTaskButton.textContent = 'Save Task';
      }
    });
  }
});
