import React, { useEffect } from 'react';

const DashboardPage = () => {
  useEffect(() => {
    // Placeholder for logic from dashboard_check.js and admin-page-guard.js
    console.log('DashboardPage mounted - TODO: Implement dynamic data fetching and admin guard');
    // Hide/show elements based on data (e.g. #noTasksMessage, #noStaffMessage) will be handled by conditional rendering in React
  }, []);

  // Structure based on pages/dashboard.html content area
  return (
    <>
      <div id="welcomeMessage" className="container mt-3">Welcome!</div> {/* TODO: Make dynamic */}

      <div className="container mt-5">
        <div className="row mt-4">
          {/* Properties Card - TODO: Convert to component, fetch data */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0" data-i18n="dashboardPage.cardProperties.title">Properties</h5>
                  <a href="/pages/properties.html" className="card-link" data-i18n="dashboardPage.cardProperties.link">View Properties</a>
                </div>
                <p className="display-4" id="propertyCount">324</p> {/* Placeholder */}
              </div>
            </div>
          </div>
          {/* Tasks Card - TODO: Convert to component, fetch data */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0" data-i18n="dashboardPage.cardTasks.title">Tasks</h5>
                  <a href="/pages/tasks.html" className="card-link" data-i18n="dashboardPage.cardTasks.link">View Tasks</a>
                </div>
                <div id="taskCountsContainer">
                  <p className="card-text mb-1"><span id="tasksNewCount" className="fw-bold">0</span> <small className="text-muted fw-normal" data-i18n="dashboardPage.cardTasks.statusNew">New</small></p>
                  <p className="card-text mb-1"><span id="tasksInProgressCount" className="fw-bold">0</span> <small className="text-muted fw-normal" data-i18n="dashboardPage.cardTasks.statusInProgress">In Progress</small></p>
                  <p className="card-text"><span id="tasksCompletedCount" className="fw-bold">0</span> <small className="text-muted fw-normal" data-i18n="dashboardPage.cardTasks.statusCompleted">Completed</small></p>
                </div>
                <p id="noTasksMessage" className="card-text" style={{ display: 'none' }} data-i18n="dashboardPage.cardTasks.noTasks">You don't have any tasks in these categories yet.</p>
              </div>
            </div>
          </div>
          {/* Staff Card - TODO: Convert to component, fetch data */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0" data-i18n="dashboardPage.cardStaff.title">Staff</h5>
                  <a href="/pages/staff.html" className="card-link" data-i18n="dashboardPage.cardStaff.link">View Staff</a>
                </div>
                <p className="display-4" id="totalStaffCount">0</p> {/* Placeholder */}
                <div id="staffBreakdownContainer">
                  <p className="card-text mt-3 mb-1" data-i18n="dashboardPage.cardStaff.staffLabel" style={{ fontWeight: 'bold' }}>Staff:</p>
                  <ul style={{ listStyleType: 'none', paddingLeft: '15px', marginBottom: '0.5rem' }}>
                    <li><span id="staffElectricianCount" className="fw-bold">0</span> <small className="text-muted" data-i18n="dashboardPage.cardStaff.roleElectrician">Electrician(s)</small></li>
                    <li><span id="staffPlumberCount" className="fw-bold">0</span> <small className="text-muted" data-i18n="dashboardPage.cardStaff.rolePlumber">Plumber(s)</small></li>
                    <li><span id="staffCleanerCount" className="fw-bold">0</span> <small className="text-muted" data-i18n="dashboardPage.cardStaff.roleCleaner">Cleaner(s)</small></li>
                  </ul>
                  <p className="card-text mt-2 mb-1" data-i18n="dashboardPage.cardStaff.contractorsLabel" style={{ fontWeight: 'bold' }}>Contractors:</p>
                  <ul style={{ listStyleType: 'none', paddingLeft: '15px' }}>
                    <li><span id="staffContractorCount" className="fw-bold">0</span> <small className="text-muted" data-i18n="dashboardPage.cardStaff.roleContractor">Contractor(s)</small></li>
                  </ul>
                </div>
                <p id="noStaffMessage" className="card-text" style={{ display: 'none' }} data-i18n="dashboardPage.cardStaff.noStaff">You don't have any staff members yet.</p>
              </div>
            </div>
          </div>
        </div>
        <h3 className="mt-5 mb-3" data-i18n="dashboardPage.recentActivity.title">Recent Activity</h3>
        {/* Recent Activity Table - TODO: Convert to component, fetch data */}
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <tbody>
              {/* Placeholder rows */}
              <tr>
                <td style={{ width: '60px', textAlign: 'center', verticalAlign: 'middle' }}><i className="bi bi-person-circle fa-2x text-secondary"></i></td>
                <td>Alice Smith</td>
                <td>Added new property 'Ocean View Condo'</td>
                <td className="text-muted text-end" style={{ minWidth: '100px' }}>15m ago</td>
              </tr>
              {/* ... more static rows ... */}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
