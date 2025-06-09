<<<<<<< SEARCH
      .select(`
        task_id,
        task_title,
        task_status,
        task_due_date,
        property_id,
        properties ( property_name ),
        task_assignments ( profiles!task_assignments_user_id_fkey ( first_name, last_name ) )
      `);

    if (error) {
=======
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
>>>>>>> REPLACE
<<<<<<< SEARCH
      if (task.task_assignments && task.task_assignments.length > 0) {
          const firstValidAssignment = task.task_assignments.find(ta => ta.profiles); // Find first assignment with a profile
          if (firstValidAssignment) {
              assignedToText = `${firstValidAssignment.profiles.first_name || ''} ${firstValidAssignment.profiles.last_name || ''}`.trim();
              if (!assignedToText) { // Handle case where profile names might be null or empty
                  assignedToText = 'Unnamed Assignee';
              }
              // Count only assignments that have a profile, to be accurate for "+X more"
              const validAssignmentsCount = task.task_assignments.filter(ta => ta.profiles).length;
              if (validAssignmentsCount > 1) {
                  assignedToText += ` (+${validAssignmentsCount - 1} more)`;
              } else if (validAssignmentsCount === 1 && task.task_assignments.length > 1) {
                  // Edge case: one valid profile, but other assignments without profiles
                  assignedToText += ` (+${task.task_assignments.length - 1} other assignments)`;
              }
          } else {
              // Assignments exist but no profiles could be fetched (e.g. RLS on profiles, or bad data)
              assignedToText = `Assigned (${task.task_assignments.length})`;
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
=======
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
>>>>>>> REPLACE
