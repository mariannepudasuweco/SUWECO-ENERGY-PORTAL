import React, { useEffect } from 'react';

export default function LookAheadPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderLookAheadView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
