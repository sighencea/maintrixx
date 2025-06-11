import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/layout/ProtectedRoute'; // Import ProtectedRoute
import SignInPage from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';
import PropertiesPage from './pages/PropertiesPage';
import TasksPage from './pages/TasksPage';
import StaffPage from './pages/StaffPage';
import NotificationsPage from './pages/NotificationsPage';
import AccountPage from './pages/AccountPage';

// Placeholder for agency setup page - will be created if not already.
const AgencySetupPage = () => <div>Agency Setup Page (TODO) - User should be redirected here if admin and company not set up.</div>;

function App() {
  return (
    <Router basename="/maintrixx"> {/* Set base path for GitHub Pages */}
      <Routes>
        {/* AuthLayout routes */}
        <Route path="/" element={<AuthLayout><SignInPage /></AuthLayout>} />

        {/* Protected MainLayout routes */}
        <Route
          path="/pages/dashboard.html"
          element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/pages/properties.html"
          element={<ProtectedRoute><MainLayout><PropertiesPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/pages/tasks.html"
          element={<ProtectedRoute><MainLayout><TasksPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/pages/staff.html"
          element={<ProtectedRoute><MainLayout><StaffPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/pages/notifications.html"
          element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/pages/account.html"
          element={<ProtectedRoute><MainLayout><AccountPage /></MainLayout></ProtectedRoute>}
        />

        {/* Placeholder for agency setup page - could also be protected or have its own logic */}
        <Route
          path="/pages/agency_setup_page.html"
          element={<ProtectedRoute><MainLayout><AgencySetupPage /></MainLayout></ProtectedRoute>}
        />

        {/* Redirect index.html to root path if someone tries to access it directly */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />

        {/* TODO: Add a 404 Not Found route: <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
