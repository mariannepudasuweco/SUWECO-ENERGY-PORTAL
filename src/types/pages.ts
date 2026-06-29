export type TopNavPage = 'dashboard' | 'projects' | 'tasks' | 'calendar';
export type ToolsPage = 'ai-meeting-recorder';
export type ReportsPage = 'reports-notifications';
export type BudgetPage = 'boq-charging' | 'expense-overview' | 'look-ahead' | 'bill-of-quantities';
export type ProcurementPage = 'procurement-dashboard' | 'request' | 'manila' | 'local' | 'materials' | 'fuel';
export type PayrollPage = 'payroll-dashboard' | 'employee' | 'attendance';
export type ProjectTaskPage = 'project-schedule' | 'activity-history' | 'activity-week-detail' | 'task-dashboard' | 'kanban-board' | 'deadlines' | 'task-delegation' | 'wbs-checklist' | 'wbs-sequence';

export type AppPage = TopNavPage | ToolsPage | ReportsPage | BudgetPage | ProcurementPage | PayrollPage | ProjectTaskPage;

export type ModuleType = 'budget' | 'procurement' | 'payroll' | 'project' | 'tools' | 'reports' | null;

export interface Project {
  id: string;
  title: string;
  status: 'In Bidding' | 'Awarded' | 'Ongoing' | 'On Hold' | 'Completed' | 'Cancelled';
  dueDate: string;
  budget?: number;
}
