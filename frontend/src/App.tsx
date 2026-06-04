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
import { WorklogList } from './pages/worklogs/WorklogList';
import { OverviewReport, ProjectReport, EmployeeReport } from './pages/reports/Reports';
import { UserList, AuditLogs } from './pages/PlaceholderPages';
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

        {/* Worklogs */}
        <Route path="/worklogs" element={<WorklogList />} />

        {/* Reports */}
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><OverviewReport /></ProtectedRoute>} />
        <Route path="/reports/project/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><ProjectReport /></ProtectedRoute>} />
        <Route path="/reports/employee/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROJECT_MANAGER']}><EmployeeReport /></ProtectedRoute>} />

        {/* Admin Only */}
        <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserList /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN']}><AuditLogs /></ProtectedRoute>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
