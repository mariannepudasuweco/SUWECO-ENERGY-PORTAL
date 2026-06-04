import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, parseISO, differenceInDays, addMonths, startOfMonth, endOfMonth, min, max, addDays, getDaysInMonth, startOfWeek, endOfWeek, isSameMonth, addYears, startOfYear, getDaysInYear, endOfYear } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Calendar, ChevronRight, Maximize2, Minimize2, Download, Search, ChevronLeft } from 'lucide-react';
import { useWbsData, NodeData } from '../hooks/useWbsData';

interface ModernGanttChartProps {
  tasks?: any[]; // Kept for backwards compatibility backwards with mountReact.tsx
  selectedPhase: string;
  projectName?: string;
}

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';


const STATUS_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  'COMPLETED': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  'ONGOING': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'DELAYED': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'NOT STARTED': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  'NOT YET STARTED': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  'NOT APPLICABLE': { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100' }
};

const STATUS_COLORS_BAR: Record<string, string> = {
  'COMPLETED': 'bg-emerald-500',
  'ONGOING': 'bg-blue-500',
  'DELAYED': 'bg-red-500',
  'NOT STARTED': 'bg-slate-400',
  'NOT YET STARTED': 'bg-slate-400',
  'NOT APPLICABLE': 'bg-slate-200'
};

