import React from 'react';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { PageHeader } from '../../components/shared/PageHeader';

export const OverviewReport: React.FC = () => (
  <PageWrapper><PageHeader title="Overview Report" description="System-wide metrics and breakdowns." /></PageWrapper>
);
export const ProjectReport: React.FC = () => (
  <PageWrapper><PageHeader title="Project Report" description="Detailed project statistics." /></PageWrapper>
);
export const EmployeeReport: React.FC = () => (
  <PageWrapper><PageHeader title="Employee Report" description="Employee performance metrics." /></PageWrapper>
);
