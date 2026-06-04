import React from 'react';
import EmployeeManagement from '../../components/EmployeeManagement';

export default function EmployeePage({ selectedProjectId }: { selectedProjectId?: string | null }) {
  return <EmployeeManagement selectedProjectId={selectedProjectId} />;
}
