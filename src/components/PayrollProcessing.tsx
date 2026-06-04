import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Users, FileText, CheckCircle, ChevronRight, ChevronLeft, Printer, Save, DollarSign, TrendingUp, ChevronDown, Download } from 'lucide-react';
import PayrollAuth from './PayrollAuth';
import { toast, Toaster } from 'sonner';
import { ACTIVITIES, calculateDays, calculateEmployeePayroll, formatCurrency } from '../lib/payrollUtils';
import { generatePrintInternalHTML, generatePrintManpowerInternalHTML } from '../lib/payrollPrinting';
import { supabase } from '../lib/supabaseClient';

interface PayrollProcessingProps {
  selectedProjectId?: string | null;
  selectedProjectName?: string;
}

export default function PayrollProcessing({ selectedProjectId, selectedProjectName }: PayrollProcessingProps = {}) {
  const activeProjectId = selectedProjectId || (window as any).currentProjectId || '';
  const [activeTab, setActiveTab] = useState<'history' | 'attendance' | 'manpower'>('history');
  const [wizardStep, setWizardStep] = useState(0);
  const [payrollStatus, setPayrollStatus] = useState<'NOT_GENERATED' | 'GENERATED'>('NOT_GENERATED');

  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [bulkDay, setBulkDay] = useState<number>(-1);
  const [bulkActivity, setBulkActivity] = useState<string>('-');
  const [allocations, setAllocations] = useState<Record<string, Record<number, string>>>({});
  const [projectName, setProjectName] = useState(selectedProjectName || '');
  const [weekStart, setWeekStart] = useState('2026-04-12');
  const [weekEnd, setWeekEnd] = useState('2026-04-18');
  const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
  const [printAttendanceDropdownOpen, setPrintAttendanceDropdownOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'crs' | 'payslips' | 'html' | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [preparedBy, setPreparedBy] = useState('MARY ROSE BELGA');
  const [adjForm, setAdjForm] = useState<any>({
    restDayHours: '', restDayOtHours: '', specialHolidayHours: '', specialHolidayOtHours: '',
    specialHolidayRestDayHours: '', specialHolidayRestDayOtHours: '', regularHolidayHours: '', regularHolidayOtHours: '',
    regularHolidayRestDayHours: '', regularHolidayRestDayOtHours: '', ordinaryNightHours: '', restDayNightHours: '',
    specialHolidayNightHours: '', specialHolidayRestDayNightHours: '', regularHolidayNightHours: '', regularHolidayRestDayNightHours: '',
    ordinaryNightOtHours: '', restDayNightOtHours: '', specialHolidayNightOtHours: '', specialHolidayRestDayNightOtHours: '',
    regularHolidayNightOtHours: '', regularHolidayRestDayNightOtHours: ''
  });

  useEffect(() => {
    if (selectedProjectName) {
      setProjectName(selectedProjectName);
    } else if (activeProjectId && (window as any).projects) {
      const p = (window as any).projects.find((pr: any) => pr.id === activeProjectId);
      if (p) {
        setProjectName(p.title);
      }
    }
  }, [activeProjectId, selectedProjectName]);

  useEffect(() => {
  loadPayrollEmployees();
}, [activeProjectId]);

const buildAttendanceRow = (emp: any) => ({
  id: emp.id,
  name: emp.full_name || `${emp.first_name || ''} ${emp.surname || ''}`.trim(),
  position: emp.position || '',
  rate: Number(emp.daily_rate || 0),
  location: emp.location || '',
  days: ['A', 'X', 'X', 'X', 'X', 'X', 'A'],
  ot: '',
  ut: '',
  sss: String(emp.sss_contribution || 0),
  philhealth: String(emp.philhealth_contribution || 0),
  pagibig: String(emp.pagibig_contribution || 0),
  tax: String(emp.tax_contribution || 0),
  adjustments: {
    restDayHours: '', restDayOtHours: '', specialHolidayHours: '', specialHolidayOtHours: '',
    specialHolidayRestDayHours: '', specialHolidayRestDayOtHours: '', regularHolidayHours: '', regularHolidayOtHours: '',
    regularHolidayRestDayHours: '', regularHolidayRestDayOtHours: '', ordinaryNightHours: '', restDayNightHours: '',
    specialHolidayNightHours: '', specialHolidayRestDayNightHours: '', regularHolidayNightHours: '', regularHolidayRestDayNightHours: '',
    ordinaryNightOtHours: '', restDayNightOtHours: '', specialHolidayNightOtHours: '', specialHolidayRestDayNightOtHours: '',
    regularHolidayNightOtHours: '', regularHolidayRestDayNightOtHours: ''
  }
});

const loadPayrollEmployees = async () => {
  if (!activeProjectId) {
    setEmployees([]);
    setAttendance([]);
    return;
  }

  const { data, error } = await supabase
    .from('payroll_employees')
    .select('*')
    .eq('project_id', activeProjectId)
    .order('created_at', { ascending: false });

  console.log('LOAD ATTENDANCE EMPLOYEES:', data);
  console.log('LOAD ATTENDANCE EMPLOYEES ERROR:', error);

  if (error) {
    toast.error('Failed to load employees.');
    console.error(error);
    return;
  }

  const mappedEmployees = data || [];

  setEmployees(mappedEmployees);
  setAttendance(mappedEmployees.map(buildAttendanceRow));
};

  useEffect(() => {
  loadPayrollRuns();
}, [activeProjectId]);

const loadPayrollRuns = async () => {
  if (!activeProjectId) {
    setHistory([]);
    return;
  }

  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('project_id', activeProjectId)
    .order('created_at', { ascending: false });

  console.log('LOAD PAYROLL RUNS:', data);
  console.log('LOAD PAYROLL RUNS ERROR:', error);

  if (error) {
    toast.error('Failed to load payroll history.');
    console.error(error);
    return;
  }

  const mappedRuns = (data || []).map(row => ({
    id: row.id,
    period: row.period,
    dateGenerated: row.date_generated,
    employeesCount: row.employees_count || 0,
    totalGross: Number(row.total_gross || 0),
    status: row.status,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    projectName: row.project_name,
    projectId: row.project_id,
    allocations: row.allocations || {},
    attendance: row.attendance || [],
    selectedEmployees: row.selected_employees || []
  }));

  setHistory(mappedRuns);
};

  const applyDeductionsToSelected = () => {
    if (selectedEmployees.length === 0) return;
    setAttendance(prev => prev.map(emp => {
      if (selectedEmployees.includes(emp.id)) {
        const employeeRecord = employees.find(e => e.id === emp.id);
        if (employeeRecord && employeeRecord.statutory) {
          return {
            ...emp,
            sss: employeeRecord.statutory.sss || '0',
            philhealth: employeeRecord.statutory.philhealth || '0',
            pagibig: employeeRecord.statutory.pagibig || '0',
            tax: employeeRecord.statutory.tax || '0'
          };
        }
      }
      return emp;
    }));
  };

  const getAllocatedDaysCount = (empId: string) => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
       if (allocations[empId]?.[i] && allocations[empId]?.[i] !== '-') count++;
    }
    return count;
  };

  const handleAttendanceChange = (empId: string, field: string, value: string) => {
    setAttendance(prev => prev.map(emp => emp.id === empId ? { ...emp, [field]: value } : emp));
  };

  const handlePrint = (type: 'local' | 'manila' = 'local') => {
    const html = generatePrintInternalHTML(type, {
      attendance,
      projectName,
      weekStart,
      weekEnd,
      locationFilter,
      selectedEmployees
    });
    setPreviewHtml(html);
    setPreviewType('html');
  };

  const handlePrintManpower = (type: 'matrix' | 'summary') => {
    const html = generatePrintManpowerInternalHTML(type, {
      attendance,
      allocations,
      projectName,
      weekStart,
      weekEnd,
      locationFilter,
      selectedEmployees
    });
    setPreviewHtml(html);
    setPreviewType('html');
  };

  const handlePrintCashRequisition = () => {
    setPreviewType('crs');
  };

  const handlePrintPayslips = () => {
    setPreviewType('payslips');
  };

  const clearSelectedAttendance = () => {
    setAttendance(prev => prev.map(emp => {
      if (selectedEmployees.includes(emp.id)) {
        return { ...emp, days: ['-', '-', '-', '-', '-', '-', '-'] };
      }
      return emp;
    }));
  };

  const applyToAllForDay = (dayIndex: number, value: string) => {
    setAttendance(prev => prev.map(emp => {
      const newDays = [...emp.days];
      newDays[dayIndex] = value;
      return { ...emp, days: newDays };
    }));
  };

  const handleAllocationChange = (empId: string, dayIndex: number, code: string) => {
    setAllocations(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [dayIndex]: code
      }
    }));
  };

  const toggleDay = (empId: string, dayIndex: number) => {
    setAttendance(prev => prev.map(emp => {
      if (emp.id === empId) {
        const newDays = [...emp.days];
        const current = newDays[dayIndex];
        if (current === 'X') newDays[dayIndex] = '1/2';
        else if (current === '1/2') newDays[dayIndex] = 'A';
        else if (current === 'A') newDays[dayIndex] = '-';
        else newDays[dayIndex] = 'X';
        return { ...emp, days: newDays };
      }
      return emp;
    }));
  };

  const handleBulkApply = (actCode: string) => {
    const visibleEmps = attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter);
    const visibleSelectedIds = visibleEmps.filter(emp => selectedEmployees.includes(emp.id)).map(e => e.id);

    if (visibleSelectedIds.length === 0 || selectedDays.length === 0) {
      alert('Please select at least one employee and one day before applying an activity.');
      return;
    }
    
    setAllocations(prev => {
      const next = { ...prev };
      visibleSelectedIds.forEach(empId => {
        if (!next[empId]) next[empId] = {};
        selectedDays.forEach(dayIndex => {
          next[empId][dayIndex] = actCode;
        });
      });
      return next;
    });
  };

  const applyBulkActivity = () => {
    if (bulkActivity !== '-') {
      handleBulkApply(bulkActivity);
    }
    setBulkActivity('-');
  };

  const getActiveEmployeesList = (currentAttendanceList = attendance, currentSelectedIds = selectedEmployees) => {
    const filteredBase = (locationFilter && locationFilter !== 'All')
      ? currentAttendanceList.filter(emp => emp.location === locationFilter)
      : currentAttendanceList;

    if (currentSelectedIds && currentSelectedIds.length > 0) {
      return filteredBase.filter(emp => currentSelectedIds.includes(emp.id));
    }
    const typedAttendance = filteredBase.filter(emp => {
      const hasOt = emp.ot && parseFloat(emp.ot) > 0;
      const hasUt = emp.ut && parseFloat(emp.ut) > 0;
      const hasSss = emp.sss && parseFloat(emp.sss) > 0;
      const hasPhilhealth = emp.philhealth && parseFloat(emp.philhealth) > 0;
      const hasPagibig = emp.pagibig && parseFloat(emp.pagibig) > 0;
      const hasTax = emp.tax && parseFloat(emp.tax) > 0;
      const hasAdjustments = emp.adjustments && Object.values(emp.adjustments).some((val: any) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      });
      const hasAdvances = emp.cashAdvances && emp.cashAdvances.length > 0;
      return !!(hasOt || hasUt || hasSss || hasPhilhealth || hasPagibig || hasTax || hasAdjustments || hasAdvances);
    });

    if (typedAttendance.length > 0) {
      return typedAttendance;
    }

    return filteredBase;
  };

  const activeEmployeesList = getActiveEmployeesList(attendance, selectedEmployees);

  const totalGross = activeEmployeesList.reduce((sum, emp) => sum + calculateEmployeePayroll(emp).gross, 0);
  const totalEmployees = activeEmployeesList.length;
  const totalDaysWorked = activeEmployeesList.reduce((sum, emp) => sum + calculateDays(emp.days), 0);

  let allocatedCost = 0;
  const activityTotals: Record<string, number[]> = {};
  ACTIVITIES.forEach(act => {
    activityTotals[act.code] = [0, 0, 0, 0, 0, 0, 0];
  });

  activeEmployeesList.forEach(emp => {
    emp.days.forEach((val: string, i: number) => {
      if (val !== 'A') {
        const code = allocations[emp.id]?.[i];
        if (code && code !== '-') {
          const cost = emp.rate * (val === 'X' ? 1 : val === '1/2' ? 0.5 : 0);
          if (activityTotals[code]) {
            activityTotals[code][i] += cost;
            allocatedCost += cost;
          }
        }
      }
    });
  });

  const variance = totalGross - allocatedCost;

  const handleSelectRun = (run: any) => {
  if (selectedRunId === run.id) {
    setSelectedRunId(null);
    setPayrollStatus('NOT_GENERATED');
    setSelectedEmployees([]);
    setAttendance([]);
    return;
  }

  setSelectedRunId(run.id);

  const runAttendance = Array.isArray(run.attendance) ? run.attendance : [];

  setAttendance(runAttendance);
  setAllocations(run.allocations || {});

  setSelectedEmployees(
    runAttendance.length > 0
      ? runAttendance.map((emp: any) => emp.id)
      : []
  );

  setWeekStart(run.weekStart || run.week_start || run.period?.split(' to ')[0] || weekStart);
  setWeekEnd(run.weekEnd || run.week_end || run.period?.split(' to ')[1] || weekEnd);
  setProjectName(run.projectName || run.project_name || projectName);
  setPayrollStatus(run.status === 'GENERATED' ? 'GENERATED' : 'NOT_GENERATED');
};

  const handleSaveAttendance = async () => {
  if (!activeProjectId) {
    toast.error('Please select a project first.');
    return;
  }

  if (attendance.length === 0) {
    toast.error('No attendance data to save.');
    return;
  }

  const periodStr = `${weekStart} to ${weekEnd}`;

  const payload = {
    project_id: activeProjectId,
    period: periodStr,
    week_start: weekStart,
    week_end: weekEnd,
    project_name: projectName,
    employees_count: totalEmployees,
    total_gross: totalGross,
    status: 'NOT GENERATED',

    attendance: JSON.parse(JSON.stringify(attendance)),
    allocations: JSON.parse(JSON.stringify(allocations)),
    selected_employees: JSON.parse(JSON.stringify(attendance.map(emp => emp.id))),

    date_generated: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  };

  console.log('ATTENDANCE BEFORE SAVE:', attendance);
  console.log('SAVE ATTENDANCE PAYLOAD:', payload);

  const existingRun = history.find(
    h => h.period === periodStr && String(h.projectId) === String(activeProjectId)
  );

  let result;

  if (existingRun) {
    result = await supabase
      .from('payroll_runs')
      .update(payload)
      .eq('id', existingRun.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('payroll_runs')
      .insert(payload)
      .select()
      .single();
  }

  const { data, error } = result;

  console.log('SAVE ATTENDANCE RUN DATA:', data);
  console.log('SAVE ATTENDANCE RUN ERROR:', error);

  if (error) {
    toast.error('Failed to save attendance.');
    console.error(error);
    return;
  }

  const savedRunId = data?.id;

if (savedRunId) {
  // Remove old attendance rows for this payroll run first
  const { error: deleteAttendanceError } = await supabase
    .from('payroll_attendance')
    .delete()
    .eq('payroll_run_id', savedRunId);

  console.log('DELETE OLD ATTENDANCE ERROR:', deleteAttendanceError);

  if (deleteAttendanceError) {
    toast.error('Attendance run saved, but old attendance cleanup failed.');
    console.error(deleteAttendanceError);
    return;
  }

  const attendanceRows = attendance.map(emp => {
    const payroll = calculateEmployeePayroll(emp);

    return {
  payroll_run_id: savedRunId,
  project_id: activeProjectId,
  employee_id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(emp.id))
  ? emp.id
  : null,

employee_code: String(emp.id || ''),

  week_start: weekStart || null,
  week_end: weekEnd || null,
  attendance_date: weekStart || null,

  employee_name: emp.name || '',
  position: emp.position || '',
  location: emp.location || '',
  daily_rate: Number(emp.rate || 0),

  days: JSON.parse(JSON.stringify(emp.days || [])),
  ot: Number(emp.ot || 0),
  ut: Number(emp.ut || 0),

  sss: Number(emp.sss || 0),
  philhealth: Number(emp.philhealth || 0),
  pagibig: Number(emp.pagibig || 0),
  tax: Number(emp.tax || 0),

  adjustments: JSON.parse(JSON.stringify(emp.adjustments || {})),

  gross: Number(payroll.gross || 0),
  total_deduction: Number(payroll.totalDeduction || 0),
  net_pay: Number(payroll.netPay || 0),

  status: 'Present',
  updated_at: new Date().toISOString()
};
  });

  const { error: attendanceInsertError } = await supabase
    .from('payroll_attendance')
    .insert(attendanceRows);

  console.log('INSERT PAYROLL ATTENDANCE ROWS:', attendanceRows);
console.log('INSERT PAYROLL ATTENDANCE ERROR:', attendanceInsertError);

if (attendanceInsertError) {
  toast.error(attendanceInsertError.message || 'Payroll run saved, but attendance rows failed to save.');
  console.error('FULL ATTENDANCE INSERT ERROR:', attendanceInsertError);
  return;
}
}

  toast.success('Attendance saved successfully.');

  await loadPayrollRuns();

  setSelectedRunId(data?.id || existingRun?.id || null);
  setPayrollStatus('NOT_GENERATED');
  setActiveTab('history');
};

