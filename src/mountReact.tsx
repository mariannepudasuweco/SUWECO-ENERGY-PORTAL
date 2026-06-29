import React from 'react';
import { createRoot } from 'react-dom/client';
import WbsSequenceView from './components/WbsSequenceView';
import ModernGanttChart from './components/ModernGanttChart';

import SmartCalendar from './components/SmartCalendar';

// Expose to window for vanilla JS to call, so it doesn't crash when falling back to vanilla JS navigation
(window as any).renderPayrollDashboard = () => {};
(window as any).renderEmployeeView = () => {};
(window as any).renderPayrollProcessingView = () => {};
(window as any)._mountWbsSequenceView = () => {};
(window as any).renderWbsSequenceView = () => {};

const rootMap = new Map();

(window as any)._mountWbsMapPreview = (elementId: string, projectName: string, selectedPhase: string = 'All') => {
  const el = document.getElementById(elementId);
  if (el) {
    if (rootMap.has(elementId)) {
      rootMap.get(elementId).unmount();
      rootMap.delete(elementId);
    }
    const root = createRoot(el);
    rootMap.set(elementId, root);
    root.render(<WbsSequenceView previewMode={false} projectName={projectName} selectedPhase={selectedPhase} />);
  }
};

(window as any)._mountModernTimeline = (elementId: string, tasksStr: string, tdFilterPhase: string) => {
  const el = document.getElementById(elementId);
  if (el) {
    if (rootMap.has(elementId)) {
      rootMap.get(elementId).unmount();
      rootMap.delete(elementId);
    }
    const root = createRoot(el);
    rootMap.set(elementId, root);
    
    let tasks = [];
    try {
      tasks = JSON.parse(tasksStr);
    } catch(e) {
      console.error(e);
    }

    const selProjId = (window as any).selectedProjectId;
    let projName = 'Project Timeline';
    if (selProjId && (window as any).projects) {
       const p = (window as any).projects.find((pr: any) => pr.id === selProjId);
       if (p) projName = p.title;
    }

    root.render(<ModernGanttChart tasks={tasks} selectedPhase={tdFilterPhase} projectName={projName} />);
  }
};

(window as any)._mountSmartCalendar = (elementId: string, tasksStr: string, tdFilterPhase: string) => {
  const el = document.getElementById(elementId);
  if (el) {
    if (rootMap.has(elementId)) {
      rootMap.get(elementId).unmount();
      rootMap.delete(elementId);
    }
    const root = createRoot(el);
    rootMap.set(elementId, root);
    
    let tasks = [];
    try {
      tasks = JSON.parse(tasksStr);
    } catch(e) {
      console.error(e);
    }

    root.render(<SmartCalendar tasks={tasks} selectedPhase={tdFilterPhase} />);
  }
};

