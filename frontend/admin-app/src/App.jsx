import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';

// Import pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AgentManagement from './pages/admin/AgentManagement';
import TaskManagement from './pages/admin/TaskManagement';
import FileUpload from './pages/admin/FileUpload';
import AgentDashboard from './pages/agent/Dashboard';
import MyTasks from './pages/agent/MyTasks';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/agents" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <AgentManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/tasks" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <TaskManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/upload" element={
              <ProtectedRoute requiredRole="admin">
                <Layout>
                  <FileUpload />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Agent routes */}
            <Route path="/agent/dashboard" element={
              <ProtectedRoute requiredRole="agent">
                <Layout>
                  <AgentDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/agent/tasks" element={
              <ProtectedRoute requiredRole="agent">
                <Layout>
                  <MyTasks />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
