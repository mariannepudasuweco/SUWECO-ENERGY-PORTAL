import { useEffect } from 'react';

export default function InventoryPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderMaterialsView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
