import React, { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { AppPage, ModuleType } from './types/pages';
import { pageRegistry } from './config/pageRegistry';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

const getModuleForView = (view: string): ModuleType => {
  const normView = view.replace(/_/g, '-');

  if (['boq-charging', 'expense-overview', 'look-ahead', 'bill-of-quantities'].includes(normView)) {
    return 'budget';
  }

  if (['procurement-dashboard', 'request', 'manila', 'local', 'materials', 'fuel'].includes(normView)) {
    return 'procurement';
  }

  if (['payroll-dashboard', 'employee', 'attendance'].includes(normView)) {
    return 'payroll';
  }

  if (
    [
      'project-schedule',
      'activity-history',
      'activity-week-detail',
      'coordination',
      'delegation',
      'task-dashboard',
      'kanban-board',
      'deadlines',
      'task-delegation',
      'wbs-checklist',
      'wbs-sequence',
      'tasks',
    ].includes(normView)
  ) {
    return 'project';
  }

  if (['ai-meeting-recorder'].includes(normView)) {
    return 'tools';
  }

  if (['reports-notifications'].includes(normView)) {
    return 'reports';
  }

  return null;
};

const normalizePage = (view: string): AppPage => {
  const normView = view.replace(/_/g, '-');

  if (normView === 'project-detail') return 'project-schedule' as AppPage;
  if (normView === 'email-reports') return 'reports-notifications' as AppPage;

  return normView as AppPage;
};

export default function App() {
  const [activePage, setActivePageState] = useState<AppPage>('dashboard');
  const [activeModule, setActiveModule] = useState<ModuleType>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('isAuthenticated') === 'true'
  );

  const isMonitoring = window.location.pathname.startsWith('/monitoring');

  React.useEffect(() => {
    if (!isMonitoring || !isAuthenticated) return;

    const syncSelectedProject = (projectId?: string | null) => {
      setSelectedProjectId(projectId || null);

      if (projectId && (window as any).projects) {
        const project = (window as any).projects.find((p: any) => p.id === projectId);
        setSelectedProjectName(project?.title || project?.name || '');
      } else {
        setSelectedProjectName('');
      }
    };

    const changePage = (view: string, projectId?: string | null) => {
      syncSelectedProject(projectId);

      const targetPage = normalizePage(view);
      const module = getModuleForView(targetPage);

      setActiveModule(module);
      setActivePageState(targetPage);
    };

    (window as any).__syncReactState = changePage;
    (window as any).navigateToPage = changePage;

    const legacy = document.getElementById('legacy-vanilla-modals');
    if (legacy) legacy.style.display = 'block';

    return () => {
      delete (window as any).__syncReactState;
      delete (window as any).navigateToPage;
    };
  }, [isMonitoring, isAuthenticated]);

  const setActivePage = (page: AppPage) => {
    setActivePageState(page);

    const module = getModuleForView(page);
    setActiveModule(module);
  };

  const toggleProjectSelector = () => {
    if (typeof (window as any).renderProjectsView === 'function') {
      (window as any).renderProjectsView();
    }
  };

  const handleLogin = () => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  if (!isMonitoring) {
    return <HomePage />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const PageComponent =
    (pageRegistry[activePage] ||
      (() => <div>Page Not Found ({activePage})</div>)) as React.ComponentType<any>;

  return (
    <MainLayout
      activePage={activePage}
      setActivePage={setActivePage}
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      selectedProjectId={selectedProjectId}
      selectedProjectName={selectedProjectName}
      toggleProjectSelector={toggleProjectSelector}
    >
      <PageComponent
        selectedProjectId={selectedProjectId}
        selectedProjectName={selectedProjectName}
      />
    </MainLayout>
  );
}