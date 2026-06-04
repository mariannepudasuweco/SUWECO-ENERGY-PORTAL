import React from 'react';
import { AppPage } from '../types/pages';

// Top Nav Pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProjectsPage from '../pages/projects/ProjectsPage';
import TasksPage from '../pages/tasks/TasksPage';
import CalendarPage from '../pages/calendar/CalendarPage';
import AIMeetingRecorderPage from '../pages/tools/AIMeetingRecorderPage';

// Modules: Budget
import BillOfQuantitiesPage from '../pages/budget/BillOfQuantitiesPage';
import BOQChargingPage from '../pages/budget/BOQChargingPage';
import ExpenseOverviewPage from '../pages/budget/ExpenseOverviewPage';
import LookAheadPage from '../pages/budget/LookAheadPage';

// Modules: Procurement
import ProcurementDashboardPage from '../pages/procurement/ProcurementDashboardPage';
import RequestPage from '../pages/procurement/RequestPage';
import ManilaPage from '../pages/procurement/ManilaPage';
import LocalPage from '../pages/procurement/LocalPage';
import InventoryPage from '../pages/procurement/InventoryPage';
import MaterialsPage from '../pages/procurement/MaterialsPage';
import FuelPage from '../pages/procurement/FuelPage';

// Modules: Payroll
import PayrollDashboardPage from '../pages/payroll/PayrollDashboardPage';
import EmployeePage from '../pages/payroll/EmployeePage';
import AttendancePage from '../pages/payroll/AttendancePage';

// Modules: Project Tasks
import ProjectSchedulePage from '../pages/project/ProjectSchedulePage';
import ActivityHistoryPage from '../pages/project/ActivityHistoryPage';
import TaskPage from '../pages/project/TaskPage';
import KanbanBoardPage from '../pages/project/KanbanBoardPage';
import DeadlinesPage from '../pages/project/DeadlinesPage';
import TaskDelegationPage from '../pages/project/TaskDelegationPage';
import ReportsNotificationsPage from '../pages/tools/ReportsNotificationsPage';
import WbsChecklistPage from '../pages/project/WbsChecklistPage';
import WbsSequencePage from '../pages/project/WbsSequencePage';

// Interface kept for reference only
// type PageRegistry = {
//   [key: string]: React.FC;
// };

/**
 * HYBRID ARCHITECTURE REGISTRY
 * 
 * This file maps application routes to their corresponding React components.
 * The application is currently in a transitional state between Legacy Vanilla JS
 * and modern React. 
 * 
 * PAGES ARE CATEGORIZED INTO 3 TYPES:
 * 1. React Native: Fully rewritten in React, owns its own rendering and state.
 * 2. Hybrid Wrapper: An empty React component that delegates rendering to a legacy `window.render*` function.
 * 3. Legacy Vanilla: Driven entirely by Vanilla JS DOM mutations (handled by LegacyVanillaWrapper).
 */
export const REACT_ONLY_PAGES: AppPage[] = [
  'dashboard', 
  'payroll-dashboard', 
  'employee', 
  'attendance', 
  'wbs-sequence', 
  'bill-of-quantities', 
  'wbs-checklist', 
  'ai-meeting-recorder', 
  'reports-notifications', 
  'calendar'
];

/**
 * DEPRECATED PATTERNS TO WATCH OUT FOR:
 * - Do not add new pages to the Legacy UI paradigm. Write new features as "React Native".
 * - Pages NOT in REACT_ONLY_PAGES still rely on `src/vanilla-logic.js` for rendering.
 */
export const isReactPage = (page: AppPage): boolean => {
  return REACT_ONLY_PAGES.includes(page);
};

export const pageRegistry: Record<AppPage, React.FC> = {
  // Top Nav
  'dashboard': DashboardPage,
  'projects': ProjectsPage,
  'tasks': TasksPage,
  'calendar': CalendarPage,
  'ai-meeting-recorder': AIMeetingRecorderPage,
  
  // Budget
  'boq-charging': BOQChargingPage,
  'expense-overview': ExpenseOverviewPage,
  'look-ahead': LookAheadPage,
  'bill-of-quantities': BillOfQuantitiesPage,

  // Procurement
  'procurement-dashboard': ProcurementDashboardPage,
  'request': RequestPage,
  'manila': ManilaPage,
  'local': LocalPage,
  'materials': MaterialsPage,
  'fuel': FuelPage,

  // Payroll
  'payroll-dashboard': PayrollDashboardPage,
  'employee': EmployeePage,
  'attendance': AttendancePage,

  // Project (Tasks & Planning)
  'project-schedule': ProjectSchedulePage,
  'activity-history': ActivityHistoryPage,
  'activity-week-detail': ActivityHistoryPage,
  'task-dashboard': TaskPage,
  'kanban-board': KanbanBoardPage,
  'deadlines': DeadlinesPage,
  'task-delegation': TaskDelegationPage,
  'reports-notifications': ReportsNotificationsPage,
  'wbs-checklist': WbsChecklistPage,
  'wbs-sequence': WbsSequencePage,
};
