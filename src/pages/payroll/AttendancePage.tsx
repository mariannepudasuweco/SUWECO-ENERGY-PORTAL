import React from 'react';
import PayrollProcessing from '../../components/PayrollProcessing';

export default function AttendancePage({ selectedProjectId, selectedProjectName }: { selectedProjectId?: string | null; selectedProjectName?: string }) {
  return <PayrollProcessing selectedProjectId={selectedProjectId} selectedProjectName={selectedProjectName} />;
}
