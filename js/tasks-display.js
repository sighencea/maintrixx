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
    } else if (adminProfile) {
      if (adminProfile.company_id === adminCompanyId) {
        const isAdminAlreadyInList = staffMembers.some(staff => staff.id === adminProfile.id);
        if (!isAdminAlreadyInList) {
          staffMembers.push({
            id: adminProfile.id,
            first_name: adminProfile.first_name,
            last_name: adminProfile.last_name
          });
        }
      } else {
         console.warn(`Admin's profile company_id (${adminProfile.company_id}) does not match the managed company_id (${adminCompanyId}). Admin will not be added to staff list based on this check.`);
      }
    }

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
    } else if (!staffError) {
      setDropdownError(staffSelect, 'No staff found for your company (or admin profile mismatch).');
    }

    if (!propertySelect.disabled && !staffSelect.disabled) {
      enableSaveButton();
    } else {
      if (saveNewTaskButton) saveNewTaskButton.disabled = true;
    }

  } catch (error) {
    console.error('General error in populateCreateTaskModalDropdowns:', error);
    setDropdownError(propertySelect, 'Failed to load data.');
    setDropdownError(staffSelect, 'Failed to load data.');
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
        properties ( property_name ),
        detailed_task_assignments ( assignee_first_name, assignee_last_name, assignee_user_id, assignee_email )
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

    const mappedTasks = fetchedTasks.map(task => {
      let assignedToText = 'Unassigned';
      if (task.detailed_task_assignments && task.detailed_task_assignments.length > 0) {
          const firstAssignment = task.detailed_task_assignments[0];

          if (firstAssignment && (firstAssignment.assignee_first_name || firstAssignment.assignee_last_name)) {
              assignedToText = `${firstAssignment.assignee_first_name || ''} ${firstAssignment.assignee_last_name || ''}`.trim();
              if (!assignedToText) {
                  assignedToText = 'Unnamed Assignee';
              }
              const uniqueAssigneeIds = new Set(task.detailed_task_assignments.map(asn => asn.assignee_user_id));
              if (uniqueAssigneeIds.size > 1) {
                  assignedToText += ` (+${uniqueAssigneeIds.size - 1} more)`;
              }
          } else if (firstAssignment) {
               assignedToText = 'Unnamed Assignee'; // Assignee exists but names are blank
          } else {
              assignedToText = 'Assignee(s) (Details Hidden)';
          }
      }

      return {
        id: task.task_id,
        title: task.task_title,
        property: task.properties ? task.properties.property_name : 'N/A',
        assignedTo: assignedToText,
        status: task.task_status, // Keep original status for logic
        dueDate: task.task_due_date
      };
    });

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
        statusText = 'In progress';
        break;
      case 'completed':
      case 'done':
        statusSpan.classList.add('badge-custom-green');
        statusText = 'Done';
        break;
      case 'cancelled':
        statusSpan.classList.add('badge-custom-red');
        statusText = 'Cancelled';
        break;
      default:
        statusText = task.status || 'N/A';
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

document.addEventListener('DOMContentLoaded', async () => {
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
    console.log('User isAdmin status:', isAdmin);

    const staffFilterContainer = document.getElementById('staffFilterContainer');
    const addNewTaskBtnContainer = document.getElementById('addNewTaskBtnContainer');
    const addNewTaskBtn = document.getElementById('addNewTaskBtn');

    if (isAdmin) {
      if (staffFilterContainer) {
        staffFilterContainer.classList.remove('d-none');
      }
      if (addNewTaskBtnContainer) {
        addNewTaskBtnContainer.classList.remove('d-none');
      }
      if (addNewTaskBtn && addNewTaskModalInstance) {
        addNewTaskBtn.addEventListener('click', async function() {
          try {
            await populateCreateTaskModalDropdowns();
          } catch (error) {
            console.error("Error populating create task modal dropdowns:", error);
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

  const saveNewTaskButton = document.getElementById('saveNewTaskBtn');
  if (saveNewTaskButton && addNewTaskModalInstance) {
    saveNewTaskButton.addEventListener('click', async function(event) {
      event.preventDefault();

      const title = document.getElementById('taskTitleInput').value.trim();
      const description = document.getElementById('taskDescriptionInput').value.trim();
      const dueDate = document.getElementById('taskDueDateInput').value;
      const priority = document.getElementById('taskPriorityInput').value;
      const status = document.getElementById('taskStatusInput').value;
      const propertyId = document.getElementById('taskPropertySelect').value;
      const staffId = document.getElementById('taskStaffSelect').value;

      if (!title) {
        alert('Task title is required.');
        return;
      }
      if (!propertyId) {
        alert('Please select a property.');
        return;
      }
      if (!staffId) {
        alert('Please assign a staff member.');
        return;
      }
      if (!priority) {
        alert('Please select a task priority.');
        return;
      }
      if (!status) {
        alert('Please select a task status.');
        return;
      }

      saveNewTaskButton.disabled = true;
      saveNewTaskButton.textContent = 'Saving...';

      const taskPayload = {
        task_title: title,
        task_description: description,
        task_due_date: dueDate || null,
        property_id: propertyId,
        staff_id: staffId, // This will be used for task_assignments in the Edge Function
        task_status: status,
        task_priority: priority
      };

      try {
        if (!window._supabase || !window._supabase.functions) {
          throw new Error('Supabase client or functions API is not available.');
        }

        const { data: responseData, error: functionError } = await window._supabase.functions.invoke('create-task', {
          body: taskPayload
        });

        if (functionError) {
          let errMsg = functionError.message;
          if (functionError.context && functionError.context.error && functionError.context.error.message) {
            errMsg = functionError.context.error.message;
          } else if (typeof functionError === 'object' && functionError !== null && functionError.details) {
             errMsg = functionError.details;
          }
          throw new Error(`Function error: ${errMsg}`);
        }

        if (responseData && responseData.error) {
          throw new Error(responseData.error);
        }

        if (!responseData) {
          throw new Error('Task creation failed or function returned an unexpected response. Please try again.');
        }

        const createTaskForm = document.getElementById('createTaskForm');
        if (createTaskForm) {
          createTaskForm.reset();
        }

        addNewTaskModalInstance.hide();

        const tasks = await fetchTasksAndRelatedData();
        renderTasks(tasks);

      } catch (error) {
        console.error('Error creating task:', error);
        alert(`Error creating task: ${error.message}`);
      } finally {
        saveNewTaskButton.disabled = false;
        saveNewTaskButton.textContent = 'Save Task';
      }
    });
  }
});
