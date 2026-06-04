import React, { useEffect } from 'react';

export default function DeadlinesPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderDeadlinesView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