const handleDirectGenerate = () => {
  if (!selectedRunId) {
    toast.error('Please select a payroll run first.');
    return;
  }

  const existingRun = history.find(h => String(h.id) === String(selectedRunId));

  if (!existingRun) {
    toast.error('Payroll run not found. Please save attendance again.');
    return;
  }

  const runAttendance = existingRun.attendance || [];

  if (runAttendance.length === 0) {
    toast.error('This payroll run has no attendance data.');
    return;
  }

  setAttendance(runAttendance);
  setAllocations(existingRun.allocations || {});

  if (existingRun.selectedEmployees && existingRun.selectedEmployees.length > 0) {
    setSelectedEmployees(existingRun.selectedEmployees);
  } else {
    setSelectedEmployees(runAttendance.map((emp: any) => emp.id));
  }

  setWeekStart(existingRun.weekStart || existingRun.week_start || weekStart);
  setWeekEnd(existingRun.weekEnd || existingRun.week_end || weekEnd);
  setProjectName(existingRun.projectName || existingRun.project_name || projectName);

  if (existingRun.status === 'GENERATED') {
    toast.success('Viewing Generated Payroll...');
  }

  setWizardStep(1);
};

const handleFinalize = async () => {
  console.log('FINALIZE BUTTON CLICKED');

  if (!activeProjectId) {
    toast.error('Please select a project first.');
    return;
  }

  const periodStr = `${weekStart} to ${weekEnd}`;

  const payload = {
    project_id: activeProjectId,
    period: periodStr,
    week_start: weekStart,
    week_end: weekEnd,
    project_name: projectName,
    employees_count: activeEmployeesList.length,
    total_gross: totalGross,
    status: 'GENERATED',

    attendance: JSON.parse(JSON.stringify(attendance)),
    allocations: JSON.parse(JSON.stringify(allocations)),
    selected_employees: JSON.parse(JSON.stringify(attendance.map(emp => emp.id))),

    date_generated: new Date().toISOString().split('T')[0],
    updated_at: new Date().toISOString()
  };

  console.log('FINALIZE PAYLOAD:', payload);

  let result;

  if (selectedRunId) {
    result = await supabase
      .from('payroll_runs')
      .update(payload)
      .eq('id', selectedRunId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('payroll_runs')
      .insert(payload)
      .select()
      .single();
  }

  const { data, error } = result;

  console.log('FINALIZE PAYROLL DATA:', data);
  console.log('FINALIZE PAYROLL ERROR:', error);

  if (error) {
    toast.error('Failed to finalize payroll.');
    console.error(error);
    return;
  }

  toast.success('Payroll finalized successfully.');

  await loadPayrollRuns();

  setSelectedRunId(data?.id || selectedRunId);
  setPayrollStatus('GENERATED');
  setWizardStep(3);
};

  const renderHistory = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-body)' }}>
          <h3 style={{ fontWeight: 600, color: 'var(--text-main)' }}>Payroll History</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('attendance')}
              className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Calendar size={14} /> Attendance
            </button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.85rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
          <thead style={{ background: 'var(--bg-body)' }}>
            <tr>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Payroll Period</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Date Generated</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Employees</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Total Gross Pay</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Attachments</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No payroll history found. Start by encoding attendance.
                </td>
              </tr>
            ) : (
              history.map((run, index) => (
                <tr 
                  key={`${run.id}-${index}`} 
                  style={{ 
                    cursor: 'pointer', 
                    background: selectedRunId === run.id ? '#eff6ff' : 'transparent', 
                    fontWeight: selectedRunId === run.id ? 'bold' : 'normal',
                    outline: selectedRunId === run.id ? '1px solid #bfdbfe' : 'none'
                  }} 
                  onClick={() => handleSelectRun(run)}
                  onMouseOver={e => { if (selectedRunId !== run.id) e.currentTarget.style.background = 'var(--bg-body)'}} 
                  onMouseOut={e => { if (selectedRunId !== run.id) e.currentTarget.style.background = 'transparent'}}
                >
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', borderLeft: selectedRunId === run.id ? '4px solid #3b82f6' : '4px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{run.period}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{run.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{run.dateGenerated}</td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{run.employeesCount}</td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-main)' }}>₱{run.totalGross.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: run.status === 'GENERATED' ? '#dcfce7' : '#fef08a', color: run.status === 'GENERATED' ? '#166534' : '#854d0e', textTransform: 'uppercase' }}>
                        {run.status}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                       <button 
                         onClick={() => {
                           const html = generatePrintInternalHTML('local', {
                             attendance: run.attendance,
                             projectName: run.projectName || projectName,
                             weekStart: run.weekStart || run.period.split(' to ')[0],
                             weekEnd: run.weekEnd || run.period.split(' to ')[1],
                             locationFilter: 'All',
                             selectedEmployees: run.selectedEmployees
                           });
                           setPreviewHtml(html);
                           setPreviewType('html');
                         }}
                         title="Print Attendance Sheet"
                         style={{ padding: '4px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                       >
                         <Printer size={16} />
                       </button>
                       <button 
                         onClick={() => {
                           const html = generatePrintInternalHTML('manila', {
                             attendance: run.attendance,
                             projectName: run.projectName || projectName,
                             weekStart: run.weekStart || run.period.split(' to ')[0],
                             weekEnd: run.weekEnd || run.period.split(' to ')[1],
                             locationFilter: 'All',
                             selectedEmployees: run.selectedEmployees
                           });
                           setPreviewHtml(html);
                           setPreviewType('html');
                         }}
                         title="Print Payroll Register"
                         style={{ padding: '4px', color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}
                       >
                         <FileText size={16} />
                       </button>
                       <button 
                         onClick={() => {
                           const html = generatePrintManpowerInternalHTML('matrix', {
                             attendance: run.attendance,
                             allocations: run.allocations || {},
                             projectName: run.projectName || projectName,
                             weekStart: run.weekStart || run.period.split(' to ')[0],
                             weekEnd: run.weekEnd || run.period.split(' to ')[1],
                             locationFilter: 'All',
                             selectedEmployees: run.selectedEmployees
                           });
                           setPreviewHtml(html);
                           setPreviewType('html');
                         }}
                         title="Print Manpower Matrix"
                         style={{ padding: '4px', color: '#8b5cf6', background: 'none', border: 'none', cursor: 'pointer' }}
                       >
                         <Users size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderAttendance = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Weekly Attendance Encoding</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Employees are auto-loaded from Employee Master Record</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('history')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: 'var(--text-main)', border: 'none', fontWeight: 600 }}>
            ← Previous
          </button>
          <button onClick={() => setActiveTab('manpower')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: 'var(--text-main)', border: 'none', fontWeight: 600 }}>
            Next →
          </button>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setPrintAttendanceDropdownOpen(!printAttendanceDropdownOpen)} 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: 'var(--text-main)', border: 'none', fontWeight: 600 }}
            >
              <Printer size={16} /> Print <ChevronDown size={14} />
            </button>
            {printAttendanceDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', zIndex: 10, minWidth: '150px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <button 
                  onClick={() => { handlePrint('local'); setPrintAttendanceDropdownOpen(false); }} 
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', fontSize: '0.9rem', color: 'var(--text-main)' }} 
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Local Template
                </button>
                <button 
                  onClick={() => { handlePrint('manila'); setPrintAttendanceDropdownOpen(false); }} 
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', fontSize: '0.9rem', color: 'var(--text-main)' }} 
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Manila Template
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={handleSaveAttendance}
            disabled={attendance.length === 0}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: attendance.length === 0 ? 0.5 : 1, background: 'var(--text-main)', color: 'white', fontWeight: 600 }}
          >
            <Save size={16} /> Save Attendance
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>Project</label>
          <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Enter project name" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>Week Start (Sunday)</label>
          <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>Week End (Saturday)</label>
          <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>Location</label>
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
            <option value="All">All Locations</option>
            <option value="Local">Local</option>
            <option value="Manila">Manila</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / span 2' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>Search Employee</label>
          <input type="text" placeholder="Search by name or ID" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-surface)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Legend:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
          X Whole Day
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', border: '1px solid #86efac', background: '#dcfce7', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
          ½ Half Day
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', border: '1px solid #fca5a5', background: '#fee2e2', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 700, color: '#991b1b' }}>
          Absent
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexDirection: 'column' }}>
        {selectedEmployees.length > 0 && (
          <div style={{ padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <span style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.9rem' }}>{selectedEmployees.length} employees selected</span>
            <div style={{ width: '1px', height: '24px', background: '#bfdbfe' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={clearSelectedAttendance} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-surface)', color: '#dc2626' }}>Clear Attendance</button>
              <div style={{ width: '1px', height: '24px', background: '#bfdbfe', margin: '0 4px' }}></div>
              <button onClick={applyDeductionsToSelected} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Apply Deductions</button>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
          <div className="card" style={{ flex: 1, overflowX: 'auto', padding: 0, borderRadius: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center', fontSize: '0.8rem', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap' }}>
              <thead style={{ color: 'var(--text-main)', fontWeight: 800, background: 'var(--bg-surface)' }}>
                <tr>
                  <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <input 
                      type="checkbox" 
                      checked={(() => {
                        const visibleEmps = attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter);
                        return visibleEmps.length > 0 && visibleEmps.every(emp => selectedEmployees.includes(emp.id));
                      })()}
                      onChange={(e) => {
                        const visibleEmps = attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter);
                        const visibleIds = visibleEmps.map(emp => emp.id);
                        if (e.target.checked) {
                          setSelectedEmployees(prev => Array.from(new Set([...prev, ...visibleIds])));
                        } else {
                          setSelectedEmployees(prev => prev.filter(id => !visibleIds.includes(id)));
                        }
                      }}
                    />
                  </th>
                  <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>No.</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>Emp ID</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>Nature<br/>of Work</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Rate</th>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                  <th key={day} style={{ padding: '16px 8px', borderBottom: '1px solid var(--border-color)', minWidth: '80px' }}>
                    <div>{day}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>Apr {12 + i}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                      <button onClick={() => applyToAllForDay(i, 'X')} style={{ padding: '2px 4px', fontSize: '0.6rem', background: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>X</button>
                      <button onClick={() => applyToAllForDay(i, '1/2')} style={{ padding: '2px 4px', fontSize: '0.6rem', background: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>½</button>
                      <button onClick={() => applyToAllForDay(i, 'A')} style={{ padding: '2px 4px', fontSize: '0.6rem', background: '#f1f5f9', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>A</button>
                    </div>
                  </th>
                ))}
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Days</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>OT</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>UT</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Gross</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>SSS</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>PhilHealth</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Pag-IBIG</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Tax</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Total<br/>Ded.</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Net Pay</th>
                <th style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter).length === 0 ? (
                <tr>
                  <td colSpan={24} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No employees found. Please add employees in the Employee Master Record first.
                  </td>
                </tr>
              ) : (
                attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter).map((emp, idx) => {
                  const { gross, days, totalDeduction, netPay, sssVal, phVal, pagibigVal, taxVal } = calculateEmployeePayroll(emp);
                  const totalDed = totalDeduction;
                  return (
                    <tr key={emp.id} onClick={() => setSelectedRowId(emp.id)} style={{ background: selectedRowId === emp.id ? '#eff6ff' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedEmployees.includes(emp.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployees([...selectedEmployees, emp.id]);
                            } else {
                              setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                            }
                          }}
                        />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>{emp.id}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'normal', minWidth: '120px' }}>{emp.name}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)', whiteSpace: 'normal', minWidth: '100px' }}>{emp.position}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₱{emp.rate}</td>
                      {emp.days.map((val: string, i: number) => (
                        <td key={i} style={{ padding: '16px 4px', borderBottom: '1px solid var(--border-color)' }}>
                          <div 
                            onClick={() => toggleDay(emp.id, i)}
                            style={{ 
                              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 700, margin: '0 auto', cursor: 'pointer', userSelect: 'none',
                              ...(val === 'X' ? { border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)' } : 
                                  val === '1/2' ? { border: '1px solid #86efac', background: '#dcfce7', color: '#166534' } : 
                                  val === 'A' ? { border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b' } :
                                  { border: '1px dashed #cbd5e1', background: '#f1f5f9', color: '#94a3b8' })
                            }}>
                            {val === '1/2' ? '½' : val}
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>{days}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" value={emp.ot} onChange={e => handleAttendanceChange(emp.id, 'ot', e.target.value)} style={{ width: '50px', padding: '6px 4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" value={emp.ut} onChange={e => handleAttendanceChange(emp.id, 'ut', e.target.value)} style={{ width: '50px', padding: '6px 4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-main)' }}>₱{gross.toLocaleString()}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" value={emp.sss} onChange={e => handleAttendanceChange(emp.id, 'sss', e.target.value)} style={{ width: '60px', padding: '6px 4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" value={emp.philhealth} onChange={e => handleAttendanceChange(emp.id, 'philhealth', e.target.value)} style={{ width: '60px', padding: '6px 4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" value={emp.pagibig} onChange={e => handleAttendanceChange(emp.id, 'pagibig', e.target.value)} style={{ width: '60px', padding: '6px 4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <input type="number" value={emp.tax} onChange={e => handleAttendanceChange(emp.id, 'tax', e.target.value)} style={{ width: '60px', padding: '6px 4px', textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>₱{totalDed.toLocaleString()}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-main)' }}>₱{netPay.toLocaleString()}</td>
                      <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>
                        <button onClick={() => {
                          setSelectedEmployeeId(emp.id);
                          setAdjForm(emp.adjustments || {
            restDayHours: '', restDayOtHours: '', specialHolidayHours: '', specialHolidayOtHours: '',
            specialHolidayRestDayHours: '', specialHolidayRestDayOtHours: '', regularHolidayHours: '', regularHolidayOtHours: '',
            regularHolidayRestDayHours: '', regularHolidayRestDayOtHours: '', ordinaryNightHours: '', restDayNightHours: '',
            specialHolidayNightHours: '', specialHolidayRestDayNightHours: '', regularHolidayNightHours: '', regularHolidayRestDayNightHours: '',
            ordinaryNightOtHours: '', restDayNightOtHours: '', specialHolidayNightOtHours: '', specialHolidayRestDayNightOtHours: '',
            regularHolidayNightOtHours: '', regularHolidayRestDayNightOtHours: ''
                          });
                        }} style={{ padding: '6px 12px', background: (emp.adjustments && Object.values(emp.adjustments).some(val => parseFloat(val as string) > 0)) ? '#dbeafe' : '#e2e8f0', border: (emp.adjustments && Object.values(emp.adjustments).some(val => parseFloat(val as string) > 0)) ? '1px solid #bfdbfe' : '1px solid transparent', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', color: (emp.adjustments && Object.values(emp.adjustments).some(val => parseFloat(val as string) > 0)) ? '#1e40af' : 'var(--text-main)' }}>
                          {(emp.adjustments && Object.values(emp.adjustments).some(val => parseFloat(val as string) > 0)) ? 'Adjustments ✓' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {selectedEmployeeId && (
          <div className="card" style={{ width: '320px', flexShrink: 0, borderRadius: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Payroll Adjustments</h3>
              <button onClick={() => setSelectedEmployeeId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
              Adjustments for {attendance.find(e => e.id === selectedEmployeeId)?.name}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
              {[
                { label: 'Rest Day (Sunday)', key: 'restDayHours' },
                { label: 'Rest Day OT', key: 'restDayOtHours' },
                { label: 'Rest Day Night Shift OT', key: 'restDayNightOtHours' },
                { label: 'Regular Holiday', key: 'regularHolidayHours' },
                { label: 'Reg. Holiday OT', key: 'regularHolidayOtHours' },
                { label: 'Special Hol.', key: 'specialHolidayHours' },
                { label: 'Spec. Hol. OT', key: 'specialHolidayOtHours' },
                { label: 'Night Shift D.', key: 'ordinaryNightHours' },
                { label: 'Spec. Hol. Night Shift D.', key: 'specialHolidayNightHours' }
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px', color: 'var(--text-main)' }}>{field.label}</label>
                  <input type="number" min="0" step="0.5" value={adjForm[field.key] || ''} onChange={e => setAdjForm({...adjForm, [field.key]: e.target.value})} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-color)', borderRadius: '6px', outline: 'none' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setAttendance(prev => prev.map(e => e.id === selectedEmployeeId ? { ...e, adjustments: adjForm } : e));
                  setSelectedEmployeeId(null);
                }} 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--text-main)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Save Adjustments
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );

  const renderManpowerTable = () => {
    const visibleEmployees = attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter);
const visibleSelectedEmployees = visibleEmployees;

    return (
      <>
        <div style={{ padding: '16px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Bulk Activity Assignment</span>
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }}></div>
            <span style={{ fontSize: '0.85rem', color: visibleSelectedEmployees.length > 0 ? '#2563eb' : 'var(--text-muted)' }}>
              {visibleSelectedEmployees.length} employee{visibleSelectedEmployees.length !== 1 ? 's' : ''} selected
            </span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#cbd5e1' }}></div>
            <span style={{ fontSize: '0.85rem', color: selectedDays.length > 0 ? '#2563eb' : 'var(--text-muted)' }}>
              {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select 
              value={bulkActivity} 
              onChange={e => {
                setBulkActivity(e.target.value);
                if (e.target.value !== '-') {
                  handleBulkApply(e.target.value);
                  setTimeout(() => setBulkActivity('-'), 100);
                }
              }}
              style={{ padding: '8px 16px', border: '1px solid var(--border-color)', borderRadius: '8px', outline: 'none', fontSize: '0.85rem', background: '#f8fafc', minWidth: '220px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}
            >
              <option value="-">Apply to selected...</option>
              {ACTIVITIES.map(act => (
                <option key={act.code} value={act.code}>{act.code} - {act.name}</option>
              ))}
            </select>
            <button 
              onClick={() => handleBulkApply('-')}
              disabled={visibleSelectedEmployees.length === 0 || selectedDays.length === 0}
              style={{ 
                padding: '8px 16px', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                background: '#f8fafc', 
                color: '#64748b', 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                cursor: visibleSelectedEmployees.length === 0 || selectedDays.length === 0 ? 'not-allowed' : 'pointer',
                opacity: visibleSelectedEmployees.length === 0 || selectedDays.length === 0 ? 0.5 : 1
              }}
              title="Clear inputted codes for selected employees and days"
            >
              Clear Selected
            </button>
          </div>
        </div>

        <div className="card" style={{ overflowX: 'auto', padding: 0, borderRadius: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'center', fontSize: '0.8rem', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap' }}>
            <thead style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', background: 'var(--bg-surface)' }}>
              <tr>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={visibleEmployees.length > 0 && visibleEmployees.every(emp => selectedEmployees.includes(emp.id))}
                    onChange={(e) => {
                      const visibleIds = visibleEmployees.map(emp => emp.id);
                      if (e.target.checked) {
                        setSelectedEmployees(prev => Array.from(new Set([...prev, ...visibleIds])));
                      } else {
                        setSelectedEmployees(prev => prev.filter(id => !visibleIds.includes(id)));
                      }
                    }}
                  />
                </th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>Employee</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Payroll Net Pay</th>
                <th style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Allocated Cost</th>
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
                  <th 
                    key={day} 
                    onClick={() => {
                      setSelectedDays(prev => 
                        prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]
                      );
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedDays.includes(i)) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedDays.includes(i)) e.currentTarget.style.background = 'transparent';
                    }}
                    style={{ 
                      padding: '8px', 
                      borderBottom: '1px solid var(--border-color)', 
                      minWidth: '90px', 
                      cursor: 'pointer',
                      background: selectedDays.includes(i) ? '#eff6ff' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ marginBottom: '6px', color: selectedDays.includes(i) ? '#2563eb' : '#94a3b8' }}>{day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((emp) => {
              const days = getAllocatedDaysCount(emp.id);
              const gross = days * emp.rate;
              const payroll = calculateEmployeePayroll(emp);
              const isSelectedRow = selectedEmployees.includes(emp.id);
              return (
                <tr key={emp.id} onClick={() => setSelectedRowId(emp.id)} style={{ background: isSelectedRow || selectedRowId === emp.id ? '#eff6ff' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', borderLeft: isSelectedRow ? '4px solid #2563eb' : '4px solid transparent' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelectedRow}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, emp.id]);
                        } else {
                          setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: isSelectedRow ? '#1e3a8a' : '#0f172a' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{emp.id}</div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                    ₱{payroll.netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                    ₱{gross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => {
                    const isSelectedCol = selectedDays.includes(i);
                    const isIntersection = isSelectedRow && isSelectedCol;
                    const currentCode = allocations[emp.id]?.[i] || '-';
                    const val = emp.days[i]; // derived attendance value (X, 1/2, A, -)
                    
                    return (
                    <td key={i} style={{ 
                      padding: '16px 8px', 
                      borderBottom: '1px solid var(--border-color)', 
                      background: isIntersection ? '#dbeafe' : (isSelectedCol || isSelectedRow || selectedRowId === emp.id) ? '#eff6ff' : 'transparent',
                      boxShadow: isIntersection ? 'inset 0 0 0 1px #bfdbfe' : 'none',
                      transition: 'background 0.2s, box-shadow 0.2s'
                    }}>
                      {val !== 'A' && val !== '-' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div 
                            onClick={() => toggleDay(emp.id, i)}
                            style={{ 
                              width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                              ...(val === 'X' ? { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' } : 
                                  val === '1/2' ? { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' } : 
                                  { background: '#f1f5f9', color: '#64748b', border: '1px solid var(--border-color)' })
                            }}>
                            {val === '1/2' ? '½' : val}
                          </div>
                          <select 
                            value={currentCode}
                            onChange={(e) => handleAllocationChange(emp.id, i, e.target.value)}
                            title={ACTIVITIES.find(a => a.code === currentCode)?.name || 'Select Activity'}
                            style={{ width: '64px', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px 4px', fontSize: '0.7rem', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-main)', textAlign: 'center' }}
                          >
                            <option value="-">-</option>
                            {ACTIVITIES.map(act => (
                              <option key={act.code} value={act.code} title={act.name}>{act.code}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div 
                            onClick={() => toggleDay(emp.id, i)}
                            style={{ 
                              width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                              borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                              ...(val === 'A' ? { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' } : 
                                  { background: '#f1f5f9', color: '#94a3b8', border: '1px dashed #cbd5e1' })
                            }}>
                            {val === 'A' ? 'A' : '-'}
                          </div>
                          <select 
                            value={currentCode}
                            onChange={(e) => handleAllocationChange(emp.id, i, e.target.value)}
                            title={ACTIVITIES.find(a => a.code === currentCode)?.name || 'Select Activity'}
                            style={{ width: '64px', border: currentCode === '-' ? '1px dashed #e2e8f0' : '1px solid #cbd5e1', borderRadius: '6px', padding: '2px 4px', fontSize: '0.7rem', outline: 'none', background: currentCode === '-' ? '#f8fafc' : 'white', color: currentCode === '-' ? '#cbd5e1' : '#0f172a', textAlign: 'center' }}
                          >
                            <option value="-">-</option>
                            {ACTIVITIES.map(act => (
                              <option key={act.code} value={act.code} title={act.name}>{act.code}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

  const renderManpower = () => {
    let allocatedCost = 0;
    const activityTotals: Record<string, number[]> = {};
    ACTIVITIES.forEach(act => {
      activityTotals[act.code] = [0, 0, 0, 0, 0, 0, 0];
    });

    attendance.filter(emp => locationFilter === 'All' || emp.location === locationFilter).forEach(emp => {
      emp.days.forEach((val: string, i: number) => {
        if (val !== 'A') {
          const code = allocations[emp.id]?.[i];
          if (code && code !== '-') {
            const cost = emp.rate * (val === 'X' ? 1 : val === '1/2' ? 0.5 : 0);
            if (activityTotals[code]) {
              activityTotals[code][i] += cost;
              allocatedCost += cost;
            }
          }
        }
      });
    });

    const variance = totalGross - allocatedCost;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Manpower Allocation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assign task codes to daily attendance</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveTab('attendance')} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChevronLeft size={16} /> Back
            </button>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setPrintDropdownOpen(!printDropdownOpen)} 
                className="btn btn-secondary" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', color: 'var(--text-main)', border: 'none', fontWeight: 600 }}
              >
                <Printer size={16} /> Print <ChevronDown size={14} />
              </button>
              {printDropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', zIndex: 10, minWidth: '200px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <button 
                    onClick={() => { handlePrintManpower('matrix'); setPrintDropdownOpen(false); }} 
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', fontSize: '0.9rem', color: 'var(--text-main)' }} 
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Employee Manpower Matrix
                  </button>
                  <button 
                    onClick={() => { handlePrintManpower('summary'); setPrintDropdownOpen(false); }} 
                    style={{ width: '100%', textAlign: 'left', padding: '10px 16px', background: 'transparent', cursor: 'pointer', whiteSpace: 'nowrap', border: 'none', fontSize: '0.9rem', color: 'var(--text-main)' }} 
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Allocation Summary
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                handleSaveAttendance();
                toast.success('Manpower allocations saved successfully');
              }}
              disabled={attendance.length === 0}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: attendance.length === 0 ? 0.5 : 1, background: 'var(--text-main)', color: 'white', fontWeight: 600 }}
            >
              <Save size={16} /> Save Allocations
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ padding: '12px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px' }}><DollarSign size={24} /></div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payroll Cost</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>₱{totalGross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ padding: '12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px' }}><TrendingUp size={24} /></div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allocated Cost</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>₱{allocatedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', color: '#64748b', borderRadius: '8px' }}><CheckCircle size={24} /></div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>₱{variance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
            </div>
          </div>
        </div>

        {renderManpowerTable()}

        <div className="card" style={{ padding: 0, borderRadius: '12px', borderBottom: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Allocation Summary per Activity</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'right', fontSize: '0.8rem', fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: 'nowrap' }}>
              <thead style={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>Activity</th>
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                    <th key={day} style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)' }}>{day}</th>
                  ))}
                  <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITIES.filter(act => activityTotals[act.code].reduce((a,b)=>a+b,0) > 0 || ACTIVITIES.indexOf(act) < 5).map(act => {
                  const totals = activityTotals[act.code];
                  const rowTotal = totals.reduce((a,b) => a+b, 0);
                  return (
                    <tr key={act.code}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: '#475569' }}>{act.name} ({act.code})</td>
                      {totals.map((val, i) => (
                        <td key={i} style={{ padding: '16px 12px', borderBottom: '1px solid var(--border-color)', color: '#64748b' }}>₱{val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      ))}
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', fontWeight: 800, color: 'var(--text-main)' }}>₱{rowTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '16px 24px', textAlign: 'left', fontWeight: 800, color: 'var(--text-main)' }}>TOTAL</td>
                  {[0,1,2,3,4,5,6].map(i => {
                    const colTotal = ACTIVITIES.reduce((sum, act) => sum + activityTotals[act.code][i], 0);
                    return (
                      <td key={i} style={{ padding: '16px 12px', fontWeight: 800, color: 'var(--text-main)' }}>₱{colTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    );
                  })}
                  <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--text-main)' }}>₱{allocatedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderWizard = () => {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(9, 30, 66, 0.54)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: wizardStep === 2 ? '1280px' : '896px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', transition: 'max-width 0.3s ease' }}
        >
          {/* Wizard Header */}
          <div style={{ background: 'var(--bg-body)', borderBottom: '1px solid var(--border-color)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>Generate Payroll</h2>
            <button onClick={() => setWizardStep(0)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
          </div>

          {/* Stepper */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: wizardStep >= 1 ? 'var(--primary)' : 'var(--text-muted)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', background: wizardStep >= 1 ? '#eff6ff' : 'var(--bg-body)' }}>1</div>
                <span style={{ fontWeight: 500 }}>Review</span>
              </div>
              <div style={{ width: '48px', height: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: wizardStep >= 2 ? 'var(--primary)' : 'var(--text-muted)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', background: wizardStep >= 2 ? '#eff6ff' : 'var(--bg-body)' }}>2</div>
                <span style={{ fontWeight: 500 }}>Earnings & Deductions</span>
              </div>
              <div style={{ width: '48px', height: '1px', background: 'var(--border-color)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: wizardStep >= 3 ? 'var(--primary)' : 'var(--text-muted)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', background: wizardStep >= 3 ? '#eff6ff' : 'var(--bg-body)' }}>3</div>
                <span style={{ fontWeight: 500 }}>Finalize & Request Payment</span>
              </div>
            </div>
          </div>

          {/* Wizard Content */}
          <div style={{ padding: '32px', flex: 1, overflowY: 'auto', background: 'var(--bg-body)' }}>
            {wizardStep === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '672px', margin: '0 auto' }}>
                <div className="card">
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Payroll Period</p>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>{weekStart} to {weekEnd}</h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Employees</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalEmployees}</h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Days Worked</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{totalDaysWorked}</h3>
                </div>
                <div className="card">
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Estimated Total</p>
                  <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)' }}>₱{totalGross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.85rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
                    <thead style={{ background: 'var(--bg-body)' }}>
                      <tr>
                        <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Employee</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Gross Pay</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--danger)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>SSS</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--danger)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>PhilHealth</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--danger)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Pag-IBIG</th>
                        <th style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeEmployeesList.map(emp => {
                        const { gross, days, sssVal, phVal, pagibigVal, netPay } = calculateEmployeePayroll(emp);
                        return (
                          <tr key={emp.id}>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>₱{gross.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--danger)' }}>{sssVal > 0 ? `₱${sssVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₱0.00'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--danger)' }}>{phVal > 0 ? `₱${phVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₱0.00'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--danger)' }}>{pagibigVal > 0 ? `₱${pagibigVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₱0.00'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₱{netPay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div style={{ textAlign: 'center', maxWidth: '448px', margin: '0 auto', padding: '48px 0' }}>
                <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <CheckCircle size={40} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Payroll Finalized!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>The payroll record has been created and is ready for payment requisition.</p>
                


                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={handlePrintCashRequisition} className="btn btn-primary" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem' }}>
                    <FileText size={18} /> Print Cash Requisition Slip
                  </button>
                  <button onClick={handlePrintPayslips} className="btn" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                    <Printer size={18} /> Print All Payslips
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer */}
          <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {wizardStep < 3 ? (
              <>
                <button 
                  onClick={() => wizardStep === 1 ? setWizardStep(0) : setWizardStep(wizardStep - 1)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => wizardStep === 2 ? handleFinalize() : setWizardStep(wizardStep + 1)}
                  className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {wizardStep === 1 ? 'Review Earnings' : 'Finalize & Request Payment'} <ChevronRight size={18} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setWizardStep(0);
                  setActiveTab('history');
                }}
                className="btn btn-secondary" style={{ width: '100%' }}
              >
                Return to Payroll History
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  const renderPrintPreview = () => {
    if (!previewType) return null;

    if (previewType === 'html') {
      return createPortal(
        <div className="fixed-preview-layer" style={{ position: 'fixed', inset: 0, zIndex: 9999999, pointerEvents: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="preview-header" style={{ height: '64px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Print Preview
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPreviewType(null)} className="btn btn-secondary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>Close Preview</button>
              <button 
                onClick={() => {
                  let htmlToPrint = previewHtml;
                  try {
                    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                    if (iframe && iframe.contentWindow && iframe.contentWindow.document) {
                      htmlToPrint = iframe.contentWindow.document.documentElement.outerHTML;
                    }
                  } catch (e) { console.error('Could not get iframe content', e); }
                  
                  try {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.open();
                      printWindow.document.write(htmlToPrint + '<script>window.onload=function(){setTimeout(function(){window.print();},250);};</' + 'script>');
                      printWindow.document.close();
                      return;
                    }
                  } catch (e) { console.error(e); }

                  const printIframe = document.createElement('iframe');
                  printIframe.style.position = 'absolute';
                  printIframe.style.width = '1px';
                  printIframe.style.height = '1px';
                  printIframe.style.left = '-1000px';
                  document.body.appendChild(printIframe);
                  printIframe.srcdoc = htmlToPrint + '<script>window.onload=function(){setTimeout(function(){window.print();},100);};</' + 'script>';
                  setTimeout(() => { if (document.body.contains(printIframe)) document.body.removeChild(printIframe); }, 10000);
                }} 
                className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Printer size={16} /> Print Now
              </button>
            </div>
          </div>
          <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1200px', height: '100%', background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                id="preview-iframe"
                srcDoc={previewHtml}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>,
        document.body
      );
    }

    let activePreviewIds: string[] = [];
    let currentPreviewAttendance = attendance;
    if (selectedRunId) {
      const run = history.find(h => h.id === selectedRunId);
      if (run) {
        currentPreviewAttendance = run.attendance || attendance;
        if (run.selectedEmployees) {
          activePreviewIds = run.selectedEmployees;
        }
      }
    } else {
      activePreviewIds = selectedEmployees;
    }

    let activePreviewEmployees = currentPreviewAttendance;
    if (activePreviewIds && activePreviewIds.length > 0) {
      activePreviewEmployees = currentPreviewAttendance.filter(emp => activePreviewIds.includes(emp.id));
    } else {
      activePreviewEmployees = currentPreviewAttendance.filter(emp => {
        const hasOt = emp.ot && parseFloat(emp.ot) > 0;
        const hasUt = emp.ut && parseFloat(emp.ut) > 0;
        const hasSss = emp.sss && parseFloat(emp.sss) > 0;
        const hasPhilhealth = emp.philhealth && parseFloat(emp.philhealth) > 0;
        const hasPagibig = emp.pagibig && parseFloat(emp.pagibig) > 0;
        const hasTax = emp.tax && parseFloat(emp.tax) > 0;
        const hasAdjustments = emp.adjustments && Object.values(emp.adjustments).some((val: any) => {
          const num = parseFloat(val);
          return !isNaN(num) && num > 0;
        });
        const hasAdvances = emp.cashAdvances && emp.cashAdvances.length > 0;
        return !!(hasOt || hasUt || hasSss || hasPhilhealth || hasPagibig || hasTax || hasAdjustments || hasAdvances);
      });
    }

    let totalNetPay = 0;
    activePreviewEmployees.forEach(emp => {
      const { gross } = calculateEmployeePayroll(emp);
      const pagibig = gross > 0 ? 100 : 0;
      const sss = emp.sss ? parseFloat(emp.sss) : 0;
      const philhealth = emp.philhealth ? parseFloat(emp.philhealth) : 0;
      const tax = emp.tax ? parseFloat(emp.tax) : 0;
      const net = gross - (pagibig + sss + philhealth + tax);
      totalNetPay += net;
    });

    const executePrint = () => {
      const printableArea = document.getElementById('printable-area');
      if (!printableArea) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .page-break { page-break-after: always; display: block; margin: 0 auto; min-height: auto; width: 210mm; background: white; padding: 10mm; box-sizing: border-box; }
              @page { size: auto; margin: 10mm; }
              .grid-payslip-print { display: grid; grid-template-columns: 1fr 1fr; border: 2px solid #000; box-sizing: border-box; }
              /* Reset editable styles */
              [contenteditable] { outline: none !important; border: none !important; background: transparent !important; }
            </style>
          </head>
          <body>
            ${printableArea.innerHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 250);
              };
            </script>
          </body>
        </html>
      `;

      try {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          return;
        }
      } catch (e) {
        console.error(e);
      }

      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'absolute';
      printIframe.style.width = '1px';
      printIframe.style.height = '1px';
      printIframe.style.left = '-1000px';
      document.body.appendChild(printIframe);
      printIframe.srcdoc = htmlContent.replace('250', '100');
      setTimeout(() => { if (document.body.contains(printIframe)) document.body.removeChild(printIframe); }, 10000);
    };

    const printContent = (
      <div className="fixed-preview-layer" style={{ position: 'fixed', inset: 0, zIndex: 9999999, pointerEvents: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="preview-header" style={{ height: '64px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {previewType === 'crs' ? 'Cash Requisition Slip Preview' : 'Payslips Preview'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPreviewType(null)} className="btn btn-secondary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>Close Preview</button>
            <button onClick={executePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Printer size={16} /> Print Now
            </button>
          </div>
        </div>
        
        <div className="print-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          <style>{`
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              body * { visibility: hidden; }
              .fixed-preview-layer, .fixed-preview-layer * { visibility: visible; }
              .preview-header, .preview-header * { display: none !important; visibility: hidden !important; }
              .fixed-preview-layer { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; min-height: 100% !important; overflow: visible !important; display: block !important; background: white !important; z-index: 99999 !important; padding: 0 !important; margin: 0 !important; }
              .print-scroll-container { overflow: visible !important; height: auto !important; padding: 0 !important; display: block !important; }
              #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
              .page-break { page-break-after: always !important; display: block; margin: 0 auto !important; box-shadow: none !important; min-height: auto !important; }
              @page { size: auto; margin: 10mm; }
              .grid-payslip-print { grid-template-columns: 1fr 1fr; border: 2px solid #000; box-sizing: border-box; }
              /* Reset editable styles */
              [contenteditable] { outline: none !important; border: none !important; background: transparent !important; }
            }
          `}</style>
          
          <div id="printable-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '32px' }}>
            {previewType === 'crs' ? (
              <div className="page-break" style={{ padding: '0', margin: '20px auto', background: 'var(--bg-surface)', fontFamily: 'Arial, sans-serif', width: '180mm', height: '130mm', boxSizing: 'border-box', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '14px', color: '#000' }}>
                <div style={{ border: '2px solid #000', padding: '15mm', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ textAlign: 'center', marginBottom: 'auto' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>SUWECO TABLAS ENERGY CORPORATION</div>
                    <div style={{ fontSize: '12px' }}>Poblacion, Alcantara, Romblon</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '20px 0' }}>CASH REQUISITION SLIP</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontWeight: 'bold' }}>
                    <div>Charge to: SUWECO TABLAS ENERGY CORPORATION</div>
                    <div>Date: {new Date().toISOString().split('T')[0]}</div>
                  </div>
                  <div style={{ textAlign: 'center', margin: '40px 0', fontWeight: 'bold' }}>
                    Payment for Payroll of Project ({weekStart} to {weekEnd})
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '60px', fontWeight: 'bold', fontSize: '16px' }}>
                    <div>Amount Php:</div>
                    <div style={{ borderBottom: '1px solid #000', width: '150px', textAlign: 'center', marginLeft: '20px' }}>₱{totalNetPay.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', textAlign: 'center' }}>
                    <div style={{ width: '30%' }}>
                      <div style={{ borderBottom: '1px solid #000', width: '100%', height: '16px', marginBottom: '2px' }}></div>
                      <div contentEditable suppressContentEditableWarning style={{ marginBottom: '5px', fontWeight: 'bold', height: '20px', textTransform: 'uppercase', outline: '1px dashed #cbd5e1' }}>{preparedBy}</div>
                      <div>Requested by</div>
                    </div>
                    <div style={{ width: '30%' }}>
                      <div style={{ borderBottom: '1px solid #000', width: '100%', height: '16px', marginBottom: '2px' }}></div>
                      <div contentEditable suppressContentEditableWarning style={{ marginBottom: '5px', fontWeight: 'bold', height: '20px', textTransform: 'uppercase', outline: '1px dashed #cbd5e1' }}></div>
                      <div>Noted by</div>
                    </div>
                    <div style={{ width: '30%' }}>
                      <div style={{ borderBottom: '1px solid #000', width: '100%', height: '16px', marginBottom: '2px' }}></div>
                      <div contentEditable suppressContentEditableWarning style={{ marginBottom: '5px', fontWeight: 'bold', height: '20px', textTransform: 'uppercase', outline: '1px dashed #cbd5e1' }}></div>
                      <div>Department Head</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              (() => {
                const chunkSize = 6;
                const chunks = [];
                for (let i = 0; i < activePreviewEmployees.length; i += chunkSize) {
                  chunks.push(activePreviewEmployees.slice(i, i + chunkSize));
                }
                
                return chunks.map((chunk, chunkIndex) => (
                  <div key={chunkIndex} className="page-break" style={{ background: 'var(--bg-surface)', width: '210mm', height: '297mm', padding: '10mm', boxSizing: 'border-box', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif', color: '#000', fontSize: '6px' }}>
                    <div className="grid-payslip-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', border: '2px solid #000', borderBottom: 'none', height: '100%', boxSizing: 'border-box' }}>
                      {Array.from({ length: chunkSize }).map((_, idx) => {
                        const emp = chunk[idx];
                        if (!emp) {
                          return <div key={`empty-${idx}`} style={{ borderBottom: '2px solid #000', borderRight: (idx % 2 === 0) ? '2px solid #000' : 'none', height: '100%', boxSizing: 'border-box' }}></div>;
                        }
                        const { gross, basic, sssVal: sss, phVal: philhealth, pagibigVal: pagibig, taxVal: tax, netPay, adjAmounts, adjHours } = calculateEmployeePayroll(emp);
                        const daysCount = calculateDays(emp.days);
                        const inHours = daysCount * 8;
                        const amount = basic;
                        const totalDeduction = sss + philhealth + pagibig + tax;

                        // Calculating sequence number globally
                        const seqNumber = (chunkIndex * chunkSize) + idx + 1;

                        const formatVal = (val: number | undefined) => val && val > 0 ? val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-';
                        const formatHr = (val: number | undefined) => val && val > 0 ? val.toString() : '-';

                        return (
                          <div key={emp.id} className="payslip-container" style={{ borderBottom: '2px solid #000', padding: '6px 8px', boxSizing: 'border-box', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontSize: '6px', borderRight: (idx % 2 === 0) ? '2px solid #000' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '6px', fontSize: '7px' }}>
                              <span>SUWECO TABLAS ENERGY CORP. ALCANTARA</span>
                              <span style={{ background: '#ffff00', padding: '0 12px' }}>{seqNumber}</span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr 100px 1fr', gap: '2px', marginBottom: '4px' }}>
                              <div>EMPLOYEE NUMBER:</div><div style={{ fontWeight: 'normal' }}>{emp.id}</div>
                              <div>PAYROLL PERIOD:</div><div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{new Date(weekStart).toLocaleDateString('en-US', {month: 'long', day:'numeric'})}-{new Date(weekEnd).toLocaleDateString('en-US', {day:'numeric', year:'numeric'})}</div>
                              
                              <div>EMPLOYEE NAME:</div><div style={{ fontWeight: 'bold' }}>{emp.name}</div>
                              <div>PAYDATE:</div><div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{new Date().toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'})}</div>
                              
                              <div>POSITION:</div><div style={{ fontWeight: 'normal' }}>{emp.position}</div>
                              <div>TAX EXEMPTION:</div><div style={{ fontWeight: 'normal' }}>{emp.position}</div>
                              
                              <div>COST CENTER:</div><div style={{ fontWeight: 'normal' }}>{projectName || 'STEC-ALC'}</div>
                              <div>DAILY RATE:</div><div style={{ fontWeight: 'normal' }}>{emp.rate.toFixed(0)}</div>
                            </div>
                            
                            <table style={{ width: '100%', borderCollapse: 'collapse', flex: 1, tableLayout: 'fixed' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '53%', paddingRight: '12px', verticalAlign: 'top' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                      <thead>
                                        <tr>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', textAlign: 'left', paddingBottom: '1px' }}></th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px' }}>Days</th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px' }}>In Hours</th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px' }}>Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr><td style={{ textAlign: 'left' }}>No. of days worked</td><td>{daysCount.toFixed(2)}</td><td>{inHours.toFixed(2)}</td><td>{amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Tardiness</td><td>-</td><td>-</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Undertime</td><td>-</td><td>{formatHr(adjHours?.ut)}</td><td>{formatVal(adjAmounts?.undertimeAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left', paddingBottom: '4px' }}>Night Differential</td><td>-</td><td>{formatHr(adjHours?.ordinaryNightHours)}</td><td>{formatVal(adjAmounts?.ordinaryNsdAmount)}</td></tr>
                                      </tbody>
                                    </table>
                                    
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', marginTop: '2px' }}>
                                      <thead>
                                        <tr>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', textAlign: 'left', paddingBottom: '1px' }}>OVERTIME PAY</th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px' }}>Hours</th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px' }}>Amount</th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px', whiteSpace: 'nowrap' }}>ND OT<br/>Hours</th>
                                          <th style={{ fontWeight: 'normal', textDecoration: 'underline', paddingBottom: '1px' }}><br/>Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr><td style={{ textAlign: 'left' }}>Regular days</td><td>{formatHr(adjHours?.ot)}</td><td>{formatVal(adjAmounts?.regularOtAmount)}</td><td>{formatHr(adjHours?.ordinaryNightOtHours)}</td><td>{formatVal(adjAmounts?.ordinaryNightOtAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Rest days</td><td>{formatHr(adjHours?.restDayHours)}</td><td>{formatVal(adjAmounts?.restDayAmount)}</td><td>{formatHr(adjHours?.restDayNightHours)}</td><td>{formatVal(adjAmounts?.restDayNsdAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Rest days OT</td><td>{formatHr(adjHours?.restDayOtHours)}</td><td>{formatVal(adjAmounts?.restDayOtAmount)}</td><td>{formatHr(adjHours?.restDayNightOtHours)}</td><td>{formatVal(adjAmounts?.restDayNightOtAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Regular holidays</td><td>{formatHr(adjHours?.regularHolidayHours)}</td><td>{formatVal(adjAmounts?.regularHolidayAmount)}</td><td>{formatHr(adjHours?.regularHolidayNightHours)}</td><td>{formatVal(adjAmounts?.regularHolidayNsdAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Regular holidays OT</td><td>{formatHr(adjHours?.regularHolidayOtHours)}</td><td>{formatVal(adjAmounts?.regularHolidayOtAmount)}</td><td>{formatHr(adjHours?.regularHolidayNightOtHours)}</td><td>{formatVal(adjAmounts?.regularHolidayNightOtAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Regular holiday on RD</td><td>{formatHr(adjHours?.regularHolidayRestDayHours)}</td><td>{formatVal(adjAmounts?.regularHolidayRestDayAmount)}</td><td>{formatHr(adjHours?.regularHolidayRestDayNightHours)}</td><td>{formatVal(adjAmounts?.regularHolidayRestDayNsdAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Regular holiday on RD OT</td><td>{formatHr(adjHours?.regularHolidayRestDayOtHours)}</td><td>{formatVal(adjAmounts?.regularHolidayRestDayOtAmount)}</td><td>{formatHr(adjHours?.regularHolidayRestDayNightOtHours)}</td><td>{formatVal(adjAmounts?.regularHolidayRestDayNightOtAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Special holiday</td><td>{formatHr(adjHours?.specialHolidayHours)}</td><td>{formatVal(adjAmounts?.specialHolidayAmount)}</td><td>{formatHr(adjHours?.specialHolidayNightHours)}</td><td>{formatVal(adjAmounts?.specialHolidayNsdAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Special holiday OT</td><td>{formatHr(adjHours?.specialHolidayOtHours)}</td><td>{formatVal(adjAmounts?.specialHolidayOtAmount)}</td><td>{formatHr(adjHours?.specialHolidayNightOtHours)}</td><td>{formatVal(adjAmounts?.specialHolidayNightOtAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Special holiday on RD</td><td>{formatHr(adjHours?.specialHolidayRestDayHours)}</td><td>{formatVal(adjAmounts?.specialHolidayRestDayAmount)}</td><td>{formatHr(adjHours?.specialHolidayRestDayNightHours)}</td><td>{formatVal(adjAmounts?.specialHolidayRestDayNsdAmount)}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Special holiday on RD OT</td><td>{formatHr(adjHours?.specialHolidayRestDayOtHours)}</td><td>{formatVal(adjAmounts?.specialHolidayRestDayOtAmount)}</td><td>{formatHr(adjHours?.specialHolidayRestDayNightOtHours)}</td><td>{formatVal(adjAmounts?.specialHolidayRestDayNightOtAmount)}</td></tr>
                                        <tr><td colSpan={3} style={{ paddingTop: '2px', textAlign: 'right', fontWeight: 'bold' }}>TOTAL</td><td colSpan={2} style={{ paddingTop: '2px', textAlign: 'right', fontWeight: 'bold' }}>{gross.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                      </tbody>
                                    </table>
                                  </td>
                                  
                                  <td style={{ width: '47%', verticalAlign: 'top' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                                      <tbody>
                                        <tr><td style={{ paddingBottom: '1px', textAlign: 'left', fontWeight: 'bold', textDecoration: 'underline' }}>OTHERS</td><td style={{ paddingBottom: '1px' }}></td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Deminimis</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>other allowance</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>13th month</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Adjustments (+)</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left', paddingBottom: '4px' }}>Adjustments (-)</td><td style={{ paddingBottom: '4px' }}>-</td></tr>
                                        <tr><td style={{ textAlign: 'center', fontWeight: 'bold' }}>TOTAL</td><td></td></tr>
                                        <tr><td style={{ textAlign: 'left', fontWeight: 'bold' }}>GROSS PAY</td><td style={{ fontWeight: 'bold', borderTop: '1px solid #c0c0c0', borderBottom: '3px double #c0c0c0' }}>{gross.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                                        
                                        <tr><td style={{ paddingTop: '4px', paddingBottom: '1px', textAlign: 'left', fontWeight: 'bold', textDecoration: 'underline' }}>DEDUCTIONS</td><td style={{ paddingTop: '4px' }}></td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Withholding tax</td><td>{tax > 0 ? tax.toFixed(2) : '-'}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>SSS</td><td>{sss > 0 ? sss.toFixed(2) : '-'}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>WISP</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Philhealth</td><td>{philhealth > 0 ? philhealth.toFixed(2) : '-'}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>Pag-ibig</td><td>{pagibig > 0 ? `(${pagibig.toFixed(2)})` : '-'}</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>SSS Loan</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left' }}>HDMF Loan</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left', paddingBottom: '4px' }}>others</td><td>-</td></tr>
                                        <tr><td style={{ textAlign: 'left', fontWeight: 'bold' }}>TOTAL DEDUCTION</td><td style={{ borderTop: '1px solid #c0c0c0' }}>{totalDeduction > 0 ? `(${totalDeduction.toFixed(2)})` : '-'}</td></tr>
                                      </tbody>
                                    </table>
                                    
                                    <table style={{ width: '100%', marginTop: '2px', tableLayout: 'fixed' }}>
                                      <tbody>
                                        <tr>
                                          <td style={{ textAlign: 'left', fontWeight: 'bold' }}>NETPAY</td>
                                          <td style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '1px solid #c0c0c0', borderBottom: '3px double #c0c0c0', color: 'red' }}>{netPay.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
                              <div style={{ width: '45%' }}>
                                <div style={{ marginBottom: '8px' }}>PREPARED BY:</div>
                                <div style={{ borderBottom: '1px solid #000', width: '100%', height: '16px', marginBottom: '2px' }}></div>
                                <div contentEditable suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 'bold', outline: '1px dashed #cbd5e1' }}>{preparedBy.toUpperCase()}</div>
                                <div style={{ textAlign: 'center' }}>SIGNATURE / DATE</div>
                              </div>
                              <div style={{ width: '45%' }}>
                                <div style={{ marginBottom: '8px', textAlign: 'right' }}>Received the amount shown above in full settlement.</div>
                                <div style={{ borderBottom: '1px solid #000', width: '100%', height: '16px', marginBottom: '2px' }}></div>
                                <div contentEditable suppressContentEditableWarning style={{ textAlign: 'center', fontWeight: 'bold', outline: '1px dashed #cbd5e1' }}>{emp.name.toUpperCase()}</div>
                                <div style={{ textAlign: 'center' }}>SIGNATURE / DATE</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </div>
      </div>
    );
    
    return createPortal(printContent, document.body);
  };

  return (
    <PayrollAuth>
      <Toaster position="bottom-right" />
      <div>
        <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Payroll History & Processing</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage attendance, allocation, and payroll generation</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activeTab === 'history' && (
              <>
                <button 
                  onClick={() => {
  setSelectedEmployees(attendance.map(emp => emp.id));
  setActiveTab('manpower');
}}
                  className="btn btn-secondary" 
                  disabled={!selectedRunId}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    opacity: !selectedRunId ? 0.5 : 1,
                    cursor: !selectedRunId ? 'not-allowed' : 'pointer',
                    background: !selectedRunId ? '#f1f5f9' : undefined,
                    color: !selectedRunId ? '#94a3b8' : undefined
                  }}
                >
                  <Users size={16} /> Manpower
                </button>
                {selectedRunId && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', margin: '0 8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', marginRight: '4px' }}>Selected Period:</span> 
                    {history.find(h => h.id === selectedRunId)?.period}
                  </div>
                )}
                <button 
                  onClick={handleDirectGenerate} 
                  disabled={!selectedRunId}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
                    fontWeight: 600, background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px',
                    opacity: !selectedRunId ? 0.5 : 1, cursor: !selectedRunId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FileText size={16} /> 
                  {selectedRunId && history.find(h => h.id === selectedRunId)?.status === 'GENERATED' 
                    ? 'View Generated Payroll' 
                    : 'Generate Payroll'}
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'attendance' && renderAttendance()}
          {activeTab === 'manpower' && renderManpower()}
        </AnimatePresence>

        {wizardStep > 0 && renderWizard()}
      </div>
      {renderPrintPreview()}
    </PayrollAuth>
  );
}
