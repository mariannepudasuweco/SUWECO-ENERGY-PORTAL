import React, { useEffect } from 'react';

export default function RequestPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderRequestView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
