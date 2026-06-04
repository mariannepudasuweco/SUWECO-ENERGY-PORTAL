import React from 'react';
import PayrollDashboard from '../../components/PayrollDashboard';

export default function PayrollDashboardPage({ selectedProjectId, selectedProjectName }: { selectedProjectId?: string | null; selectedProjectName?: string }) {
  return <PayrollDashboard selectedProjectId={selectedProjectId} selectedProjectName={selectedProjectName} />;
}
