import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const TopBar = () => {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  // Placeholder for admin status - replace with actual auth context or prop
  const isAdmin = localStorage.getItem('userIsAdmin') === 'true';

  const handleSidebarToggle = () => {
    // This is a direct DOM manipulation, common in transitioning vanilla JS.
    // A more React-idiomatic way would involve state management if Sidebar visibility affects other parts.
    document.getElementById('sidebar')?.classList.toggle('active');
    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
  };

  const handleSignOut = async () => {
    console.log('Sign out clicked - TODO: Implement Supabase sign out and redirect');
    // Example:
    // if (window._supabase) { // Access Supabase client appropriately
    //   const { error } = await window._supabase.auth.signOut();
    //   if (error) console.error("Error signing out:", error);
    //   localStorage.removeItem('userIsAdmin');
    //   window.location.href = '/maintrixx/'; // Or use React Router navigate
    // }
  };

  useEffect(() => {
    // Update page title based on route
    const pathTitleMapping = {
      '/pages/dashboard.html': 'Dashboard',
      '/pages/properties.html': 'Properties',
      '/pages/tasks.html': 'Tasks',
      '/pages/staff.html': 'Staff',
      '/pages/notifications.html': 'Notifications',
      '/pages/account.html': 'Account Settings'
    };
    setPageTitle(pathTitleMapping[location.pathname] || 'Property Hub');
  }, [location.pathname]);

  // Determine if the current page is an admin-only page that a non-admin is trying to access.
  // This is a simplified check. Proper route protection should be used.
  const adminOnlyPages = ['/pages/dashboard.html', '/pages/properties.html', '/pages/staff.html'];
  const isAccessingAdminPageAsNonAdmin = !isAdmin && adminOnlyPages.includes(location.pathname);

  useEffect(() => {
    // Show/hide access denied modal (simplified version of admin-page-guard.js)
    const accessDeniedModalEl = document.getElementById('accessDeniedModal');
    if (accessDeniedModalEl) { // Check if modal is on the page (it's in MainLayout)
        // Ensure Bootstrap's Modal class is available
        if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(accessDeniedModalEl) || new bootstrap.Modal(accessDeniedModalEl);
            if (isAccessingAdminPageAsNonAdmin) {
                modalInstance.show();
            } else {
                // Check if modal is shown before trying to hide, to prevent errors if not initialized or already hidden
                if (accessDeniedModalEl.classList.contains('show')) {
                     modalInstance.hide();
                }
            }
        } else {
            console.warn('Bootstrap Modal JS not available for accessDeniedModal control.');
        }
    }
    // Add redirect logic for the modal button
    const redirectToTasksBtn = document.getElementById('redirectToTasksBtn');
    if(redirectToTasksBtn) {
        redirectToTasksBtn.onclick = () => {
            // Use React Router navigation if available and preferred
            // For simplicity here, using window.location.href to match original potential behavior
            window.location.href = '/maintrixx/pages/tasks.html';
        };
    }

  }, [isAccessingAdminPageAsNonAdmin]);


  return (
    <div className="top-bar">
      <button
        className="btn d-lg-none me-2"
        type="button"
        id="sidebarToggler"
        aria-label="Toggle sidebar"
        onClick={handleSidebarToggle}
      >
        <i className="bi bi-list"></i>
      </button>
      <div className="page-title">
        <span data-i18n={`${pageTitle.toLowerCase()}Page.header`}>{pageTitle}</span>
      </div>
      <div className="top-bar-icons d-flex align-items-center">
        <Link to="/pages/notifications.html"><i className="bi bi-bell-fill"></i></Link>
        <div className="dropdown">
          <a className="dropdown-toggle dropdown-toggle-no-caret" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i className="bi bi-person-gear"></i>
          </a>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <Link className="dropdown-item" to="/pages/account.html">
                <i className="bi bi-gear-fill me-2"></i>Account Settings
              </Link>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item" onClick={handleSignOut} style={{ color: 'red' }}>
                <i className="bi bi-box-arrow-right me-2"></i>Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
