import React, { useEffect } from 'react';

export default function ProjectsPage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = window.renderProjectsView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
