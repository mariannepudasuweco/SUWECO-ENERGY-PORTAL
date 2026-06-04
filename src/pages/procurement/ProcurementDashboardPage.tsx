import React, { useEffect } from 'react';

export default function ProcurementDashboardPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderProcurementDashboard;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
