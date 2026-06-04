import React from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PageHeader } from '../components/shared/PageHeader';

export const UserList: React.FC = () => (
  <PageWrapper><PageHeader title="Users" description="Manage system users and roles." /></PageWrapper>
);

export const AuditLogs: React.FC = () => (
  <PageWrapper><PageHeader title="Audit Logs" description="System activity tracking." /></PageWrapper>
);

export const ProjectDetails: React.FC = () => (
  <PageWrapper><PageHeader title="Project Details" /></PageWrapper>
);

export const ProjectForm: React.FC = () => (
  <PageWrapper><PageHeader title="Project Form" /></PageWrapper>
);

export const TaskDetails: React.FC = () => (
  <PageWrapper><PageHeader title="Task Details" /></PageWrapper>
);

export const TaskForm: React.FC = () => (
  <PageWrapper><PageHeader title="Task Form" /></PageWrapper>
);