export default function ModernGanttChart({ selectedPhase, projectName }: ModernGanttChartProps) {
  const { data: wbsData, getPhasesSummary, saveNode } = useWbsData();
  const phases = getPhasesSummary();

  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(phases.map(p => p.name)));
  const [selectedTask, setSelectedTask] = useState<NodeData | null>(null);
  
  // Filters and Toolbar State
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isTableExpanded, setIsTableExpanded] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Derive flat filtered tasks
  const filteredPhases = useMemo(() => {
    return phases.map(phase => {
        // filter children
        const children = phase.data.filter(t => {
            if (searchText) {
                const s = searchText.toLowerCase();
                if (!t.title.toLowerCase().includes(s) && !t.id.toLowerCase().includes(s)) return false;
            }
            if (statusFilter !== 'All' && t.stat !== statusFilter) return false;
            if (assigneeFilter !== 'All' && (t.owner || 'Unassigned') !== assigneeFilter) return false;
            return true;
        });
        
        return {
            ...phase,
            isMatch: selectedPhase === 'All' || phase.name === selectedPhase,
            children
        };
    }).filter(p => p.children.length > 0 || (p.isMatch && selectedPhase !== 'All'));
  }, [phases, searchText, statusFilter, assigneeFilter, selectedPhase, wbsData]);

  // Extract all Assignees for filter
  const allAssignees = useMemo(() => {
    const set = new Set<string>();
    phases.forEach(p => p.data.forEach(t => set.add(t.owner || 'Unassigned')));
    return Array.from(set).sort();
  }, [phases, wbsData]);

  // Extract all Dates for Timeline Bounds
  const timelineBounds = useMemo(() => {
    let start = new Date(new Date().getFullYear(), 0, 1);
    let end = new Date(new Date().getFullYear(), 11, 31);
    
    const dates: Date[] = [];
    phases.forEach(p => p.data.forEach(t => {
      try {
          if (t.s1 && t.s1 !== '-') dates.push(parseISO(t.s1));
          if (t.s2 && t.s2 !== '-') dates.push(parseISO(t.s2));
      } catch (e) {}
    }));
    
    const validDates = dates.filter(d => !isNaN(d.getTime()));
    
    if (viewMode === 'yearly') {
      if (validDates.length > 0) {
        let dataStart = startOfMonth(min(validDates));
        let dataEnd = endOfMonth(max(validDates));
        start = min([new Date(2026, 0, 1), dataStart]);
        end = max([new Date(2030, 11, 31), dataEnd]);
      } else {
        start = new Date(2026, 0, 1);
        end = new Date(2030, 11, 31);
      }
    } else {
      if (validDates.length > 0) {
        start = startOfMonth(min(validDates));
        end = endOfMonth(max(validDates));
      }
    }
    
    // Add padding
    start = addMonths(start, -1);
    end = addMonths(end, 2);

    if (viewMode === 'yearly') {
      start = startOfYear(start);
      end = addDays(startOfYear(addYears(end, 1)), -1); // End of the year
    }

    const totalDays = Math.max(1, differenceInDays(end, start));
    return { start, end, totalDays };
  }, [phases, wbsData, viewMode]);

  // Dependencies mapping
  const layoutMap = useMemo(() => {
    const map = new Map();
    let currentY = 0;
    filteredPhases.forEach(group => {
        currentY += 41; // group header
        if (expandedNodes.has(group.name)) {
            group.children.forEach(task => {
                let startPct = 0;
                let endPct = 0;
                let hasValidDate = false;
                try {
                    if (task.s1 && task.s1 !== '-' && task.s2 && task.s2 !== '-') {
                       const d1 = parseISO(task.s1);
                       const d2 = parseISO(task.s2);
                       startPct = (Math.max(0, differenceInDays(d1, timelineBounds.start)) / timelineBounds.totalDays) * 100;
                       endPct = (Math.max(0, differenceInDays(d2, timelineBounds.start)) / timelineBounds.totalDays) * 100;
                       hasValidDate = true;
                    } else if (task.s1 && task.s1 !== '-') {
                       const d1 = parseISO(task.s1);
                       startPct = (Math.max(0, differenceInDays(d1, timelineBounds.start)) / timelineBounds.totalDays) * 100;
                       endPct = startPct;
                       hasValidDate = true;
                    }
                } catch(e) {}
                
                if (hasValidDate) {
                   map.set(task.id, { startPct, endPct, y: currentY + 20 });
                }
                currentY += 40;
            });
        }
    });
    return map;
  }, [filteredPhases, expandedNodes, timelineBounds]);

  const dependencySvgLines = useMemo(() => {
     const lines: React.ReactNode[] = [];
     filteredPhases.forEach(group => {
         if (!expandedNodes.has(group.name)) return;
         group.children.forEach(task => {
             if (!task.dependencies || !Array.isArray(task.dependencies) || task.dependencies.length === 0) return;
             const toNode = layoutMap.get(task.id);
             if (!toNode) return;

             task.dependencies.forEach((depId, idx) => {
                 const fromNode = layoutMap.get(depId);
                 if (!fromNode) return;
                 const key = `dep-${task.id}-${depId}-${idx}`;
                 
                 lines.push(
                     <line key={key+'_1'} x1={`${fromNode.endPct}%`} y1={fromNode.y} x2={`${fromNode.endPct}%`} y2={toNode.y} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />,
                     <line key={key+'_2'} x1={`${fromNode.endPct}%`} y1={toNode.y} x2={`${toNode.startPct}%`} y2={toNode.y} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6} />,
                     <circle key={key+'_3'} cx={`${toNode.startPct}%`} cy={toNode.y} r="3.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
                 );
             });
         });
     });
     return lines;
  }, [filteredPhases, expandedNodes, layoutMap]);

  const toggleExpand = (phase: string) => {
    const newExp = new Set(expandedNodes);
    if (newExp.has(phase)) newExp.delete(phase);
    else newExp.add(phase);
    setExpandedNodes(newExp);
  };

  const expandAll = () => setExpandedNodes(new Set(phases.map(p => p.name)));
  const collapseAll = () => setExpandedNodes(new Set());

  const handleExportPDF = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    
    // 1. Prepare Gantt Element (force scroll sizes etc same as before)
    const element = exportRef.current;
    const tableContainer = document.getElementById('gantt-table-container');
    const leftPanel = tableContainer?.parentElement;
    const timelineContainer = document.getElementById('gantt-timeline-container');
    const ganttPane = document.getElementById('gantt-pane');
    const headers = document.getElementById('gantt-headers');

    let originalStyles: any = {};

    try {
      if (tableContainer && timelineContainer && ganttPane && headers && leftPanel) {
        originalStyles = {
          element: { width: element.style.width, height: element.style.height, overflow: element.style.overflow, flex: element.style.flex },
          left: { height: leftPanel.style.height, width: leftPanel.style.width },
          table: { height: tableContainer.style.height, overflow: tableContainer.style.overflow },
          timeline: { width: timelineContainer.style.width, height: timelineContainer.style.height, overflow: timelineContainer.style.overflow, flex: timelineContainer.style.flex },
          pane: { width: ganttPane.style.width, overflow: ganttPane.style.overflow, flex: ganttPane.style.flex },
          headers: { transform: headers.style.transform, width: headers.style.width, position: headers.style.position }
        };

        const totalHeight = Math.max(tableContainer.scrollHeight, timelineContainer.scrollHeight);
        const rightWidth = timelineContainer.scrollWidth;
        const leftWidth = leftPanel.offsetWidth;
        const totalWidth = leftWidth + rightWidth;

        element.style.width = `${totalWidth}px`;
        element.style.height = `${totalHeight + 50}px`;
        element.style.flex = 'none';
        element.style.overflow = 'visible';
        element.classList.remove('overflow-hidden');

        leftPanel.style.height = `${totalHeight + 50}px`;
        leftPanel.style.width = `${leftWidth}px`;
        
        tableContainer.style.height = `${totalHeight}px`;
        tableContainer.style.overflow = 'visible';
        tableContainer.classList.remove('overflow-y-auto');

        ganttPane.style.width = `${rightWidth}px`;
        ganttPane.style.flex = 'none';
        ganttPane.style.overflow = 'visible';
        ganttPane.classList.remove('overflow-hidden');

        timelineContainer.style.width = `${rightWidth}px`;
        timelineContainer.style.height = `${totalHeight}px`;
        timelineContainer.style.flex = 'none';
        timelineContainer.style.overflow = 'visible';
        timelineContainer.classList.remove('overflow-auto');

        headers.style.transform = 'none';
        headers.style.width = `${rightWidth}px`;
        headers.style.position = 'relative';

        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // 2. Create the Report Container (A3 Landscape Report Format)
      const tableWidth = leftPanel?.offsetWidth || 0;
      const timelineWidth = timelineContainer?.scrollWidth || 0;
      const chartTotalWidth = tableWidth + timelineWidth;
      
      const reportId = 'gantt-report-pdf-container';
      let reportContainer = document.getElementById(reportId);
      if (reportContainer) reportContainer.remove();
      
      reportContainer = document.createElement('div');
      reportContainer.id = reportId;
      reportContainer.className = 'pdf-export-report';
      
      // We set the report container width to accommodate the chart plus margins
      const reportContentWidth = Math.max(1680, chartTotalWidth + 120); 
      Object.assign(reportContainer.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: `${reportContentWidth}px`,
        zIndex: '-1'
      });

      const todayFormatted = format(new Date(), 'MMMM d, yyyy');
      
      reportContainer.innerHTML = `
        <div class="report-header">
          <h1 class="report-title">Gantt Chart for Permitting Report</h1>
          <p class="report-subtitle">Project Schedule Export</p>
        </div>
        
        <div class="report-meta">
          <div>PROJECT NAME: ${projectName || 'Mainstay Makati Project'}</div>
          <div style="text-align: center;">REPORT DATE: ${todayFormatted}</div>
          <div style="text-align: right;">LOCATION: ${projectName?.includes('Mainstay') ? 'Makati, Philippines' : 'Philippines'}</div>
        </div>
        
        <div id="report-chart-section" style="border: 0.5px solid #CBD5E1; border-radius: 4px; overflow: hidden; background: #ffffff;">
          <!-- Cloned Gantt goes here -->
        </div>
        
        <div class="footer-signatures">
          <div>Prepared by: <span class="signature-line"></span></div>
          <div>Approved by: <span class="signature-line"></span></div>
          <div>Date Printed: <span class="signature-line"></span></div>
        </div>
        
        <div class="page-number">Page 1 of 1</div>
      `;

      const chartSection = reportContainer.querySelector('#report-chart-section');
      if (chartSection) {
        const clonedGantt = element.cloneNode(true) as HTMLElement;
        clonedGantt.classList.add('gantt-pdf-export');
        clonedGantt.style.width = '100%';
        clonedGantt.style.height = 'auto';
        
        // Remove scrollbars and ensure visibility
        const nestedContainers = clonedGantt.querySelectorAll('[id^="gantt-"]');
        nestedContainers.forEach((el: any) => {
          el.style.overflow = 'visible';
          el.classList.remove('overflow-auto', 'overflow-y-auto', 'overflow-hidden');
        });
        
        chartSection.appendChild(clonedGantt);
      }

      document.body.appendChild(reportContainer);
      
      // Allow for render
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { jsPDF } = await import('jspdf');
      let imgData = '';
      
      try {
        const domToImage = (await import('dom-to-image-more')).default;
        imgData = await domToImage.toPng(reportContainer, {
          bgcolor: '#ffffff',
          scale: 1.5, // Better resolution
          width: reportContainer.offsetWidth,
          height: reportContainer.offsetHeight,
        });
      } catch (err) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(reportContainer, { 
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        imgData = canvas.toDataURL('image/png');
      }

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const imgRatio = img.width / img.height;
      
      // Target filling the A3 landscape width
      const margin = 10;
      const targetWidth = pdfWidth - (margin * 2);
      const targetHeight = targetWidth / imgRatio;
      
      // If the calculated height exceeds the page, scale down to fit height
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      if (targetHeight > (pdfHeight - (margin * 2))) {
         finalHeight = pdfHeight - (margin * 2);
         finalWidth = finalHeight * imgRatio;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save('gantt-chart-for-permitting-report.pdf');
      
      reportContainer.remove();

    } catch (err: any) {
      console.error('Export failed', err);
      alert('Export failed. Error: ' + (err?.message || err));
    } finally {
      // Restore styles
      if (Object.keys(originalStyles).length > 0 && tableContainer && timelineContainer && ganttPane && headers && leftPanel) {
        element.style.width = originalStyles.element.width;
        element.style.height = originalStyles.element.height;
        element.style.overflow = originalStyles.element.overflow;
        element.style.flex = originalStyles.element.flex;
        element.classList.add('overflow-hidden');

        leftPanel.style.height = originalStyles.left.height;
        tableContainer.style.height = originalStyles.table.height;
        tableContainer.style.overflow = originalStyles.table.overflow;
        tableContainer.classList.add('overflow-y-auto');

        ganttPane.style.width = originalStyles.pane.width;
        ganttPane.style.overflow = originalStyles.pane.overflow;
        ganttPane.style.flex = originalStyles.pane.flex;
        ganttPane.classList.add('overflow-hidden');

        timelineContainer.style.width = originalStyles.timeline.width;
        timelineContainer.style.height = originalStyles.timeline.height;
        timelineContainer.style.overflow = originalStyles.timeline.overflow;
        timelineContainer.style.flex = originalStyles.timeline.flex;
        timelineContainer.classList.add('overflow-auto');

        headers.style.transform = originalStyles.headers.transform;
        headers.style.width = originalStyles.headers.width;
        headers.style.position = originalStyles.headers.position;
      }
      setIsExporting(false);
    }
  };

  const updateTaskField = (task: NodeData, field: keyof NodeData, value: string) => {
    const updated = { ...task, [field]: value };
    saveNode(updated);
  };

  // Generate headers
  const headersHTML = useMemo(() => {
    const headers = [];
    let current = timelineBounds.start;
    
    if (viewMode === 'yearly') {
      let currentYear = startOfYear(timelineBounds.start);
      while (currentYear < timelineBounds.end) {
        const dInYear = getDaysInYear(currentYear);
        const widthPct = (dInYear / timelineBounds.totalDays) * 100 * zoomLevel;
        headers.push(
          <div key={format(currentYear, 'yyyy')} className="flex flex-col border-r border-slate-200 shrink-0" style={{ width: `${widthPct}%` }}>
            <div className="text-xs font-semibold text-slate-500 py-2 px-3 tracking-wider uppercase bg-slate-50 border-b border-slate-200 text-center">
              {format(currentYear, 'yyyy')}
            </div>
          </div>
        );
        currentYear = addYears(currentYear, 1);
      }
    } else if (viewMode === 'monthly') {
      // Group months by year
      let currentYearStart = startOfYear(current);
      while (currentYearStart < timelineBounds.end) {
        const yearEnd = endOfYear(currentYearStart);
        const monthsInYear = [];
        let monthIter = max([currentYearStart, timelineBounds.start]);
        const yearLoopEnd = min([yearEnd, timelineBounds.end]);
        
        while (monthIter <= yearLoopEnd) {
           monthsInYear.push(monthIter);
           monthIter = addMonths(monthIter, 1);
        }
        
        if (monthsInYear.length > 0) {
           const yearTotalDays = monthsInYear.reduce((acc, m) => {
              const start = max([startOfMonth(m), timelineBounds.start]);
              const end = min([endOfMonth(m), timelineBounds.end]);
              return acc + differenceInDays(end, start) + 1;
           }, 0);
           
           const yearWidthPct = (yearTotalDays / timelineBounds.totalDays) * 100 * zoomLevel;
           
           headers.push(
             <div key={format(currentYearStart, 'yyyy')} className="flex flex-col border-r border-slate-200 shrink-0" style={{ width: `${yearWidthPct}%` }}>
                <div className="text-[10px] font-bold text-slate-600 py-1 px-3 tracking-wider bg-slate-100/50 border-b border-slate-200 text-center uppercase">
                  {format(currentYearStart, 'yyyy')}
                </div>
                <div className="flex">
                  {monthsInYear.map(m => {
                    const dInMonth = getDaysInMonth(m);
                    const start = max([startOfMonth(m), timelineBounds.start]);
                    const end = min([endOfMonth(m), timelineBounds.end]);
                    const actualDays = differenceInDays(end, start) + 1;
                    const mWidthPct = (actualDays / yearTotalDays) * 100;
                    
                    return (
                      <div key={format(m, 'MMM')} className="border-r border-slate-200 last:border-r-0 py-1 text-[9px] font-semibold text-slate-500 bg-slate-50 text-center uppercase" style={{ width: `${mWidthPct}%` }}>
                        {format(m, 'MMM')}
                      </div>
                    );
                  })}
                </div>
             </div>
           );
        }
        currentYearStart = addYears(currentYearStart, 1);
      }
    } else if (viewMode === 'weekly') {
      let currentWeek = startOfWeek(timelineBounds.start);
      while (currentWeek < timelineBounds.end) {
        const widthPct = (7 / timelineBounds.totalDays) * 100 * zoomLevel;
        headers.push(
          <div key={format(currentWeek, 'yyyy-MM-dd')} className="flex flex-col border-r border-slate-200 shrink-0" style={{ width: `${widthPct}%` }}>
            <div className="text-[10px] font-semibold text-slate-500 py-2 px-1 tracking-wider uppercase bg-slate-50 border-b border-slate-200 truncate text-center">
              {format(currentWeek, 'MMM d')}
            </div>
          </div>
        );
        currentWeek = addDays(currentWeek, 7);
      }
    } else {
      let currentDay = timelineBounds.start;
      while (currentDay < timelineBounds.end) {
        const widthPct = (1 / timelineBounds.totalDays) * 100 * zoomLevel;
        headers.push(
          <div key={format(currentDay, 'yyyy-MM-dd')} className="flex flex-col border-r border-slate-200 shrink-0" style={{ width: `${widthPct}%` }}>
            <div className="text-[9px] font-semibold text-slate-500 py-2 px-0 text-center tracking-wider bg-slate-50 border-b border-slate-200">
              {format(currentDay, 'd')}
            </div>
          </div>
        );
        currentDay = addDays(currentDay, 1);
      }
    }
    return headers;
  }, [timelineBounds, viewMode, zoomLevel]);

  // Determine TODAY line
  const todayPct = useMemo(() => {
     let pct = (differenceInDays(new Date(), timelineBounds.start) / timelineBounds.totalDays) * 100;
     return Math.max(0, Math.min(pct, 100));
  }, [timelineBounds]);

  const getInitials = (name: string | undefined) => {
    if (!name || name === 'Unassigned') return 'UA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProgress = (task: NodeData) => {
    let tot = task.totalReqs || 0;
    if (tot === 0 && task.reqs) tot = task.reqs.split('<br/>').filter(r => r.trim() !== '').length;
    let acq = task.totalAcq || 0;
    if (task.totalAcq === undefined) {
       if (task.stat === 'COMPLETED') acq = tot;
       else if (task.stat === 'ONGOING') acq = Math.floor(tot / 2);
    }
    return tot > 0 ? Math.round((acq / tot) * 100) : (task.stat === 'COMPLETED' ? 100 : 0);
  };

  return (
    <div id="gantt-chart-container-capture" ref={containerRef} className={`flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-white' : 'h-[800px] max-h-full'}`}>
      
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-slate-200 bg-white relative z-20 gap-4">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {projectName && (
             <h2 className="text-lg font-bold text-slate-800 pr-4 md:border-r border-slate-200 uppercase whitespace-nowrap">
               {projectName}
             </h2>
          )}
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
               type="text" 
               placeholder="Search tasks..." 
               className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 w-full md:w-64"
               value={searchText}
               onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>
        
        {/* Actions & View Modifiers */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-wrap bg-slate-100 rounded-lg p-1 border border-slate-200">
            {(['daily', 'weekly', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
              <button
                type="button"
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button type="button" onClick={expandAll} className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors shrink-0">
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={collapseAll} className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors shrink-0">
              Collapse All
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-200"></div>

          <button 
            type="button"
            onClick={handleExportPDF}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 text-sm font-semibold ${isExporting ? 'bg-slate-50 text-slate-400' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <Download size={16} /> Export
          </button>

          <button 
             type="button"
             onClick={() => setIsFullscreen(!isFullscreen)} 
             className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors shrink-0 outline-none"
             title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
             {isFullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
          </button>
        </div>
      </div>

      {/* Main Gantt Body */}
      <div ref={exportRef} className={`flex flex-1 overflow-hidden relative ${isExporting ? 'bg-white gantt-pdf-export' : 'bg-slate-50'}`}>
        
        {/* LEFT: Task Table */}
        <div className={`${isTableExpanded ? 'w-[500px]' : 'w-[250px]'} transition-all duration-300 shrink-0 flex flex-col bg-white border-r z-30 ${isExporting ? 'border-slate-100 chart-border outer-border' : 'border-slate-200 shadow-[4px_0_12px_rgba(0,0,0,0.02)]'}`}>
          <div className={`px-4 py-0 border-b flex items-center h-[50px] ${isExporting ? 'border-slate-100 bg-white phase-row' : 'border-slate-200 bg-slate-50/50'}`}>
             <div className={`${isTableExpanded ? 'w-[45%]' : 'w-full'} flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider pr-2`}>
                 <span>TASK</span>
                 {!isExporting && (
                   <button onClick={() => setIsTableExpanded(!isTableExpanded)} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                       {isTableExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                   </button>
                 )}
             </div>
             {isTableExpanded && (
               <>
                 <div className="w-[15%] text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Start</div>
                 <div className="w-[15%] text-xs font-bold text-slate-700 uppercase tracking-wider text-center">End</div>
                 <div className="w-[15%] text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Status</div>
                 <div className="w-[10%] text-xs font-bold text-slate-700 uppercase tracking-wider text-center">Assign</div>
               </>
             )}
          </div>
          <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar" onScroll={(e) => {
             const timelineC = document.getElementById('gantt-timeline-container');
             if (timelineC) timelineC.scrollTop = e.currentTarget.scrollTop;
          }} id="gantt-table-container">
            {filteredPhases.map((group) => (
              <div key={group.name} className={`border-b border-slate-100 transition-opacity ${!group.isMatch && selectedPhase !== 'All' ? 'opacity-50' : ''}`}>
                <div 
                  className={`flex items-center gap-2 px-2 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${expandedNodes.has(group.name) ? 'bg-slate-50/80 sticky top-0 z-20 border-b border-slate-100 backdrop-blur-sm' : ''} group-row phase-row`}
                  onClick={() => toggleExpand(group.name)}
                >
                  <motion.div animate={{ rotate: expandedNodes.has(group.name) ? 90 : 0 }}>
                    <ChevronRight size={16} className="text-slate-400" />
                  </motion.div>
                  <div className="flex-1 font-bold text-xs text-slate-800 tracking-tight leading-tight uppercase flex items-center gap-2">
                    {group.name} {group.isMatch && selectedPhase !== 'All' && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Filtered</span>}
                  </div>
                </div>
                
                <AnimatePresence initial={false}>
                  {expandedNodes.has(group.name) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-white"
                    >
                      {group.children.map(task => (
                        <div key={task.id} className="flex items-center px-4 py-2 border-b border-slate-50 hover:bg-blue-50/40 transition-colors h-[40px] group gantt-row task-cell">
                           <div className={`${isTableExpanded ? 'w-[45%]' : 'w-full'} flex items-center gap-2 pr-2`}>
                             <div className="text-[11px] font-bold text-slate-400 min-w-[24px]">{task.id.replace(/[^0-9]/g,'')}</div>
                             <input 
                               value={task.title} 
                               onChange={(e) => updateTaskField(task, 'title', e.target.value)}
                               className="flex-1 text-xs font-semibold text-slate-700 bg-transparent border-b border-transparent focus:border-blue-300 outline-none truncate hover:border-slate-300 transition-colors"
                             />
                           </div>
                           {isTableExpanded && (
                             <>
                               <div className="w-[15%] px-1">
                                 <input 
                                   type="date" 
                                   value={task.s1 !== '-' ? task.s1 : ''} 
                                   onChange={(e) => updateTaskField(task, 's1', e.target.value)}
                                   className="w-full text-[10px] font-semibold text-slate-600 bg-transparent outline-none cursor-pointer" 
                                 />
                               </div>
                               <div className="w-[15%] px-1">
                                 <input 
                                   type="date" 
                                   value={task.s2 !== '-' ? task.s2 : ''} 
                                   onChange={(e) => updateTaskField(task, 's2', e.target.value)}
                                   className="w-full text-[10px] font-semibold text-slate-600 bg-transparent outline-none cursor-pointer" 
                                 />
                               </div>
                               <div className="w-[15%] flex justify-center">
                                  <select 
                                    value={task.stat} 
                                    onChange={(e) => updateTaskField(task, 'stat', e.target.value)}
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md outline-none cursor-pointer appearance-none text-center ${STATUS_COLORS[task.stat]?.bg || 'bg-slate-100'} ${STATUS_COLORS[task.stat]?.text || 'text-slate-600'}`}
                                  >
                                      <option value="NOT YET STARTED">Pending</option>
                                      <option value="ONGOING">In Progress</option>
                                      <option value="DELAYED">Overdue</option>
                                      <option value="COMPLETED">Completed</option>
                                  </select>
                               </div>
                               <div className="w-[10%] flex justify-center">
                                  <input 
                                     type="text"
                                     title={task.owner || 'Unassigned'}
                                     value={task.owner || ''}
                                     onChange={(e) => updateTaskField(task, 'owner', e.target.value)}
                                     className="w-full bg-transparent border-none outline-none text-[8px] font-bold text-center text-slate-600 placeholder:text-slate-300"
                                     placeholder="Unassigned"
                                  />
                               </div>
                             </>
                           )}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Timeline */}
        <div className="flex-1 flex flex-col relative bg-white overflow-hidden timeline-border" id="gantt-pane">
           <div className={`sticky top-0 z-20 flex h-[50px] overflow-hidden border-b ${isExporting ? 'bg-white border-slate-100 phase-row' : 'bg-slate-50 border-slate-200'}`} id="gantt-headers" style={{ width: `${zoomLevel * 100}%`}}>
              {headersHTML}
           </div>
           
           <div 
             className="flex-1 relative overflow-auto custom-scrollbar chart-border" 
             id="gantt-timeline-container"
             onScroll={(e) => {
               const tableC = document.getElementById('gantt-table-container');
               if (tableC) tableC.scrollTop = e.currentTarget.scrollTop;
               const headers = document.getElementById('gantt-headers');
               if (headers) headers.style.transform = `translateX(-${e.currentTarget.scrollLeft}px)`;
             }}
           >
              <div className="absolute inset-0 z-0 flex" style={{ width: `${zoomLevel * 100}%`}}>
                 {headersHTML.map((h, i) => (
                    <div key={i} className="border-r border-slate-100/50 h-full timeline-cell" style={{ width: h.props.style.width }}></div>
                 ))}
                 
                 {/* TODAY INDICATOR */}
                 <div 
                    className="absolute top-0 bottom-0 w-px bg-blue-500 z-20 pointer-events-none" 
                    style={{ left: `${todayPct}%` }}
                 >
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-b-md">
                        TODAY
                     </div>
                 </div>
              </div>

              <div className="relative z-10 flex flex-col w-full" style={{ width: `${zoomLevel * 100}%`}}>
                  <svg className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible" style={{ minHeight: '100%' }}>
                     {dependencySvgLines}
                  </svg>
                  {filteredPhases.map((group) => {
                     let minStart: Date | null = null;
                     let maxEnd: Date | null = null;
                     let allNoSchedule = true;
                     group.children.forEach(t => {
                        try {
                           if (t.s1 && t.s1 !== '-') {
                               const d1 = parseISO(t.s1);
                               if (!minStart || d1 < minStart) minStart = d1;
                               allNoSchedule = false;
                           }
                           if (t.s2 && t.s2 !== '-') {
                               const d2 = parseISO(t.s2);
                               if (!maxEnd || d2 > maxEnd) maxEnd = d2;
                               allNoSchedule = false;
                           }
                        } catch(e) {}
                     });
                     
                     let sumStartPct = 0;
                     let sumWidthPct = 0;
                     if (minStart && maxEnd) {
                         const daysFromStart = Math.max(0, differenceInDays(minStart, timelineBounds.start));
                         const durationDays = Math.max(1, differenceInDays(maxEnd, minStart));
                         sumStartPct = (daysFromStart / timelineBounds.totalDays) * 100;
                         sumWidthPct = (durationDays / timelineBounds.totalDays) * 100;
                     }

                    return (
                    <div key={group.name} className={`transition-opacity ${!group.isMatch && selectedPhase !== 'All' ? 'opacity-50' : ''}`}>
                       <div className="h-[41px] border-b border-transparent relative bg-slate-50/30 group-row">
                          {sumWidthPct > 0 && (
                             <div 
                               className="absolute top-3 h-3 bg-slate-800 rounded-sm"
                               style={{ left: `${sumStartPct}%`, width: `${sumWidthPct}%` }}
                             >
                                <div className="absolute top-0 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-slate-800"></div>
                                <div className="absolute top-0 -right-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-slate-800"></div>
                             </div>
                          )}
                       </div>
                       
                       <AnimatePresence initial={false}>
                          {expandedNodes.has(group.name) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                               {group.children.map(task => {
                                  let startPct = 0;
                                  let widthPct = 0;
                                  try {
                                    if (task.s1 && task.s1 !== '-' && task.s2 && task.s2 !== '-') {
                                        const tStart = parseISO(task.s1);
                                        const tDue = parseISO(task.s2);
                                        const daysFromStart = Math.max(0, differenceInDays(tStart, timelineBounds.start));
                                        const durationDays = Math.max(1, differenceInDays(tDue, tStart));
                                        startPct = (daysFromStart / timelineBounds.totalDays) * 100;
                                        widthPct = (durationDays / timelineBounds.totalDays) * 100;
                                    }
                                  } catch(e) {}
                                  
                                  const barColor = (task.stat === 'COMPLETED') ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                                                 : (task.stat === 'ONGOING') ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                                                 : (task.stat === 'DELAYED') ? 'bg-gradient-to-r from-red-500 to-red-400'
                                                 : 'bg-slate-400';
                                  const progress = getProgress(task);
                                  const hasNoSchedule = (!task.s1 || task.s1 === '-') && (!task.s2 || task.s2 === '-');

                                  return (
                                    <div key={task.id} className="relative h-[40px] hover:bg-slate-50/50 transition-colors border-b border-transparent group/bar gantt-row">
                                       {hasNoSchedule && (
                                         <div className="absolute top-2 left-2 flex items-center h-5 px-2 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-400 italic pointer-events-none sticky left-2">
                                            No schedule yet
                                         </div>
                                       )}
                                       {widthPct > 0 && !hasNoSchedule && (
                                         <div 
                                           className={`absolute top-2 h-5 shadow-sm rounded flex items-center overflow-hidden cursor-pointer hover:shadow-md hover:brightness-110 ${barColor}`}
                                           style={{ left: `${startPct}%`, width: `${widthPct}%`, minWidth: '4px' }}
                                           onClick={() => setSelectedTask(task)}
                                         >
                                            {/* Progress Fill inside Bar */}
                                            <div className="absolute inset-y-0 left-0 bg-white/30 border-r border-white/50 pointer-events-none" style={{ width: `${progress}%` }}></div>
                                            
                                            {widthPct > 2 && (
                                              <span className="relative z-10 px-2 text-[9px] font-bold text-white drop-shadow-sm pointer-events-none truncate select-none">
                                                {progress}%
                                              </span>
                                            )}
                                         </div>
                                       )}
                                       {widthPct === 0 && !hasNoSchedule && task.s1 && task.s1 !== '-' && (
                                          <div 
                                            className="absolute top-2 w-3 h-3 bg-blue-500 rotate-45 transform origin-center cursor-pointer hover:scale-125 transition-transform"
                                            style={{ left: `${(Math.max(0, differenceInDays(parseISO(task.s1), timelineBounds.start)) / timelineBounds.totalDays) * 100}%` }}
                                            onClick={() => setSelectedTask(task)}
                                            title="Milestone"
                                          ></div>
                                       )}
                                    </div>
                                  );
                               })}
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                  );
                 })}
              </div>
           </div>
        </div>
      </div>

      {/* FOOTER: Legend & Zoom */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 relative z-20">
         <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">Legend:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span className="text-[10px] font-semibold text-slate-600">Completed</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span className="text-[10px] font-semibold text-slate-600">In Progress</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-red-500"></div><span className="text-[10px] font-semibold text-slate-600">Overdue</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-slate-400"></div><span className="text-[10px] font-semibold text-slate-600">Pending</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 bg-blue-500 rotate-45"></div><span className="text-[10px] font-semibold text-slate-600">Milestone</span></div>
            </div>
         </div>
         <div className="flex items-center gap-3">
             <button type="button" onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.25))} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded shadow-sm"><Minimize2 size={14}/></button>
             <input type="range" min="0.5" max="3" step="0.1" value={zoomLevel} onChange={e => setZoomLevel(parseFloat(e.target.value))} className="w-24 accent-blue-600 outline-none" />
             <button type="button" onClick={() => setZoomLevel(z => Math.min(3, z + 0.25))} className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded shadow-sm"><Maximize2 size={14}/></button>
             <button type="button" onClick={() => setZoomLevel(1)} className="px-3 py-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 uppercase tracking-widest ml-2">Fit</button>
         </div>
      </div>

      {/* POPOVER DETAIL */}
      <AnimatePresence>
        {selectedTask && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.95, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95, y: 20 }}
             className="absolute bottom-[60px] right-[24px] w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-[100]"
           >
             <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white border border-slate-200 px-1.5 py-0.5 rounded">{selectedTask.id}</span>
                     <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{getPhasesSummary().find(p => p.data.some(t => t.id === selectedTask?.id))?.name || 'Unknown Phase'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">{selectedTask.title}</h3>
                </div>
                <button type="button" onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
             </div>
             <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Start Date</span>
                  <span className="font-bold text-slate-800">{selectedTask.s1 && selectedTask.s1 !== '-' ? format(parseISO(selectedTask.s1), 'MMM d, yyyy') : 'TBD'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">End Date</span>
                  <span className="font-bold text-slate-800">{selectedTask.s2 && selectedTask.s2 !== '-' ? format(parseISO(selectedTask.s2), 'MMM d, yyyy') : 'TBD'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Duration</span>
                  <span className="font-bold text-slate-800">{selectedTask.s1 && selectedTask.s1 !== '-' && selectedTask.s2 && selectedTask.s2 !== '-' ? `${Math.max(1, differenceInDays(parseISO(selectedTask.s2), parseISO(selectedTask.s1)))} days` : 'TBD'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                   <span className="font-semibold text-slate-500">Dependencies</span>
                   <span className="font-bold text-slate-800">{selectedTask.dependencies?.length ? selectedTask.dependencies.join(', ') : 'None'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                  <span className="font-semibold text-slate-500">Status</span>
                  <span className={`font-bold ${STATUS_COLORS[selectedTask.stat]?.text || 'text-slate-600'} flex items-center gap-1.5`}>
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS_BAR[selectedTask.stat] || 'bg-slate-400'}`}></div>
                      {selectedTask.stat === 'NOT YET STARTED' ? 'PENDING' : selectedTask.stat}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Assignee</span>
                  <div className="flex items-center gap-2">
                     <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[8px]">{getInitials(selectedTask.owner)}</div>
                     <span className="font-bold text-slate-800">{selectedTask.owner || 'Unassigned'}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-500">Progress</span>
                    <span className="font-bold text-slate-800">{getProgress(selectedTask)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                     <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${getProgress(selectedTask)}%`}}></div>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-500">Prerequisites / Checklist</span>
                    <span className="font-bold text-slate-800">{selectedTask.totalAcq || 0} / {selectedTask.totalReqs || (selectedTask.reqs ? selectedTask.reqs.split('<br/>').length : 0)}</span>
                  </div>
                  {selectedTask.reqs && (
                      <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto custom-scrollbar">
                         {selectedTask.reqs.split('<br/>').map((r, i) => (
                             <div key={i} className="flex gap-2 items-start text-[10px] text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                                <span className="leading-tight">{r}</span>
                             </div>
                         ))}
                      </div>
                  )}
                  {!selectedTask.reqs && (
                      <div className="text-[10px] text-slate-400 italic">No prerequisites specified.</div>
                  )}
                </div>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(203, 213, 225, 0.8); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-corner { background: transparent; }

        /* Clean PDF Export Styles */
        .pdf-export {
          background-color: white !important;
        }
        .pdf-export .bg-slate-50\\/50, 
        .pdf-export .bg-slate-50, 
        .pdf-export .bg-slate-100,
        .pdf-export .bg-blue-50\\/40,
        .pdf-export .hover\\:bg-slate-50\\/50,
        .pdf-export .hover\\:bg-blue-50\\/40 {
          background-color: white !important;
        }
        .pdf-export .border-slate-200,
        .pdf-export .border-slate-100 {
          border-color: #f1f5f9 !important; /* Very light gray */
        }
        .pdf-export .border-slate-100\\/50 {
          border-color: #f8fafc !important; /* Almost white line for timeline grid */
        }
        .pdf-export .font-bold {
          font-weight: 600 !important; /* Less heavy fonts */
        }
        .pdf-export .text-slate-700 {
          color: #475569 !important; 
        }
        .pdf-export .text-slate-800 {
          color: #334155 !important;
        }
        .pdf-export input {
          color: #334155 !important;
        }
        .pdf-export .text-xs {
          font-size: 0.65rem !important; /* Slightly smaller text for cleaner tables */
        }
        .pdf-export .text-\\[11px\\],
        .pdf-export .text-\\[10px\\] {
          font-size: 0.60rem !important;
        }
        .pdf-export .text-\\[9px\\],
        .pdf-export .text-\\[8px\\] {
          font-size: 0.50rem !important;
        }
        /* Make the today line softer */
        .pdf-export .bg-blue-500 {
          background-color: #93c5fd !important;
          width: 1px !important;
        }
        /* Invisible scrollbars for export */
        .pdf-export ::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
