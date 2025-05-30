document.addEventListener('DOMContentLoaded', function() {
  const activeNotificationsList = document.getElementById('activeNotificationsList');
  const inactiveNotificationsList = document.getElementById('inactiveNotificationsList');
  const activeNotificationsPlaceholder = document.getElementById('activeNotificationsPlaceholder');
  const inactiveNotificationsPlaceholder = document.getElementById('inactiveNotificationsPlaceholder');
  const markAllReadBtn = document.getElementById('markAllReadBtn'); // Added this line
  const showActiveNotificationsBtn = document.getElementById('showActiveNotifications');
  const showInactiveNotificationsBtn = document.getElementById('showInactiveNotifications');

  function updateEmptyStatePlaceholders() {
    if (!activeNotificationsList || !activeNotificationsPlaceholder || !inactiveNotificationsList || !inactiveNotificationsPlaceholder) {
        // If any element is missing (e.g. due to dynamic page changes not anticipated), exit to prevent errors.
        // This might happen if the script is loaded on a page without these elements.
        console.warn("Notification list or placeholder elements not found. Skipping empty state update.");
        return; 
    }

    // Check Active Notifications
    if (activeNotificationsList.children.length === 0) {
      activeNotificationsList.style.display = 'none';
      activeNotificationsPlaceholder.style.display = 'block'; 
    } else {
      activeNotificationsList.style.display = 'block'; 
      activeNotificationsPlaceholder.style.display = 'none';
    }

    // Check Inactive Notifications
    if (inactiveNotificationsList.children.length === 0) {
      inactiveNotificationsList.style.display = 'none';
      inactiveNotificationsPlaceholder.style.display = 'block';
    } else {
      inactiveNotificationsList.style.display = 'block';
      inactiveNotificationsPlaceholder.style.display = 'none';
    }
  }

  function handleNotificationAction(event) {
    const targetButton = event.target;
    const notificationItem = targetButton.closest('.list-group-item');

    if (!notificationItem) return;

    let itemMoved = false;

    // Handle "Mark as read" / "Mark as unread" clicks
    if (targetButton.classList.contains('mark-as-read-btn')) {
      event.stopPropagation(); 
      notificationItem.classList.add('notification-read');
      targetButton.textContent = i18next.t('notificationsJs.markUnread');
      targetButton.classList.remove('mark-as-read-btn', 'btn-outline-secondary');
      targetButton.classList.add('mark-as-unread-btn', 'btn-secondary');
      
      inactiveNotificationsList.appendChild(notificationItem); 
      itemMoved = true;

    } else if (targetButton.classList.contains('mark-as-unread-btn')) {
      event.stopPropagation(); 
      notificationItem.classList.remove('notification-read');
      targetButton.textContent = i18next.t('notificationsJs.markRead');
      targetButton.classList.remove('mark-as-unread-btn', 'btn-secondary');
      targetButton.classList.add('mark-as-read-btn', 'btn-outline-secondary');

      activeNotificationsList.appendChild(notificationItem); 
      itemMoved = true;
    }

    // Handle "Delete" clicks
    if (targetButton.classList.contains('delete-notification-btn')) {
      event.stopPropagation(); 
      notificationItem.remove();
      itemMoved = true; // Treat deletion as a list change
    }

    if (itemMoved) {
      updateEmptyStatePlaceholders();
    }
  }

  if (activeNotificationsList) {
    activeNotificationsList.addEventListener('click', handleNotificationAction);
  }
  if (inactiveNotificationsList) {
    inactiveNotificationsList.addEventListener('click', handleNotificationAction);
  }

  // Initial empty state check
  updateEmptyStatePlaceholders(); 

  // Default view: Show active notifications, hide inactive.
  // updateEmptyStatePlaceholders will then refine visibility based on content.
  if (activeNotificationsList) activeNotificationsList.style.display = 'block';
  if (inactiveNotificationsList) inactiveNotificationsList.style.display = 'none';
  // Call again to ensure placeholders are correctly set based on the default view AND content
  updateEmptyStatePlaceholders(); 
  // Initial button styles (Active as primary) are set in HTML.

  if (showActiveNotificationsBtn) {
    showActiveNotificationsBtn.addEventListener('click', function() {
      if (inactiveNotificationsList) inactiveNotificationsList.style.display = 'none'; // Hide inactive first
      if (activeNotificationsList) activeNotificationsList.style.display = 'block';   // Show active
      
      showActiveNotificationsBtn.classList.add('btn-primary');
      showActiveNotificationsBtn.classList.remove('btn-outline-secondary');
      
      if (showInactiveNotificationsBtn) {
        showInactiveNotificationsBtn.classList.add('btn-outline-secondary');
        showInactiveNotificationsBtn.classList.remove('btn-primary');
      }
      
      updateEmptyStatePlaceholders(); 
    });
  }

  if (showInactiveNotificationsBtn) {
    showInactiveNotificationsBtn.addEventListener('click', function() {
      if (activeNotificationsList) activeNotificationsList.style.display = 'none';     // Hide active first
      if (inactiveNotificationsList) inactiveNotificationsList.style.display = 'block'; // Show inactive
      
      if (showActiveNotificationsBtn) {
        showActiveNotificationsBtn.classList.add('btn-outline-secondary');
        showActiveNotificationsBtn.classList.remove('btn-primary');
      }
      
      showInactiveNotificationsBtn.classList.add('btn-primary');
      showInactiveNotificationsBtn.classList.remove('btn-outline-secondary');
      
      updateEmptyStatePlaceholders(); 
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function() {
      const itemsToMarkRead = Array.from(activeNotificationsList.querySelectorAll('.list-group-item'));
      
      if (itemsToMarkRead.length === 0) {
        // Optionally, provide feedback if there's nothing to mark as read
        // console.log("No active notifications to mark as read.");
        return; 
      }

      itemsToMarkRead.forEach(item => {
        // Add .notification-read class to the list item
        item.classList.add('notification-read');
        
        // Find the "Mark as read" button within this item
        const button = item.querySelector('.mark-as-read-btn'); // Only target unread buttons
        if (button) {
          button.textContent = i18next.t('notificationsJs.markUnread');
          button.classList.remove('mark-as-read-btn', 'btn-outline-secondary');
          button.classList.add('mark-as-unread-btn', 'btn-secondary');
        }
        
        // Move the item to the inactive list
        inactiveNotificationsList.appendChild(item);
      });
      
      updateEmptyStatePlaceholders();
    });
  }

  // Final empty state check based on initially displayed list (active)
  // updateEmptyStatePlaceholders(); // This call is already present after setting default view.
});
