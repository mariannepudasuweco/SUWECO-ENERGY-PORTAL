import React, { useEffect } from 'react';

export default function ManilaPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderManilaView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
