import React, { useState, useMemo } from 'react';
import { 
  format, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, 
  startOfMonth, endOfMonth, isSameMonth, isToday, isSameDay, parseISO, 
  isBefore, isAfter, differenceInDays
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, AlertCircle, CheckCircle2, AlertTriangle,
  User, Briefcase, FileText, ChevronDown, ListCheck, X
} from 'lucide-react';

interface Task {
  wbs: string;
  name: string;
  phase: string;
  dept: string;
  owner: string;
  status: string;
  start: string;
  due: string;
  progress?: number;
  isOverdue?: boolean | "";
  priority?: string;
  isBlocked?: boolean;
  blockedBy?: string | string[];
}

interface SmartCalendarProps {
  tasks: Task[];
  selectedPhase: string;
}

export default function SmartCalendar({ tasks, selectedPhase }: SmartCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Try to find the earliest 'ONGOING' or 'NOT STARTED' task date, or just stick to early 2026 based on mock data
    const activeTasks = tasks.filter(t => t.due && t.status !== 'COMPLETED');
    if (activeTasks.length > 0) {
      const earliest = activeTasks.map(t => new Date(t.due)).sort((a, b) => a.getTime() - b.getTime())[0];
      return startOfMonth(earliest);
    }
    return startOfMonth(new Date(2026, 2, 1)); // March 2026 default
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDateTasks, setSelectedDateTasks] = useState<{date: Date, tasks: Task[]} | null>(null);

  // Filter tasks based on global phase filter if active
  const filteredTasks = useMemo(() => {
    if (!selectedPhase || selectedPhase === 'All') return tasks;
    return tasks.filter(t => t.phase === selectedPhase);
  }, [tasks, selectedPhase]);

  // Enrich tasks with metadata
  const enrichedTasks = useMemo(() => {
    const today = new Date(2026, 2, 15); // Mock today as Mid-March 2026 for realistic data visualization
    
    return filteredTasks.map(t => {
      const isOverdue = t.status !== 'COMPLETED' && t.due && isBefore(parseISO(t.due), today);
      
      // Calculate progress loosely
      let progress = 0;
      if (t.status === 'COMPLETED') progress = 100;
      else if (t.status === 'ONGOING') progress = 50;
      
      // Mock Priority
      let priority = 'Normal';
      if (t.phase.includes('PRE-DEVELOPMENT')) priority = 'High';
      if (isOverdue) priority = 'Critical';
      
      // Add fake dependency logic based on WBS
      const parts = t.wbs.split('.');
      let isBlocked = false;
      let blockedBy = '';
      if (parts.length > 1 && parseInt(parts[1]) > 1) {
        const prevWbs = `${parts[0]}.${parseInt(parts[1]) - 1}`;
        const prevTask = tasks.find(pt => pt.wbs === prevWbs);
        if (prevTask && prevTask.status !== 'COMPLETED') {
          isBlocked = true;
          blockedBy = prevTask.name;
        }
      }

      return {
        ...t,
        progress,
        isOverdue,
        priority,
        isBlocked,
        blockedBy
      };
    });
  }, [filteredTasks, tasks]);

  // Calendar dates
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date(2026, 2, 15));

  // Determine styles for task pill
  const getTaskStatusInfo = (t: any) => {
    if (t.status === 'COMPLETED') return { color: 'bg-emerald-400' };
    if (t.isOverdue) return { color: 'bg-red-400' };
    if (t.status === 'ONGOING') return { color: 'bg-blue-400' };
    if (t.name.toLowerCase().includes('milestone')) return { color: 'bg-purple-400' };
    if (t.status === 'NOT STARTED' || t.status === 'PENDING') return { color: 'bg-slate-400' };
    return { color: 'bg-orange-400' };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[800px] w-full text-slate-900 rounded-xl overflow-hidden font-sans">
      
      {/* Top Header & Dashboard Stats */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Project Calendar Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Intelligent scheduling, deadines, and permit coordination
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100 min-w-[100px]">
            <span className="text-xl font-black text-emerald-700">{enrichedTasks.filter(t => t.status === 'COMPLETED').length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Done</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 min-w-[100px]">
            <span className="text-xl font-black text-amber-700">{enrichedTasks.filter(t => t.status === 'ONGOING').length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Active</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-red-50 px-4 py-2 rounded-lg border border-red-100 min-w-[100px]">
            <span className="text-xl font-black text-red-700">{enrichedTasks.filter(t => t.isOverdue).length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Delayed</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-6 gap-6">
        
        {/* Left Sidebar: Upcoming & Overdue View */}
        <div className="hidden lg:flex w-80 flex-col gap-6 overflow-y-auto custom-scrollbar">
          
          <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden flex flex-col max-h-[300px]">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-red-900 text-sm">Critical Attention</h3>
            </div>
            <div className="p-2 flex flex-col gap-2 overflow-y-auto">
              {enrichedTasks.filter(t => t.isOverdue || t.isBlocked).length === 0 && (
                 <div className="text-sm p-4 text-slate-500 text-center">No critical issues</div>
              )}
              {enrichedTasks.filter(t => t.isOverdue || t.isBlocked).map(t => (
                <div 
                  key={t.wbs}
                  onClick={() => setSelectedTask(t)}
                  className="bg-white border text-left border-red-100 p-3 rounded-lg hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">{t.name}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-bold text-red-600 uppercase">
                      {t.isOverdue ? 'Overdue' : 'Blocked'}
                    </span>
                    <span className="text-[10px] text-slate-500">{t.due}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Upcoming Deadlines</h3>
            </div>
            <div className="p-2 flex flex-col gap-2 overflow-y-auto">
              {enrichedTasks.filter(t => !t.isOverdue && t.status !== 'COMPLETED' && t.due).sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime()).slice(0, 5).map(t => (
                <div 
                  key={t.wbs}
                  onClick={() => setSelectedTask(t)}
                  className="bg-white border text-left border-slate-100 p-3 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-1">{t.name}</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 mt-2 overflow-hidden shadow-inner">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${t.progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                    <span>Due: {t.due}</span>
                    <span>WBS {t.wbs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Main Calendar View */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-[600px]">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button type="button" onClick={prevMonth} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <button type="button" onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors">Today Target</button>
              <button type="button" onClick={nextMonth} className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="py-2.5 text-center text-[11px] font-black tracking-widest text-slate-400">
                {day}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden bg-slate-200 gap-px">
            {days.map((day, i) => {
              const strDate = format(day, 'yyyy-MM-dd');
              const dayTasks = enrichedTasks.filter(t => t.due === strDate);
              const isMonth = isSameMonth(day, monthStart);
              // We simulate today for visual accuracy since our data is around 2026-03-15
              const isSimulatedToday = isSameDay(day, new Date(2026, 2, 15));

              return (
                <div 
                  key={i} 
                  className={`${isMonth ? 'bg-white' : 'bg-slate-50/50'} relative p-2 flex flex-col min-h-[100px] hover:bg-blue-50/30 transition-colors`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isSimulatedToday ? 'bg-blue-600 text-white shadow-md' : (isMonth ? 'text-slate-700' : 'text-slate-400')}`}>
                      {format(day, dateFormat)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 flex-1">
                    {dayTasks.slice(0, 3).map((t, idx) => {
                      const statusInfo = getTaskStatusInfo(t);
                      return (
                        <div 
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}
                          className="bg-white border border-slate-200 p-1.5 rounded-md hover:border-slate-300 hover:shadow-md hover:-translate-y-px transition-all cursor-pointer group flex flex-col gap-1"
                          title={t.name}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusInfo.color}`}></span>
                              <span className="text-[10px] font-semibold text-slate-700 truncate">{t.name}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 flex-shrink-0">{t.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div className={`h-1 flex-shrink-0 ${statusInfo.color}`} style={{ width: `${t.progress}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); setSelectedDateTasks({ date: day, tasks: dayTasks }); }}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 cursor-pointer px-1 mt-auto pb-0.5"
                      >
                        + {dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Task Expansion Panel (Slide Out) */}
      <AnimatePresence>
        {selectedTask && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTask(null)}
              className="absolute inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            />
            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%', boxShadow: '-20px 0 25px -5px rgba(0, 0, 0, 0)' }}
              animate={{ x: 0, boxShadow: '-20px 0 25px -5px rgba(0, 0, 0, 0.1)' }}
              exit={{ x: '100%', boxShadow: '-20px 0 25px -5px rgba(0, 0, 0, 0)' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-[450px] bg-white z-50 flex flex-col border-l border-slate-200"
            >
              {/* Header */}
              <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase text-white bg-slate-800 mb-3 tracking-widest shadow-sm">
                    {selectedTask.wbs}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {selectedTask.name}
                  </h2>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-900 rounded-full shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* Status & Priority */}
                <div className="flex gap-4">
                  <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Status</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        selectedTask.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        selectedTask.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedTask.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Priority / Risk</p>
                    <div className="flex items-center gap-2">
                       {selectedTask.isOverdue ? (
                           <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">Critical Delay</span>
                       ) : selectedTask.isBlocked ? (
                           <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">Blocked Prereq</span>
                       ) : (
                           <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Normal</span>
                       )}
                    </div>
                  </div>
                </div>

                {/* Progress Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <ListCheck className="w-4 h-4 text-slate-400" /> Progress Timeline & Completion
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-600 mb-2">
                      <span>Completion</span>
                      <span className="font-bold text-slate-900">{selectedTask.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                      <div 
                        className={`h-2 rounded-full ${selectedTask.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${selectedTask.progress}%` }}
                      ></div>
                    </div>
                    {selectedTask.isBlocked && (
                       <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                         <strong>Blocked:</strong> Waiting for preceding WBS task "<span className="italic">{selectedTask.blockedBy}</span>" to complete.
                       </div>
                    )}
                  </div>
                </div>

                {/* Schedule Details */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-slate-400" /> Schedule Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border text-center border-slate-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Start</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedTask.start || 'TBD'}</p>
                    </div>
                    <div className={`bg-white border text-center rounded-lg p-3 ${selectedTask.isOverdue ? 'border-red-300 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : 'border-slate-200'}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target End (Due)</p>
                      <p className={`text-sm font-semibold ${selectedTask.isOverdue ? 'text-red-700' : 'text-slate-800'}`}>
                        {selectedTask.due || 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meta details */}
                <div className="space-y-4 pt-2">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline Phase</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTask.phase}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Department
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTask.dept || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Assigned Personnel
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{selectedTask.owner || 'Not Assigned'}</p>
                  </div>
                </div>

              </div>
              
              {/* Footer action */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                 <button type="button" onClick={() => alert("Normally this opens the detailed tracker or edit modal.")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm shadow-sm transition-colors">
                   Update Progress
                 </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Small List Modal for "+ more" */}
      <AnimatePresence>
        {selectedDateTasks && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDateTasks(null)}
              className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex justify-center items-center p-4"
            >
               <motion.div
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 onClick={(e) => e.stopPropagation()}
                 className="bg-white rounded-xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden border border-slate-200"
               >
                 <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">
                      Tasks for {format(selectedDateTasks.date, 'MMMM d, yyyy')}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setSelectedDateTasks(null)}
                      className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 p-1 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                 </div>
                 <div className="p-4 flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {selectedDateTasks.tasks.map((t, idx) => {
                      const statusInfo = getTaskStatusInfo(t);
                      return (
                        <div 
                           key={idx}
                           onClick={() => {
                             setSelectedDateTasks(null);
                             setSelectedTask(t);
                           }}
                           className="bg-white border border-slate-200 p-2 rounded-lg hover:border-blue-300 hover:shadow-md hover:-translate-y-px transition-all cursor-pointer group flex flex-col gap-1.5"
                         >
                           <div className="flex items-center justify-between gap-2 w-full">
                             <div className="flex items-center gap-2 overflow-hidden">
                               <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusInfo.color}`}></span>
                               <span className="text-xs font-semibold text-slate-800 truncate">{t.name}</span>
                             </div>
                             <span className="text-[10px] font-bold text-slate-500 flex-shrink-0">{t.progress}%</span>
                           </div>
                           <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                             <div className={`h-1.5 flex-shrink-0 ${statusInfo.color}`} style={{ width: `${t.progress}%` }}></div>
                           </div>
                         </div>
                      );
                    })}
                 </div>
               </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
