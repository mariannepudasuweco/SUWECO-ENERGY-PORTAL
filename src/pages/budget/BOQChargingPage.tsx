import React, { useEffect } from 'react';

export default function BOQChargingPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderBoqChargingView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
