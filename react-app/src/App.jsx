import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import SignInPage from './pages/SignInPage';
import DashboardPage from './pages/DashboardPage';

// Placeholder for other pages that would use MainLayout
const PropertiesPage = () => <div>Properties Page (TODO)</div>;
const TasksPage = () => <div>Tasks Page (TODO)</div>;
const StaffPage = () => <div>Staff Page (TODO)</div>;
const NotificationsPage = () => <div>Notifications Page (TODO)</div>;
const AccountPage = () => <div>Account Settings Page (TODO)</div>;


function App() {
  // Simple auth check placeholder - replace with actual auth logic
  // For now, assume not authenticated, so always show SignInPage or allow direct nav for testing.
  // const isAuthenticated = false; // Example: get from context or localStorage

  return (
    <Router basename="/maintrixx"> {/* Set base path for GitHub Pages */}
      <Routes>
        {/* AuthLayout routes */}
        <Route path="/" element={<AuthLayout><SignInPage /></AuthLayout>} />

        {/* MainLayout routes - These are placeholders for now */}
        {/* In a real app, these would be protected routes */}
        <Route path="/pages/dashboard.html" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/pages/properties.html" element={<MainLayout><PropertiesPage /></MainLayout>} />
        <Route path="/pages/tasks.html" element={<MainLayout><TasksPage /></MainLayout>} />
        <Route path="/pages/staff.html" element={<MainLayout><StaffPage /></MainLayout>} />
        <Route path="/pages/notifications.html" element={<MainLayout><NotificationsPage /></MainLayout>} />
        <Route path="/pages/account.html" element={<MainLayout><AccountPage /></MainLayout>} />

        {/* Redirect index.html to root path if someone tries to access it directly */}
        <Route path="/index.html" element={<Navigate to="/" replace />} />

        {/* TODO: Add a 404 Not Found route */}
      </Routes>
    </Router>
  );
}

export default App;
