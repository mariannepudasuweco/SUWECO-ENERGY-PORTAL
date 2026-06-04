import { useEffect } from 'react';

export default function ActivityHistoryPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderActivityHistoryView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
