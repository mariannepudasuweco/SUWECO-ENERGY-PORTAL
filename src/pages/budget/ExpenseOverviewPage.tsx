import React, { useEffect } from 'react';

export default function ExpenseOverviewPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderExpenseOverview;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
