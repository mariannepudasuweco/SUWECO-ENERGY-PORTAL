import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Calendar, DollarSign, TrendingUp, FileText, Clock, ChevronRight, Printer } from 'lucide-react';
import PayrollAuth from './PayrollAuth';
import { generatePrintInternalHTML } from '../lib/payrollPrinting';
import { supabase } from '../lib/supabaseClient';

interface PayrollDashboardProps {
  selectedProjectId?: string | null;
  selectedProjectName?: string;
}

export default function PayrollDashboard({ selectedProjectId, selectedProjectName }: PayrollDashboardProps = {}) {
  const activeProjectId = selectedProjectId || (window as any).currentProjectId || '';
  const [employees, setEmployees] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
  loadPayrollDashboardData();
}, [activeProjectId]);

const loadPayrollDashboardData = async () => {
  if (!activeProjectId) {
    setEmployees([]);
    setHistory([]);
    return;
  }

  const { data: employeesData, error: employeesError } = await supabase
    .from('payroll_employees')
    .select('*')
    .eq('project_id', activeProjectId)
    .order('created_at', { ascending: false });

  console.log('DASHBOARD EMPLOYEES:', employeesData);
  console.log('DASHBOARD EMPLOYEES ERROR:', employeesError);

  if (employeesError) {
    console.error(employeesError);
    setEmployees([]);
  } else {
    setEmployees(employeesData || []);
  }

  const { data: runsData, error: runsError } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('project_id', activeProjectId)
    .order('created_at', { ascending: false });

  console.log('DASHBOARD PAYROLL RUNS:', runsData);
  console.log('DASHBOARD PAYROLL RUNS ERROR:', runsError);

  if (runsError) {
    console.error(runsError);
    setHistory([]);
  } else {
    const mappedRuns = (runsData || []).map(row => ({
      id: row.id,
      period: row.period,
      dateGenerated: row.date_generated,
      employeesCount: row.employees_count || 0,
      totalGross: Number(row.total_gross || 0),
      status: row.status || 'NOT GENERATED',
      weekStart: row.week_start,
      weekEnd: row.week_end,
      projectName: row.project_name || selectedProjectName || '',
      projectId: row.project_id,
      attendance: row.attendance || [],
      allocations: row.allocations || {},
      selectedEmployees: row.selected_employees || []
    }));

    setHistory(mappedRuns);
  }
};

const totalEmployees = employees.length;

const activeEmployees = employees.filter(emp =>
  String(emp.status || '').toUpperCase() === 'ACTIVE'
).length;

const generatedRuns = history.filter(run =>
  String(run.status || '').toUpperCase() === 'GENERATED'
);

const pendingRuns = history.filter(run =>
  String(run.status || '').toUpperCase() !== 'GENERATED'
);

const totalPayroll = generatedRuns.reduce(
  (sum, run) => sum + Number(run.totalGross || 0),
  0
);

const latestPayroll = history.length > 0
  ? Number(history[0].totalGross || 0)
  : 0;

const avgDailyRate = employees.length > 0
  ? employees.reduce((sum, emp) => sum + Number(emp.daily_rate || 0), 0) / employees.length
  : 0;

  return (
    <PayrollAuth>
      <div>
        <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Payroll Dashboard</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Overview of payroll operations and metrics</div>
          </div>
          <button 
            onClick={() => (window as any).renderPayrollProcessingView?.()}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Process Payroll <ChevronRight size={16} />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Total Employees</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">{totalEmployees}</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Active Employees</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">{activeEmployees}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Generated Payroll Total</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">₱{totalPayroll.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-medium text-slate-500 text-[13px] mb-0.5">Avg Daily Rate</h3>
              <div className="text-[22px] leading-none font-bold text-slate-800">₱{avgDailyRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Recent Payroll Runs */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--text-main)' }}>Recent Payroll Runs</h3>
              <button onClick={() => (window as any).renderPayrollProcessingView?.()} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.85rem', fontFamily: "'Inter', system-ui, sans-serif" }}>
              <thead style={{ background: 'var(--bg-body)' }}>
                <tr>
                  <th style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Period</th>
                  <th style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Employees</th>
                  <th style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Total Amount</th>
                  <th style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                  <th style={{ padding: '14px 24px', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>Print</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No recent payroll runs.
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 5).map(run => (
                    <tr key={run.id} style={{ cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-body)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--primary)' }} />
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{run.period}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>{run.employeesCount}</td>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-main)' }}>₱{run.totalGross.toLocaleString()}</td>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534', textTransform: 'uppercase' }}>
                          {run.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                           <button 
                             onClick={() => {
                               const html = generatePrintInternalHTML('local', {
                                 attendance: run.attendance,
                                 projectName: run.projectName || selectedProjectName || 'STEC PROJECT',
                                 weekStart: run.weekStart || run.period?.split(' to ')[0],
                                 weekEnd: run.weekEnd || run.period?.split(' to ')[1],
                                 locationFilter: 'All'
                               });
                               setPreviewHtml(html);
                             }}
                             title="Print Attendance"
                             style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                           >
                             <Printer size={16} />
                           </button>
                           <button 
                             onClick={() => {
                               const html = generatePrintInternalHTML('manila', {
                                 attendance: run.attendance,
                                 projectName: run.projectName || 'STEC PROJECT',
                                 weekStart: run.weekStart || run.period.split(' to ')[0],
                                 weekEnd: run.weekEnd || run.period.split(' to ')[1],
                                 locationFilter: 'All'
                               });
                               setPreviewHtml(html);
                             }}
                             title="Print Register"
                             style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '4px' }}
                           >
                             <FileText size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Upcoming Tasks */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
  <div style={{ display: 'flex', gap: '16px' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Clock size={20} />
    </div>
    <div>
      <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '4px' }}>Pending Payroll Runs</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {pendingRuns.length} payroll run{pendingRuns.length !== 1 ? 's' : ''} not yet generated
      </p>
    </div>
  </div>

  <div style={{ display: 'flex', gap: '16px' }}>
    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fefce8', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FileText size={20} />
    </div>
    <div>
      <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '4px' }}>Generated Payroll Runs</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {generatedRuns.length} generated payroll run{generatedRuns.length !== 1 ? 's' : ''}
      </p>
    </div>
  </div>
</div>
          </div>
        </div>
      </div>

      {previewHtml && createPortal(
        <div className="fixed-preview-layer" style={{ position: 'fixed', inset: 0, zIndex: 9999999, pointerEvents: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="preview-header" style={{ height: '64px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Print Preview
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPreviewHtml(null)} className="btn btn-secondary" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>Close Preview</button>
              <button 
                onClick={() => {
                  if (!previewHtml) return;
                  try {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.open();
                      printWindow.document.write(previewHtml + '<script>window.onload=function(){setTimeout(function(){window.print();},250);};</' + 'script>');
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
                  printIframe.srcdoc = previewHtml + '<script>window.onload=function(){setTimeout(function(){window.print();},100);};</' + 'script>';
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
      )}

    </PayrollAuth>
  );
}
