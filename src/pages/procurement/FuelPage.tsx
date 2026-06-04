import React, { useEffect } from 'react';

export default function FuelPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderFuelView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
