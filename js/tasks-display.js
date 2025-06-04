// Global modal instances
let viewTaskModalInstance = null;
let editTaskModalInstance = null;

// Asynchronous function to fetch tasks and related data from Supabase
async function fetchTasksAndRelatedData() {
  console.log('[DEBUG] Entering fetchTasksAndRelatedData');
  if (!window._supabase) {
    console.error("Supabase client is not available.");
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
      tasksTableBody.innerHTML = '<tr><td colspan="6">Error: Could not connect to the database. Please try again later.</td></tr>';
    }
    return [];
  }

  try {
    console.log('[DEBUG] Supabase client (_supabase):', window._supabase);
    console.log('[DEBUG] About to query Supabase tasks...');
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

    console.log('[DEBUG] Supabase raw response - fetchedTasks:', fetchedTasks);
    console.log('[DEBUG] Supabase raw response - error:', error);

    if (error) {
      console.error("Error fetching tasks:", error);
      const tasksTableBody = document.getElementById('tasksTableBody');
      if (tasksTableBody) {
        tasksTableBody.innerHTML = `<tr><td colspan="6">Error fetching tasks: ${error.message}</td></tr>`;
      }
      return [];
    }

    if (!fetchedTasks) {
      // This case might be redundant if error is always set, but good for safety
      console.log('[DEBUG] No tasks fetched and no error reported, returning empty array.');
      return [];
    }

    const mappedTasks = fetchedTasks.map(task => ({
      id: task.task_id,
      title: task.task_title,
      property: task.properties ? task.properties.property_name : 'N/A',
      assignedTo: task.profiles ? `${task.profiles.first_name || ''} ${task.profiles.last_name || ''}`.trim() : 'N/A',
      status: task.task_status,
      dueDate: task.task_due_date
    }));

    console.log('[DEBUG] Mapped tasks:', mappedTasks);
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
  console.log('[DEBUG] Entering renderTasks with tasks:', tasks);
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
    tdStatus.textContent = task.status || 'N/A';
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

  try {
    const tasks = await fetchTasksAndRelatedData();
    renderTasks(tasks);
  } catch (error) { // Changed 'err' to 'error' to match usage
    console.error('[DEBUG] Error in DOMContentLoaded or during task fetching/rendering:', error);
    const tasksTableBody = document.getElementById('tasksTableBody');
    if (tasksTableBody) {
      tasksTableBody.innerHTML = `<tr><td colspan="6">Failed to load tasks. Error: ${error.message}</td></tr>`;
    } else {
      alert("Failed to load tasks. Please check the console for more details.");
    }
  }

  // Setup event delegation for task actions
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
});
