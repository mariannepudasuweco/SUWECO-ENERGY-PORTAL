import { useEffect } from 'react';
import { AppPage } from '../../types/pages';
import { isReactPage } from '../../config/pageRegistry';
import { loadProjectScheduleIntoLegacyState } from '../../apis/projectSchedule';

interface LegacyVanillaWrapperProps {
  activePage: AppPage;
  selectedProjectId: string | null;
}

/**
 * Bridge between React navigation and the remaining Vanilla JS pages.
 */
export function LegacyVanillaWrapper({
  activePage,
  selectedProjectId,
}: LegacyVanillaWrapperProps) {
  useEffect(() => {
    if (isReactPage(activePage)) return;

    const w = window as any;
    const projectId =
      selectedProjectId && selectedProjectId !== 'all'
        ? String(selectedProjectId)
        : undefined;
    let cancelled = false;

    if (!w.__cleanupTasks) w.__cleanupTasks = [];

    // Project IDs are UUID strings. Never convert them with Number().
    if (projectId) {
      w.currentProjectId = projectId;
      if (typeof w._setCurrentProjectId === 'function') {
        w._setCurrentProjectId(projectId);
      }
    }

    const renderVanilla = async () => {
      try {
        if (activePage === 'project-schedule' && w.renderProjectScheduleView) {
          const contentArea = document.getElementById('contentArea');
          if (contentArea) {
            contentArea.innerHTML = `
              <div style="min-height:240px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;">
                Loading project schedule...
              </div>
            `;
          }

          if (projectId) {
            await loadProjectScheduleIntoLegacyState(projectId);
          }

          if (!cancelled) w.renderProjectScheduleView();
          return;
        }

        if (activePage === 'activity-history' && w.renderActivityHistoryView) {
          w.renderActivityHistoryView();
        } else if (
          activePage === 'activity-week-detail' &&
          w.renderActivityWeekDetailView
        ) {
          if (w.currentActivityWeekId) {
            w.renderActivityWeekDetailView(w.currentActivityWeekId);
          } else if (w.renderActivityHistoryView) {
            w.renderActivityHistoryView();
          }
        } else if (activePage === 'task-dashboard' && w.renderTaskDashboardView) {
          w.renderTaskDashboardView();
        } else if (activePage === 'kanban-board' && w.renderKanbanBoardView) {
          w.renderKanbanBoardView();
        } else if (activePage === 'deadlines' && w.renderDeadlinesView) {
          w.renderDeadlinesView();
        } else if (
          activePage === 'task-delegation' &&
          w.renderTaskDelegationView
        ) {
          w.renderTaskDelegationView();
        } else if (activePage === 'boq-charging' && w.renderBoqChargingView) {
          w.renderBoqChargingView();
        } else if (activePage === 'expense-overview' && w.renderExpenseOverview) {
          w.renderExpenseOverview();
        } else if (activePage === 'look-ahead' && w.renderLookAheadView) {
          w.renderLookAheadView();
        } else if (
          activePage === 'procurement-dashboard' &&
          w.renderProcurementDashboard
        ) {
          w.renderProcurementDashboard();
        } else if (activePage === 'request' && w.renderRequestView) {
          w.renderRequestView();
        } else if (activePage === 'manila' && w.renderManilaView) {
          w.renderManilaView();
        } else if (activePage === 'local' && w.renderLocalView) {
          w.renderLocalView();
        } else if (activePage === 'materials' && w.renderMaterialsView) {
          w.renderMaterialsView();
        } else if (activePage === 'fuel' && w.renderFuelView) {
          w.renderFuelView();
        } else if (w.renderProjectView) {
          w.renderProjectView(projectId);
        }
      } catch (error) {
        console.error('Legacy page loading error:', error);
        const contentArea = document.getElementById('contentArea');
        if (contentArea && !cancelled) {
          const message =
            error instanceof Error ? error.message : 'Unable to load this page.';
          contentArea.innerHTML = `
            <div style="margin:24px;padding:16px;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;border-radius:10px;font-size:14px;">
              ${message.replace(/[&<>'"]/g, (character) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;',
              }[character] || character))}
            </div>
          `;
        }
      }
    };

    const timer = window.setTimeout(() => {
      void renderVanilla();
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);

      if (w.__cleanupTasks) {
        w.__cleanupTasks.forEach((fn: () => void) => {
          try {
            fn();
          } catch (error) {
            console.error('Cleanup error', error);
          }
        });
        w.__cleanupTasks = [];
      }

      const contentArea = document.getElementById('contentArea');
      if (contentArea) contentArea.innerHTML = '';
    };
  }, [activePage, selectedProjectId]);

  return null;
}
