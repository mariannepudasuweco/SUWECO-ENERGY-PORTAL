import React, { useEffect } from 'react';

export default function TaskPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderTaskDashboardView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
