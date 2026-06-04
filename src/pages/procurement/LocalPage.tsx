import React, { useEffect } from 'react';

export default function LocalPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderLocalView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
