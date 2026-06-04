import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../hooks/useDashboard';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ROLES } from '../../lib/constants';
import { AdminDashboard } from './AdminDashboard';
import { PMDashboard } from './PMDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import { Navigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <PageWrapper>
        <PageHeader title="Dashboard" description="Loading your dashboard..." />
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size={48} />
        </div>
      </PageWrapper>
    );
  }

  if (error || !dashboard || !user) {
    return (
      <PageWrapper>
        <PageHeader title="Dashboard" />
        <div className="text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
          Failed to load dashboard data. Please try again.
        </div>
      </PageWrapper>
    );
  }

  const role = user.role;

  return (
    <PageWrapper>
      <PageHeader 
        title="Dashboard" 
        description={`Welcome back, ${user.name}. Here's what's happening.`} 
      />

      {role === ROLES.ADMIN && <AdminDashboard data={dashboard as any} />}
      {role === ROLES.PROJECT_MANAGER && <PMDashboard data={dashboard as any} />}
      {role === ROLES.EMPLOYEE && <EmployeeDashboard data={dashboard as any} />}
      {!Object.values(ROLES).includes(role as any) && <Navigate to="/login" replace />}
    </PageWrapper>
  );
};
