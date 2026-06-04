import React, { useEffect, useState } from 'react';
import SmartCalendar from '../../components/SmartCalendar';

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Access the mockTasks from vanilla-logic
      const wTasks = (window as any).mockTasks || [];
      setTasks(wTasks);
      
      // Update sidebar visibility state so standard logic knows we are in calendar
      if ((window as any).currentView !== 'calendar') {
        (window as any).currentView = 'calendar';
        if (typeof (window as any).updateSubNavVisibility === 'function') {
          (window as any).updateSubNavVisibility();
        }
      }
    }
  }, []);

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      <SmartCalendar tasks={tasks} selectedPhase="All" />
    </div>
  );
}
