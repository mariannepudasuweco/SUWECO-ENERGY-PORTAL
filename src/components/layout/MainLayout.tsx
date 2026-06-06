import React, { useState, useEffect } from 'react';
import { Sidebar } from '../navigation/Sidebar';
import { AppPage, ModuleType } from '../../types/pages';
import { Folder, Building2, ChevronDown, Check, FileText, Files } from 'lucide-react';
import { monitoringModules } from '../../config/modules';
import { AnimatePresence, motion } from 'motion/react';
import { isReactPage } from '../../config/pageRegistry';
import { LegacyVanillaWrapper } from './LegacyVanillaWrapper';
import { useAccess } from '../../lib/accessControl';
import {
  generateCurrentPageReport,
  generateFullModuleReport,
} from '../../utils/reporting';

interface MainLayoutProps {
  children: React.ReactNode;
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  selectedProjectId: string | null;
  selectedProjectName?: string;
  toggleProjectSelector: () => void;
}

export function MainLayout({
  children,
  activePage,
  setActivePage,
  activeModule,
  setActiveModule,
  selectedProjectId,
  selectedProjectName,
  toggleProjectSelector,
}: MainLayoutProps) {
  const { hasPermission } = useAccess();

  const currentModuleObj = activeModule
    ? monitoringModules.find((m) => m.id === activeModule)
    : null;

  const requiresProject = ['budget', 'procurement', 'payroll', 'project', 'reports'].includes(
    activeModule as string
  );

  const isSelectingProject = !selectedProjectId && requiresProject;

  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const visibleModuleItems =
    currentModuleObj?.items
      ?.filter((item) => {
        if ('type' in item) return false;
        return hasPermission((item as { id: string }).id, 'view');
      })
      .map((item) => item as { id: string; label: string; icon?: React.ReactNode }) || [];

  const showTabs = !!(
    currentModuleObj &&
    visibleModuleItems.length > 0 &&
    (!requiresProject || selectedProjectId)
  );

  const reportableModuleItems = visibleModuleItems;

  const currentPageLabel =
    reportableModuleItems.find((item) => item.id === activePage)?.label ||
    String(activePage)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const canShowReportButtons =
    !!currentModuleObj &&
    reportableModuleItems.length > 0 &&
    !isSelectingProject &&
    showTabs;

  useEffect(() => {
    const updateProjects = () => {
      if ((window as any).projects && Array.isArray((window as any).projects)) {
        setProjectsList([...(window as any).projects]);
      }
    };

    updateProjects();

    const interval = setInterval(updateProjects, 1000);

    window.addEventListener('projectsUpdated', updateProjects);

    return () => {
      clearInterval(interval);
      window.removeEventListener('projectsUpdated', updateProjects);
    };
  }, []);

  const handleGenerateCurrentView = async () => {
    if (!currentModuleObj) return;

    setIsGeneratingReport(true);

    try {
      await generateCurrentPageReport({
        pageTitle: currentPageLabel,
        moduleTitle: currentModuleObj.label,
        projectName: selectedProjectName || 'Alcantara Diesel Power Plant',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGenerateFullReport = async () => {
    if (!currentModuleObj) return;

    setIsGeneratingReport(true);

    try {
      await generateFullModuleReport({
        moduleId: String(currentModuleObj.id),
        moduleTitle: currentModuleObj.label,
        projectName: selectedProjectName || 'Alcantara Diesel Power Plant',
        moduleItems: reportableModuleItems.map((item) => ({
          id: item.id,
          label: item.label,
        })),
        originalPage: activePage,
        setActivePage,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#0A0F1A] w-full overflow-hidden font-inter text-[#172b4d] dark:text-[#E2E6DF]">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        activeModule={activeModule as ModuleType}
        setActiveModule={setActiveModule as (m: ModuleType) => void}
        selectedProjectId={selectedProjectId}
        selectedProjectName={selectedProjectName}
        toggleProjectSelector={toggleProjectSelector}
      />

      <main className="flex-1 flex flex-col relative w-full overflow-hidden pt-4 pr-6 pb-6 pl-4 sm:pl-6 max-w-[1920px] mx-auto">
        <div className="flex-1 flex flex-col relative w-full h-full">
          <div className="flex gap-2 items-end z-10 w-full translate-y-[1px] pl-6 pr-4 relative">
            {requiresProject && (
              <div
                className={`mr-4 mb-2 transition-all duration-300 relative ${
                  isSelectingProject ? 'z-50' : ''
                }`}
              >
                {isSelectingProject && (
                  <div className="absolute -inset-2 bg-blue-500/20 rounded-2xl blur-lg animate-pulse" />
                )}

                <div
                  className={`relative ${
                    isSelectingProject
                      ? 'ring-4 ring-blue-500/30 rounded-xl shadow-xl scale-105 transform origin-bottom-left'
                      : ''
                  }`}
                >
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`min-w-[200px] h-10 w-full flex items-center justify-between border rounded-xl pl-3 pr-3 py-2 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-blue-400 transition-all cursor-pointer shadow-sm relative ${
                      isSelectingProject
                        ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200'
                        : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden pointer-events-none">
                      <Building2
                        size={16}
                        className={`flex-shrink-0 transition-colors ${
                          isSelectingProject
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      />

                      <span className="truncate">
                        {selectedProjectName || 'Select a project...'}
                      </span>
                    </div>

                    <ChevronDown
                      size={14}
                      className={`flex-shrink-0 transition-transform ${
                        isDropdownOpen ? 'rotate-180' : ''
                      } ${
                        isSelectingProject
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsDropdownOpen(false)}
                      />

                      <div className="absolute top-full left-0 mt-1.5 w-[280px] bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden flex flex-col max-h-[300px]">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Available Projects
                          </span>
                        </div>

                        <div className="overflow-y-auto flex-1 p-1">
                          {projectsList.map((p) => {
                            const isSelected = String(p.id) === String(selectedProjectId);

                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setIsDropdownOpen(false);

                                  if (p.id) {
                                    const numId = isNaN(Number(p.id)) ? p.id : Number(p.id);

                                    (window as any).currentProjectId = numId;

                                    if (typeof (window as any)._setCurrentProjectId === 'function') {
                                      (window as any)._setCurrentProjectId(numId);
                                    }

                                    let targetPage = activePage;

                                    if (activeModule) {
                                      const currentModObj = monitoringModules.find(
                                        (m) => m.id === activeModule
                                      );

                                      if (currentModObj) {
                                        const isPageInModule = currentModObj.items.some(
                                          (i) => !('type' in i) && (i as any).id === activePage
                                        );

                                        if (!isPageInModule) {
                                          const firstPage = currentModObj.items.find(
                                            (i) => !('type' in i)
                                          );

                                          if (firstPage) {
                                            targetPage = (firstPage as { id: string }).id as any;
                                          }
                                        }
                                      }
                                    }

                                    if (typeof (window as any).__syncReactState === 'function') {
                                      (window as any).__syncReactState(targetPage, numId);
                                    }
                                  }
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-[13px] font-medium rounded-lg transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                <span className="truncate pr-2">{p.title}</span>

                                {isSelected && (
                                  <Check size={14} className="text-blue-600 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-[-8px] -space-x-2 overflow-x-auto no-scrollbar pb-0 items-end px-4">
              {showTabs &&
                currentModuleObj?.items
                .filter((item) => {
                  if ('type' in item) return false;
                  return hasPermission((item as { id: string }).id, 'view');
                })
                .map((item) => {
                  if ('type' in item && item.type === 'header') {
                    return null;
                  }

                  const typedItem = item as {
                    id: string;
                    label: string;
                    icon?: React.ReactNode;
                  };

                  const isActive = activePage === typedItem.id;

                  return (
                    <button
                      key={typedItem.id}
                      onClick={() => setActivePage(typedItem.id as AppPage)}
                      className={`relative group px-10 pt-3 font-semibold text-[14px] transition-all duration-300 ease-out whitespace-nowrap focus:outline-none flex items-center justify-center ${
                        isActive
                          ? 'z-30 pb-4 -mt-1'
                          : 'z-10 pb-3 hover:z-20 hover:-mt-0.5 hover:pb-[14px]'
                      }`}
                    >
                      <div
                        className={`absolute inset-0 transition-all duration-300 border-t-2 border-l border-r ${
                          isActive
                            ? 'bg-white dark:bg-[#1E293B] border-t-blue-500 border-l-blue-200 border-r-blue-200 dark:border-t-blue-400 dark:border-l-blue-800 dark:border-r-blue-800 shadow-[0_-6px_16px_rgba(59,130,246,0.12)]'
                            : 'bg-[#F1F5F9] dark:bg-[#1E293B]/60 border-transparent hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B]/80'
                        }`}
                        style={{
                          transform: 'perspective(16px) rotateX(2deg)',
                          transformOrigin: 'bottom',
                          borderRadius: '10px 10px 0 0',
                          borderBottomWidth: isActive ? 0 : 1,
                          zIndex: -1,
                        }}
                      />

                      <div
                        className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}
                      >
                        {typedItem.icon && (
                          <span className="flex-shrink-0">
                            {React.isValidElement(typedItem.icon)
                              ? React.cloneElement(
                                  typedItem.icon as React.ReactElement,
                                  { strokeWidth: 2.5 } as any
                                )
                              : typedItem.icon}
                          </span>
                        )}

                        <span>{typedItem.label}</span>
                      </div>

                      {isActive && (
                        <div className="absolute -bottom-[1px] left-[2px] right-[2px] h-[3px] bg-white dark:bg-[#1E293B] z-10" />
                      )}
                    </button>
                  );
                })}
            </div>

            {canShowReportButtons && (
              <div
                className="global-report-actions ml-auto mb-2 flex items-center gap-2"
                data-report-exclude="true"
              >
                <button
                  type="button"
                  onClick={handleGenerateCurrentView}
                  disabled={isGeneratingReport}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <FileText size={14} />
                  Generate Current View
                </button>

                <button
                  type="button"
                  onClick={handleGenerateFullReport}
                  disabled={isGeneratingReport}
                  className="h-9 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Files size={14} />
                  Generate Full Report
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 w-full relative z-0 bg-white dark:bg-[#1E293B] rounded-lg shadow-sm border border-[#Dce2e8] dark:border-slate-700/50 overflow-hidden">
            {isSelectingProject && (
              <div className="absolute inset-0 bg-white/60 dark:bg-[#0A0F1A]/70 backdrop-blur-sm z-40 flex items-center justify-center p-6">
                <div className="bg-white dark:bg-[#1E293B] p-8 rounded-3xl shadow-2xl border border-blue-100 dark:border-slate-700/50 max-w-md text-center transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                  <div className="bg-blue-50 dark:bg-blue-900/20 w-fit p-5 rounded-3xl mb-6 mx-auto shadow-inner">
                    {requiresProject ? (
                      <Folder size={48} className="text-blue-500" strokeWidth={1.5} />
                    ) : (
                      <Building2 size={48} className="text-blue-500" strokeWidth={1.5} />
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                    {requiresProject
                      ? 'Please select an active project first.'
                      : 'Select a Project'}
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto text-sm">
                    {requiresProject
                      ? 'This module requires an active project. Select a project from the top selector to continue.'
                      : 'Choose a project from the selector above to view its details.'}
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={
                  isReactPage(activePage)
                    ? `${activePage}-${selectedProjectId || 'no-proj'}`
                    : `vanilla-${selectedProjectId || 'no-proj'}`
                }
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full h-full relative"
              >
                {isReactPage(activePage) ? (
                  <div
                    id="reactContainer"
                    data-active-module={activeModule}
                    className={`flex flex-col w-full h-full absolute inset-0 ${
                      activePage === 'dashboard'
                        ? 'p-0 overflow-hidden'
                        : 'p-6 overflow-y-auto'
                    } ${isSelectingProject ? 'opacity-30 pointer-events-none' : ''}`}
                  >
                    {children}
                  </div>
                ) : (
                  <div
                    id="contentArea"
                    data-active-module={activeModule}
                    className={`content-area w-full h-full absolute inset-0 ${
                      isSelectingProject ? 'opacity-30 pointer-events-none' : ''
                    }`}
                    style={{
                      padding: '24px',
                      overflowY: 'auto',
                    }}
                  >
                    <LegacyVanillaWrapper
                      activePage={activePage}
                      selectedProjectId={selectedProjectId}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}