import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Home,
  PieChart,
  ShoppingCart,
  Users,
  Briefcase,
  Zap,
  Wrench,
  FileText,
} from "lucide-react";
import { AppPage, ModuleType } from "../../types/pages";
import { monitoringModules } from "../../config/modules";
import { NotificationCenter } from "./NotificationCenter";
import { modulePermissionKeys, useAccess } from "../../lib/accessControl";

interface SidebarProps {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  activeModule: ModuleType | null;
  setActiveModule: (module: ModuleType | null) => void;
  selectedProjectId: string | null;
  selectedProjectName?: string;
  toggleProjectSelector: () => void;
}

export function Sidebar({
  activePage,
  setActivePage,
  activeModule,
  setActiveModule,
  selectedProjectId,
  selectedProjectName,
  toggleProjectSelector,
}: SidebarProps) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const { hasPermission, profile } = useAccess();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      console.warn("Failed to save theme:", e);
    }
  }, [theme]);

  const allItems = [
    {
      id: "budget" as ModuleType,
      label: "Budget",
      icon: <PieChart size={20} />,
    },
    {
      id: "procurement" as ModuleType,
      label: "Procurement",
      icon: <ShoppingCart size={20} />,
    },
    {
      id: "payroll" as ModuleType,
      label: "Payroll",
      icon: <Users size={20} />,
    },
    {
      id: "project" as ModuleType,
      label: "Task",
      icon: <Briefcase size={20} />,
    },
    {
      id: "reports" as ModuleType,
      label: "Reports",
      icon: <FileText size={20} />,
    },
    {
      id: "tools" as ModuleType,
      label: "Tools",
      icon: <Wrench size={20} />,
    },
  ];

  const role = (profile?.role || "").trim().toLowerCase();

  const items = allItems.filter((item) => {
    // Project Manager can see all sidebar modules
    if (role === "project manager") return true;

    // Payroll Admin must see Payroll module
    if (role === "payroll admin" && item.id === "payroll") return true;

    // Tools should be visible to all active users
    if (item.id === "tools") return true;

    const keys =
      modulePermissionKeys[item.id as Exclude<ModuleType, null>] || [];

    return keys.some((key) => hasPermission(key, "view"));
  });

  const getFirstAllowedPage = (moduleId: string): AppPage | null => {
    const mod = monitoringModules.find((m) => m.id === moduleId);

    if (!mod) return null;

    const firstPage = mod.items.find((item) => {
      if ("type" in item) return false;

      const pageId = (item as { id: string }).id;

      // Project Manager can open first available page in every module
      if (role === "project manager") return true;

      // Payroll Admin fallback
      if (
        role === "payroll admin" &&
        ["payroll-dashboard", "employee", "attendance"].includes(pageId)
      ) {
        return true;
      }

      return hasPermission(pageId, "view");
    });

    if (!firstPage || "type" in firstPage) return null;

    return (firstPage as { id: string }).id as AppPage;
  };

  const handleNavClick = (id: string) => {
    const mod = monitoringModules.find((m) => m.id === id);

    if (!mod) return;

    setActiveModule(mod.id as ModuleType);

    const requiresProject = [
      "budget",
      "procurement",
      "payroll",
      "project",
      "reports",
    ].includes(id);

    if (selectedProjectId || !requiresProject) {
      const firstAllowedPage = getFirstAllowedPage(id);

      if (firstAllowedPage) {
        setActivePage(firstAllowedPage);
      }
    }
  };

  const handleNavigateToNotification = (
    moduleId: ModuleType,
    pageId: AppPage,
    projectId: string
  ) => {
    if (projectId) {
      const numId = isNaN(Number(projectId)) ? projectId : Number(projectId);

      (window as any).currentProjectId = numId;

      if (typeof (window as any)._setCurrentProjectId === "function") {
        (window as any)._setCurrentProjectId(numId);
      }

      if (typeof (window as any).__syncReactState === "function") {
        (window as any).__syncReactState(pageId, numId);
      }
    }

    setActiveModule(moduleId);
    setActivePage(pageId);
  };

  return (
    <aside className="w-[100px] h-[calc(100vh-32px)] my-4 ml-4 rounded-xl flex-shrink-0 flex flex-col items-center py-6 bg-[#1A1C20] z-50 overflow-y-visible no-scrollbar relative">
      {/* Logo Area */}
      <div
        className="flex flex-col items-center mb-6 w-full cursor-pointer group"
        onClick={() => {
          setActiveModule(null);
          setActivePage("dashboard");
        }}
      >
        <div className="w-[48px] h-[42px] bg-[#3b82f6] flex items-center justify-center text-white mb-2 rounded-lg shadow-[0_4px_20px_rgba(59,130,246,0.35)] group-hover:scale-105 transition-transform duration-300">
          <Zap size={24} fill="currentColor" strokeWidth={0} />
        </div>

        <span className="text-[9px] text-white/90 font-bold tracking-wider uppercase text-center w-full px-2">
          STEC Portal
        </span>
      </div>

      {/* Utility Icons */}
      <div className="flex flex-col gap-4 mb-6 text-[#6B7280] w-full items-center pl-1 pr-1">
        <NotificationCenter
          onNavigateToNotification={handleNavigateToNotification}
        />

        <button
          className="hover:text-white transition-colors"
          title="Toggle Theme"
          onClick={() =>
            setTheme((prev) => (prev === "light" ? "dark" : "light"))
          }
        >
          {theme === "light" ? (
            <Moon size={20} strokeWidth={2} />
          ) : (
            <Sun size={20} strokeWidth={2} />
          )}
        </button>

        <button
          className="hover:text-white transition-colors"
          title="Home"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <Home size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-white/10 rounded-full mb-6" />

      {/* Main Nav Items */}
      <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto no-scrollbar">
        {items.map((item) => {
          const isActive = activeModule === item.id;

          return (
            <div
              key={item.id}
              className="relative w-full flex justify-center group flex-shrink-0"
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
              )}

              <button
                onClick={() => handleNavClick(item.id as string)}
                title={item.label}
                className={`flex flex-col items-center justify-center w-[72px] h-[72px] rounded-xl transition-all duration-300 ${
                  isActive
                    ? "text-white bg-[#2A2B30]"
                    : "text-[#6B7280] hover:text-[#D1D5DB] hover:bg-white/5"
                }`}
              >
                {React.cloneElement(item.icon, {
                  size: 22,
                  strokeWidth: isActive ? 2 : 1.5,
                  className: "mb-1.5",
                })}

                <span
                  className={`text-[10px] font-bold tracking-wide ${
                    isActive ? "text-white" : "text-[#6B7280]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}