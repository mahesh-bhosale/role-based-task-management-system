import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectsPage } from './pages/projects/ProjectsPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { ProjectFormPage } from './pages/projects/ProjectFormPage';
import { TasksPage } from './pages/tasks/TasksPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { TaskFormPage } from './pages/tasks/TaskFormPage';
import { WorkLogsPage } from './pages/worklogs/WorkLogsPage';
import { MyWorkLogsPage } from './pages/worklogs/MyWorkLogsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ReportsOverviewPage } from './pages/reports/ReportsOverviewPage';
import { UsersPage } from './pages/users/UsersPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-slate-950"><LoadingSpinner size={48} /></div>;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Projects */}
        <Route path="/projects" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><ProjectFormPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/projects/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><ProjectFormPage /></ProtectedRoute>} />

        {/* Tasks */}
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><TaskFormPage /></ProtectedRoute>} />
        <Route path="/tasks/:id/edit" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><TaskFormPage /></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />

        {/* Worklogs — Admin/PM see full list, Employees see their own */}
        <Route path="/worklogs" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><WorkLogsPage /></ProtectedRoute>} />
        <Route path="/my-worklogs" element={<ProtectedRoute allowedRoles={['EMPLOYEE']}><MyWorkLogsPage /></ProtectedRoute>} />

        {/* Reports */}
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/reports/overview" element={<ProtectedRoute allowedRoles={['ADMIN']}><ReportsOverviewPage /></ProtectedRoute>} />

        {/* Admin Only */}
        <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
