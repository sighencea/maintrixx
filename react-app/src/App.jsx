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
import NotFoundPage from './pages/NotFoundPage'; // Import NotFoundPage
import AgencySetupPage from './pages/AgencySetupPage'; // Import AgencySetupPage

// Placeholder for agency setup page - will be created if not already.
// const AgencySetupPage = () => <div>Agency Setup Page (TODO) - User should be redirected here if admin and company not set up.</div>;

function App() {
  return (
    <Router basename="/maintrixx"> {/* Set base path for GitHub Pages */}
      <Routes>
        {/* AuthLayout routes */}
        <Route path="/" element={<AuthLayout><SignInPage /></AuthLayout>} />

        {/* Protected MainLayout routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/properties"
          element={<ProtectedRoute><MainLayout><PropertiesPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/tasks"
          element={<ProtectedRoute><MainLayout><TasksPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/staff"
          element={<ProtectedRoute><MainLayout><StaffPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/notifications"
          element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>}
        />
        <Route
          path="/account"
          element={<ProtectedRoute><MainLayout><AccountPage /></MainLayout></ProtectedRoute>}
        />
        {/* Property Details Page Route - Placeholder */}
        <Route
          path="/property-details/:propertyId"
          element={<ProtectedRoute><MainLayout><NotFoundPage /></MainLayout></ProtectedRoute>}
        />
        {/* Agency setup page route */}
        <Route
          path="/agency-setup"
          element={<ProtectedRoute><MainLayout><AgencySetupPage /></MainLayout></ProtectedRoute>}
        />

        {/* Redirect index.html to root path if someone tries to access it directly */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />

        {/* 404 Not Found route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
