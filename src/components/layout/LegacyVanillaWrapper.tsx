import { useEffect } from 'react';
import { AppPage } from '../../types/pages';
import { isReactPage } from '../../config/pageRegistry';

interface LegacyVanillaWrapperProps {
  activePage: AppPage;
  selectedProjectId: string | null;
}

/**
 * LEGACY VANILLA WRAPPER
 * 
 * This component acts as the bridge between React Router and the old Vanilla JS rendering engine.
 * When a page route is NOT listed in `REACT_ONLY_PAGES`, this wrapper triggers the corresponding
 * global `window.render*` function to manually paint the DOM inside the `#contentArea`.
 * 
 * WARNING: This is a deprecated pattern.
 * - Do NOT add new routes here.
 * - The goal is to eventually retire this wrapper as all pages migrate to React.
 */
export function LegacyVanillaWrapper({ activePage, selectedProjectId }: LegacyVanillaWrapperProps) {
  useEffect(() => {
    if (isReactPage(activePage)) {
      return;
    }

    const numId = selectedProjectId && selectedProjectId !== 'all' ? Number(selectedProjectId) : undefined;
    const w = window as any;

    if (!w.__cleanupTasks) {
      w.__cleanupTasks = [];
    }

const renderVanilla = () => {
  if (activePage === 'project-schedule' && w.renderProjectScheduleView) {
    w.renderProjectScheduleView();
  }
  else if (activePage === 'activity-history' && w.renderActivityHistoryView) {
    w.renderActivityHistoryView();
  }
  else if (activePage === 'activity-week-detail' && w.renderActivityWeekDetailView) {
    if (w.currentActivityWeekId) {
      w.renderActivityWeekDetailView(w.currentActivityWeekId);
    } else if (w.renderActivityHistoryView) {
      w.renderActivityHistoryView();
    }
  }
  else if (activePage === 'task-dashboard' && w.renderTaskDashboardView) {
    w.renderTaskDashboardView();
  }
  else if (activePage === 'kanban-board' && w.renderKanbanBoardView) {
    w.renderKanbanBoardView();
  }
  else if (activePage === 'deadlines' && w.renderDeadlinesView) {
    w.renderDeadlinesView();
  }
  else if (activePage === 'task-delegation' && w.renderTaskDelegationView) {
    w.renderTaskDelegationView();
  }
  else if (activePage === 'boq-charging' && w.renderBoqChargingView) {
    w.renderBoqChargingView();
  }
  else if (activePage === 'expense-overview' && w.renderExpenseOverview) {
    w.renderExpenseOverview();
  }
  else if (activePage === 'look-ahead' && w.renderLookAheadView) {
    w.renderLookAheadView();
  }
  else if (activePage === 'procurement-dashboard' && w.renderProcurementDashboard) {
    w.renderProcurementDashboard();
  }
  else if (activePage === 'request' && w.renderRequestView) {
    w.renderRequestView();
  }
  else if (activePage === 'manila' && w.renderManilaView) {
    w.renderManilaView();
  }
  else if (activePage === 'local' && w.renderLocalView) {
    w.renderLocalView();
  }
  else if (activePage === 'materials' && w.renderMaterialsView) {
    w.renderMaterialsView();
  }
  else if (activePage === 'fuel' && w.renderFuelView) {
    w.renderFuelView();
  }
  else if (w.renderProjectView) {
    w.renderProjectView(numId);
  }
};

    const timer = setTimeout(renderVanilla, 50);
    return () => {
      clearTimeout(timer);
      if (w.__cleanupTasks) {
        w.__cleanupTasks.forEach((fn: () => void) => {
          try { fn(); } catch (e) { console.error('Cleanup error', e); }
        });
        w.__cleanupTasks = [];
      }
      
      const contentArea = document.getElementById('contentArea');
      if (contentArea) {
        contentArea.innerHTML = '';
      }
    };
  }, [activePage, selectedProjectId]);

  return null;
}
