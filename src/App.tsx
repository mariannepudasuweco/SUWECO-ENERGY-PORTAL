import React, { useState } from "react";
import { MainLayout } from "./components/layout/MainLayout";
import { AppPage, ModuleType } from "./types/pages";
import { pageRegistry } from "./config/pageRegistry";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AccessProvider, useAccess } from "./lib/accessControl";
import { supabase } from "./lib/supabaseClient";

const getModuleForView = (view: string): ModuleType => {
  const normView = view.replace(/_/g, "-");

  if (
    ["boq-charging", "expense-overview", "look-ahead", "bill-of-quantities"].includes(
      normView
    )
  ) {
    return "budget";
  }

  if (
    ["procurement-dashboard", "request", "manila", "local", "materials", "fuel"].includes(
      normView
    )
  ) {
    return "procurement";
  }

  if (["payroll-dashboard", "employee", "attendance"].includes(normView)) {
    return "payroll";
  }

  if (
    [
      "project-schedule",
      "activity-history",
      "activity-week-detail",
      "coordination",
      "delegation",
      "task-dashboard",
      "kanban-board",
      "deadlines",
      "task-delegation",
      "wbs-checklist",
      "wbs-sequence",
      "tasks",
    ].includes(normView)
  ) {
    return "project";
  }

  if (["ai-meeting-recorder"].includes(normView)) {
    return "tools";
  }

  if (["reports-notifications"].includes(normView)) {
    return "reports";
  }

  return null;
};

const normalizePage = (view: string): AppPage => {
  const normView = view.replace(/_/g, "-");

  if (normView === "project-detail") return "project-schedule" as AppPage;
  if (normView === "email-reports") return "reports-notifications" as AppPage;

  return normView as AppPage;
};

function MonitoringApp({ onLogout }: { onLogout: () => void }) {
  const [activePage, setActivePageState] = useState<AppPage>("dashboard");
  const [activeModule, setActiveModule] = useState<ModuleType>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");

  const { loadingAccess, accessError, profile, hasPermission } = useAccess();

  React.useEffect(() => {
    const syncSelectedProject = (projectId?: string | null) => {
      setSelectedProjectId(projectId || null);

      if (projectId && (window as any).projects) {
        const project = (window as any).projects.find(
          (p: any) => p.id === projectId
        );
        setSelectedProjectName(project?.title || project?.name || "");
      } else {
        setSelectedProjectName("");
      }
    };

    const changePage = (view: string, projectId?: string | null) => {
      syncSelectedProject(projectId);

      const targetPage = normalizePage(view);
      const module = getModuleForView(targetPage);

      if (!hasPermission(targetPage, "view")) {
        setActiveModule(null);
        setActivePageState("dashboard");
        return;
      }

      setActiveModule(module);
      setActivePageState(targetPage);
    };

    (window as any).__syncReactState = changePage;
    (window as any).navigateToPage = changePage;

    const legacy = document.getElementById("legacy-vanilla-modals");
    if (legacy) legacy.style.display = "block";

    return () => {
      delete (window as any).__syncReactState;
      delete (window as any).navigateToPage;
    };
  }, [hasPermission]);

  const setActivePage = (page: AppPage) => {
    if (!hasPermission(page, "view")) {
      setActiveModule(null);
      setActivePageState("dashboard");
      return;
    }

    setActivePageState(page);

    const module = getModuleForView(page);
    setActiveModule(module);
  };

  const toggleProjectSelector = () => {
    if (typeof (window as any).renderProjectsView === "function") {
      (window as any).renderProjectsView();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem("isAuthenticated");
    onLogout();
  };

  if (loadingAccess) {
    return (
      <div className="min-h-screen bg-[#1b2d48] flex items-center justify-center text-white">
        Checking user access...
      </div>
    );
  }

  if (accessError || !profile) {
    return (
      <div className="min-h-screen bg-[#1b2d48] flex items-center justify-center p-6 text-white">
        <div className="max-w-md rounded-2xl bg-white/10 border border-white/10 p-6 text-center">
          <h1 className="text-xl font-bold mb-3">Access not available</h1>

          <p className="text-sm text-white/80 mb-5">
            {accessError || "No active profile found."}
          </p>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-[#f5a623] hover:bg-[#e09510] text-white font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
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

export default function App() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem("isAuthenticated") === "true"
  );

  const isMonitoring = window.location.pathname.startsWith("/monitoring");

  const handleLogin = () => {
    sessionStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    setAuthMode("login");
  };

  if (!isMonitoring) {
    return <HomePage />;
  }

  if (!isAuthenticated) {
    if (authMode === "signup") {
      return <SignupPage onBackToLogin={() => setAuthMode("login")} />;
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onSignup={() => setAuthMode("signup")}
      />
    );
  }

  return (
    <AccessProvider>
      <MonitoringApp onLogout={handleLogout} />
    </AccessProvider>
  );
}