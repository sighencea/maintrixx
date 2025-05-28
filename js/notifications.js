document.addEventListener('DOMContentLoaded', function() {
  // Mark as read functionality
  const markAsReadButtons = document.querySelectorAll('.mark-as-read-btn');
  markAsReadButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.stopPropagation(); // Prevent modal from triggering
      const notificationItem = this.closest('.list-group-item');
      if (notificationItem) {
        notificationItem.classList.add('notification-read');
        // Optional: Disable the 'Mark as read' button, change its text, or hide it
        // this.disabled = true;
        // If you want to hide the "Mark as read" button and only keep "Delete"
        // this.style.display = 'none'; 
      }
    });
  });

  // Delete functionality
  const deleteButtons = document.querySelectorAll('.delete-notification-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.stopPropagation(); // Prevent modal from triggering
      const notificationItem = this.closest('.list-group-item');
      if (notificationItem) {
        notificationItem.remove(); // Removes the notification item from the DOM
      }
    });
  });
});
