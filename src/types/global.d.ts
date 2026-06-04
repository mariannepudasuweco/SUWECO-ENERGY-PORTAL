export {};

declare global {
  interface Window {
    __cleanupTasks?: Array<() => void>;
    navigateToPage?: (view: string, projectId?: string | null) => void;
    renderBoqChargingView?: () => void;
    renderExpenseOverview?: () => void;
    renderLookAheadView?: () => void;
    renderCalendarView?: (...args: any[]) => void;
    renderDashboard?: () => void;
    renderPayrollProcessingView?: () => void;
    renderEmployeeView?: () => void;
    renderPayrollDashboard?: () => void;
    renderFuelView?: () => void;
    renderMaterialsView?: () => void;
    renderLocalView?: () => void;
    renderManilaView?: () => void;
    renderProcurementDashboard?: () => void;
    renderRequestView?: () => void;
    renderActivityHistoryView?: () => void;
    renderDeadlinesView?: () => void;
    renderEmailReportsView?: () => void;
    renderKanbanBoardView?: () => void;
    renderProjectScheduleView?: () => void;
    renderSitePhotosHistoryView?: () => void;
    renderTaskDelegationView?: () => void;
    renderTaskDashboardView?: () => void;
    renderWbsChecklistView?: () => void;
    renderWbsSequenceView?: () => void;
    renderProjectsView?: () => void;
    __syncReactState?: (view: string, projectId: string | null) => void;
    _setCurrentProjectId?: (id: string | number) => void;
    currentProjectId?: string | number;
    projects?: any[];
    wbsTasks?: any[];
    [key: string]: any; // Catch all just in case
  }
}
