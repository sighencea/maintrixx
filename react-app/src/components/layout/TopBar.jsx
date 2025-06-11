import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../../context/AuthContext'; // Import useAuth

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate(); // For redirection
  const { user, isAdmin, signOut } = useAuth(); // Get signOut from AuthContext

  const [pageTitle, setPageTitle] = useState('Dashboard');
  // const isAdmin = localStorage.getItem('userIsAdmin') === 'true'; // Now using isAdmin from useAuth()

  const handleSidebarToggle = () => {
    document.getElementById('sidebar')?.classList.toggle('active');
    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
  };

  const handleSignOut = async () => {
    const { error } = await signOut(); // Call signOut from AuthContext
    if (error) {
      console.error('Error signing out:', error);
      // Optionally display an error to the user using a toast or alert component
    } else {
      navigate('/'); // Redirect to SignIn page (root) after sign out
    }
  };

  useEffect(() => {
    const pathTitleMapping = {
      '/pages/dashboard.html': 'Dashboard',
      '/pages/properties.html': 'Properties',
      '/pages/tasks.html': 'Tasks',
      '/pages/staff.html': 'Staff',
      '/pages/notifications.html': 'Notifications',
      '/pages/account.html': 'Account Settings',
      '/pages/agency_setup_page.html': 'Agency Setup'
    };
    setPageTitle(pathTitleMapping[location.pathname] || 'Property Hub');
  }, [location.pathname]);

  // Access Denied Modal Logic (remains the same as it relies on Bootstrap JS)
  const adminOnlyPages = ['/pages/dashboard.html', '/pages/properties.html', '/pages/staff.html'];
  // Use isAdmin from context now
  const isAccessingAdminPageAsNonAdmin = user && !isAdmin && adminOnlyPages.includes(location.pathname);

  useEffect(() => {
    const accessDeniedModalEl = document.getElementById('accessDeniedModal');
    if (accessDeniedModalEl) {
        if (typeof bootstrap !== 'undefined' && typeof bootstrap.Modal !== 'undefined') {
            const modalInstance = bootstrap.Modal.getInstance(accessDeniedModalEl) || new bootstrap.Modal(accessDeniedModalEl);
            if (isAccessingAdminPageAsNonAdmin) {
                if(modalInstance && typeof modalInstance.show === 'function') modalInstance.show();
            } else {
                if (modalInstance && typeof modalInstance.hide === 'function' && accessDeniedModalEl.classList.contains('show')) {
                     modalInstance.hide();
                }
            }
        } else {
            console.warn('Bootstrap Modal JS not available for accessDeniedModal control.');
        }
    }
    const redirectToTasksBtn = document.getElementById('redirectToTasksBtn');
    if(redirectToTasksBtn) {
        redirectToTasksBtn.onclick = () => { navigate('/pages/tasks.html'); }; // Use React Router navigate
    }
  }, [isAccessingAdminPageAsNonAdmin, navigate]);


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
        <span data-i18n={`${pageTitle.toLowerCase().replace(' ', '')}Page.header`}>{pageTitle}</span>
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
