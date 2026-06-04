import React, { useEffect, useState } from 'react';
import AIMeetingRecorder from '../../components/tools/AIMeetingRecorder';

export default function AIMeetingRecorderPage() {
  const [projectsList, setProjectsList] = useState<any[]>([]);

  useEffect(() => {
    const updateProjects = () => {
      if ((window as any).projects && Array.isArray((window as any).projects)) {
        setProjectsList([...(window as any).projects]);
      }
    };
    updateProjects();
    const interval = setInterval(updateProjects, 1000);
    window.addEventListener('projectsUpdated', updateProjects);
    return () => {
      clearInterval(interval);
      window.removeEventListener('projectsUpdated', updateProjects);
    };
  }, []);

  return (
    <div className="p-6">
      <AIMeetingRecorder projectsList={projectsList} />
    </div>
  );
}
