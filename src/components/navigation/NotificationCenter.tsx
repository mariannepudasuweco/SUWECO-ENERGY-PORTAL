import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  Check,
  CircleAlert,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { AppPage, ModuleType, Project } from '../../types/pages';

export type PriorityLevel =
  | 'Critical'
  | 'High Priority'
  | 'Due Soon'
  | 'Delayed'
  | 'Overdue'
  | 'Warning'
  | 'Informational';

export interface NotificationItem {
  id: string;
  projectId: string;
  projectName: string;
  priority: PriorityLevel;
  module: ModuleType;
  targetPage: AppPage;
  summary: string;
  timestamp: Date;
  read: boolean;
  resolved?: boolean;
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  Critical: 1,
  Overdue: 2,
  Delayed: 3,
  'High Priority': 4,
  Warning: 5,
  'Due Soon': 6,
  Informational: 7,
};

const PRIORITY_COLORS: Record<
  PriorityLevel,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  Critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    icon: <CircleAlert size={16} />,
  },
  Overdue: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    icon: <Clock size={16} />,
  },
  Delayed: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    icon: <AlertTriangle size={16} />,
  },
  'High Priority': {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-400',
    icon: <CircleAlert size={16} />,
  },
  Warning: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: <AlertTriangle size={16} />,
  },
  'Due Soon': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    icon: <Clock size={16} />,
  },
  Informational: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-400',
    icon: <Info size={16} />,
  },
};

interface NotificationCenterProps {
  onNavigateToNotification: (
    moduleId: ModuleType,
    pageId: AppPage,
    projectId: string
  ) => void;
}

const getProjectId = (record: any): string => {
  return String(
    record?.projectId ||
      record?.project_id ||
      record?.selectedProjectId ||
      record?.project_id_fk ||
      ''
  );
};

const getProjectName = (project: any): string => {
  return String(project?.title || project?.name || 'Unnamed Project');
};

const getRecordStatus = (record: any): string => {
  return String(
    record?.procurementStatus ||
      record?.procurement_status ||
      record?.status ||
      record?.taskStatus ||
      record?.task_status ||
      ''
  )
    .trim()
    .toLowerCase();
};

const getPaymentStatus = (record: any): string => {
  return String(record?.paymentStatus || record?.payment_status || '')
    .trim()
    .toLowerCase();
};

const isProcurementPending = (record: any): boolean => {
  const status = getRecordStatus(record);

  if (!status) return true;

  return (
    status !== 'delivered' &&
    status !== 'completed' &&
    status !== 'done' &&
    status !== 'closed'
  );
};

const isPaymentUnpaid = (record: any): boolean => {
  const status = getPaymentStatus(record);

  if (!status) return false;

  return status !== 'paid';
};

const getRecordDate = (record: any): Date => {
  return new Date(
    record?.updatedAt ||
      record?.updated_at ||
      record?.createdAt ||
      record?.created_at ||
      record?.date ||
      record?.dueDate ||
      record?.due_date ||
      Date.now()
  );
};

const getMaterialStock = (material: any): number => {
  return Number(
    material?.currentStock ||
      material?.current_stock ||
      material?.stock ||
      0
  );
};

const getMaterialMinStock = (material: any): number => {
  return Number(
    material?.minStock ||
      material?.min_stock ||
      material?.minimumStock ||
      0
  );
};

const getFuelQtyIn = (record: any): number => {
  return Number(record?.qtyIn || record?.qty_in || 0);
};

const getFuelQtyOut = (record: any): number => {
  return Number(record?.qtyOut || record?.qty_out || 0);
};

const getTaskDueDate = (record: any): Date | null => {
  const value =
    record?.dueDate ||
    record?.due_date ||
    record?.deadline ||
    record?.targetDate ||
    record?.target_date ||
    record?.date ||
    record?.due;

  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

const isTaskCompleted = (record: any): boolean => {
  const status = getRecordStatus(record).toLowerCase();

  return (
    status === 'completed' ||
    status === 'complete' ||
    status === 'done' ||
    status === 'closed'
  );
};

const getBoqRemaining = (record: any): number | null => {
  const possibleRemaining =
    record?.remainingBudget ??
    record?.remaining_budget ??
    record?.remaining ??
    record?.balance ??
    null;

  if (possibleRemaining !== null && possibleRemaining !== undefined) {
    const value = Number(possibleRemaining);

    return Number.isFinite(value) ? value : null;
  }

  const allotted = Number(
    record?.allottedBudget ||
      record?.allotted_budget ||
      record?.budget ||
      record?.amount ||
      0
  );

  const total = Number(
    record?.total ||
      record?.grandTotal ||
      record?.grand_total ||
      record?.actualAmount ||
      record?.actual_amount ||
      record?.usedAmount ||
      record?.used_amount ||
      0
  );

  if (!allotted && !total) return null;

  return allotted - total;
};

const preloadNotificationData = async () => {
  const win = window as any;

  const loaders = [
    win.loadProjectsFromSupabase,
    win.loadManilaProcurementFromSupabase,
    win.loadLocalProcurementFromSupabase,
    win.loadMaterialsFromSupabase,
    win.loadMaterialsMasterlistFromSupabase,
    win.loadFuelRecordsFromSupabase,
    win.loadPayrollRunsFromSupabase,
    win.loadProjectSchedulesFromSupabase,
    win.loadBoqChargingFromSupabase,
    win.loadDeadlinesFromSupabase,
    win.loadTaskDelegationFromSupabase,
    win.loadTasksFromSupabase,
  ].filter((loader) => typeof loader === 'function');

  await Promise.allSettled(
    loaders.map((loader) => {
      try {
        return loader();
      } catch (error) {
        console.warn('Notification loader failed:', error);
        return Promise.resolve();
      }
    })
  );

  const supabase = win.supabase;

  if (!supabase) return;

  try {
    const [
      manilaResult,
      localResult,
      materialsResult,
      fuelResult,
      payrollResult,
      boqResult,
      deadlinesResult,
      taskDelegationResult,
      tasksResult,
    ] = await Promise.allSettled([
      supabase.from('manila_procurement').select('*'),
      supabase.from('local_procurement').select('*'),
      supabase.from('materials_masterlist').select('*'),
      supabase.from('fuel_records').select('*'),
      supabase.from('payroll_runs').select('*'),
      supabase.from('budget_boq_charging').select('*'),
      supabase.from('deadlines').select('*'),
      supabase.from('task_delegation').select('*'),
      supabase.from('tasks').select('*'),
    ]);

    if (
      manilaResult.status === 'fulfilled' &&
      !manilaResult.value?.error &&
      Array.isArray(manilaResult.value?.data)
    ) {
      win.manilaRecords = manilaResult.value.data;
    }

    if (
      localResult.status === 'fulfilled' &&
      !localResult.value?.error &&
      Array.isArray(localResult.value?.data)
    ) {
      win.localRecords = localResult.value.data;
    }

    if (
      materialsResult.status === 'fulfilled' &&
      !materialsResult.value?.error &&
      Array.isArray(materialsResult.value?.data)
    ) {
      win.materialsMasterlist = materialsResult.value.data;
    }

    if (
      fuelResult.status === 'fulfilled' &&
      !fuelResult.value?.error &&
      Array.isArray(fuelResult.value?.data)
    ) {
      win.fuelRecords = fuelResult.value.data;
    }

    if (
      payrollResult.status === 'fulfilled' &&
      !payrollResult.value?.error &&
      Array.isArray(payrollResult.value?.data)
    ) {
      win.payrollRuns = payrollResult.value.data;
    }

    if (
      boqResult.status === 'fulfilled' &&
      !boqResult.value?.error &&
      Array.isArray(boqResult.value?.data)
    ) {
      win.boqChargingRecords = boqResult.value.data;
    }

    if (
      deadlinesResult.status === 'fulfilled' &&
      !deadlinesResult.value?.error &&
      Array.isArray(deadlinesResult.value?.data)
    ) {
      win.deadlineRecords = deadlinesResult.value.data;
    }

    if (
      taskDelegationResult.status === 'fulfilled' &&
      !taskDelegationResult.value?.error &&
      Array.isArray(taskDelegationResult.value?.data)
    ) {
      win.taskDelegationRecords = taskDelegationResult.value.data;
    }

    if (
      tasksResult.status === 'fulfilled' &&
      !tasksResult.value?.error &&
      Array.isArray(tasksResult.value?.data)
    ) {
      win.taskRecords = tasksResult.value.data;
    }
  } catch (error) {
    console.warn('Notification Supabase preload failed:', error);
  }
};

export function NotificationCenter({
  onNavigateToNotification,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'All' | 'Critical' | 'Delays' | 'Due Soon' | 'Completed'
  >('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let isGenerating = false;

    const generateNotifications = async () => {
      if (isGenerating) return;

      isGenerating = true;

      await preloadNotificationData();

      if (!isMounted) {
        isGenerating = false;
        return;
      }

      const projects: Project[] = (window as any).projects || [];
      const manilaRecords: any[] = (window as any).manilaRecords || [];
      const localRecords: any[] = (window as any).localRecords || [];
      const materialsMasterlist: any[] =
        (window as any).materialsMasterlist || [];
      const fuelRecords: any[] = (window as any).fuelRecords || [];
      const payrollRuns: any[] = (window as any).payrollRuns || [];
      const projectSchedules: any = (window as any).projectSchedules || {};
      const mockTasks: any[] = (window as any).mockTasks || [];
      const wbsTasks: any[] = (window as any).wbsTasks || [];
      const taskRecords: any[] = (window as any).taskRecords || [];
      const deadlineRecords: any[] =
        (window as any).deadlineRecords || (window as any).deadlines || [];
      const taskDelegationRecords: any[] =
        (window as any).taskDelegationRecords ||
        (window as any).taskDelegations ||
        (window as any).delegatedTasks ||
        [];

      const boqRecords: any[] =
        (window as any).boqChargingRecords ||
        (window as any).boqCharging ||
        [];

      const generated: NotificationItem[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      projects.forEach((project: any) => {
        const projectId = String(project?.id || '');
        const projectName = getProjectName(project);

        if (!projectId) return;

        if (project.status === 'Completed' || project.status === 'Cancelled') {
          return;
        }

        const sched = projectSchedules[projectId];

        if (sched) {
          Object.entries(sched).forEach(([code, data]: [string, any]) => {
            if (!data || String(code).startsWith('_')) return;

            if (data.status === 'Overdue') {
              generated.push({
                id: `notif-schedule-overdue-${projectId}-${code}`,
                projectId,
                projectName,
                priority: 'Overdue',
                module: 'project' as ModuleType,
                targetPage: 'project-schedule' as AppPage,
                summary: `Task ${code} is overdue. Target end was ${
                  data.targetEnd || 'not set'
                }.`,
                timestamp: new Date(data.targetEnd || Date.now()),
                read: false,
              });
            }
          });
        }

        const projectManilaRecords = manilaRecords.filter(
          (record) => getProjectId(record) === projectId
        );

        const pendingManilaRecords = projectManilaRecords.filter((record) =>
          isProcurementPending(record)
        );

        const unpaidManilaRecords = projectManilaRecords.filter((record) =>
          isPaymentUnpaid(record)
        );

        if (pendingManilaRecords.length > 0) {
          generated.push({
            id: `notif-manila-pending-${projectId}`,
            projectId,
            projectName,
            priority: 'High Priority',
            module: 'procurement' as ModuleType,
            targetPage: 'manila' as AppPage,
            summary: `${pendingManilaRecords.length} Manila procurement record${
              pendingManilaRecords.length > 1 ? 's are' : ' is'
            } still pending.`,
            timestamp: getRecordDate(pendingManilaRecords[0]),
            read: false,
          });
        }

        if (unpaidManilaRecords.length > 0) {
          generated.push({
            id: `notif-manila-unpaid-${projectId}`,
            projectId,
            projectName,
            priority: 'Warning',
            module: 'procurement' as ModuleType,
            targetPage: 'manila' as AppPage,
            summary: `${unpaidManilaRecords.length} Manila procurement payment${
              unpaidManilaRecords.length > 1 ? 's are' : ' is'
            } still unpaid.`,
            timestamp: getRecordDate(unpaidManilaRecords[0]),
            read: false,
          });
        }

        const projectLocalRecords = localRecords.filter(
          (record) => getProjectId(record) === projectId
        );

        const pendingLocalRecords = projectLocalRecords.filter((record) =>
          isProcurementPending(record)
        );

        const unpaidLocalRecords = projectLocalRecords.filter((record) =>
          isPaymentUnpaid(record)
        );

        if (pendingLocalRecords.length > 0) {
          generated.push({
            id: `notif-local-pending-${projectId}`,
            projectId,
            projectName,
            priority: 'High Priority',
            module: 'procurement' as ModuleType,
            targetPage: 'local' as AppPage,
            summary: `${pendingLocalRecords.length} Local procurement record${
              pendingLocalRecords.length > 1 ? 's are' : ' is'
            } still pending.`,
            timestamp: getRecordDate(pendingLocalRecords[0]),
            read: false,
          });
        }

        if (unpaidLocalRecords.length > 0) {
          generated.push({
            id: `notif-local-unpaid-${projectId}`,
            projectId,
            projectName,
            priority: 'Warning',
            module: 'procurement' as ModuleType,
            targetPage: 'local' as AppPage,
            summary: `${unpaidLocalRecords.length} Local procurement payment${
              unpaidLocalRecords.length > 1 ? 's are' : ' is'
            } still unpaid.`,
            timestamp: getRecordDate(unpaidLocalRecords[0]),
            read: false,
          });
        }

        const projectMaterials = materialsMasterlist.filter((material) => {
          const materialProjectId = getProjectId(material);

          if (!materialProjectId) return false;

          return materialProjectId === projectId;
        });

        const lowStockMaterials = projectMaterials.filter((material) => {
          const stock = getMaterialStock(material);
          const minStock = getMaterialMinStock(material);

          return stock <= 0 || stock <= minStock;
        });

        if (lowStockMaterials.length > 0) {
          generated.push({
            id: `notif-material-low-${projectId}`,
            projectId,
            projectName,
            priority: 'Warning',
            module: 'procurement' as ModuleType,
            targetPage: 'materials' as AppPage,
            summary: `${lowStockMaterials.length} material${
              lowStockMaterials.length > 1 ? 's are' : ' is'
            } low or out of stock.`,
            timestamp: new Date(),
            read: false,
          });
        }

        const projectFuelRecords = fuelRecords.filter(
          (record) => getProjectId(record) === projectId
        );

        if (projectFuelRecords.length > 0) {
          const totalFuelIn = projectFuelRecords.reduce(
            (sum, record) => sum + getFuelQtyIn(record),
            0
          );

          const totalFuelOut = projectFuelRecords.reduce(
            (sum, record) => sum + getFuelQtyOut(record),
            0
          );

          const remainingFuel = totalFuelIn - totalFuelOut;

          if (remainingFuel <= 0) {
            generated.push({
              id: `notif-fuel-out-${projectId}`,
              projectId,
              projectName,
              priority: 'Critical',
              module: 'procurement' as ModuleType,
              targetPage: 'fuel' as AppPage,
              summary: `Fuel inventory is out or negative. Remaining fuel: ${remainingFuel.toLocaleString()} L.`,
              timestamp: new Date(),
              read: false,
            });
          } else if (remainingFuel <= 100) {
            generated.push({
              id: `notif-fuel-low-${projectId}`,
              projectId,
              projectName,
              priority: 'Warning',
              module: 'procurement' as ModuleType,
              targetPage: 'fuel' as AppPage,
              summary: `Fuel inventory is low. Remaining fuel: ${remainingFuel.toLocaleString()} L.`,
              timestamp: new Date(),
              read: false,
            });
          }
        }

        const projectPayrollRuns = payrollRuns.filter((record) => {
          const payrollProjectId = getProjectId(record);

          return payrollProjectId === projectId;
        });

        const notGeneratedPayrollRuns = projectPayrollRuns.filter((record) => {
          const status = String(record?.status || '').toUpperCase();

          return status === 'NOT GENERATED';
        });

        if (notGeneratedPayrollRuns.length > 0) {
          generated.push({
            id: `notif-payroll-not-generated-${projectId}`,
            projectId,
            projectName,
            priority: 'Warning',
            module: 'payroll' as ModuleType,
            targetPage: 'payroll-dashboard' as AppPage,
            summary: `${notGeneratedPayrollRuns.length} payroll run${
              notGeneratedPayrollRuns.length > 1 ? 's are' : ' is'
            } not yet generated.`,
            timestamp: getRecordDate(notGeneratedPayrollRuns[0]),
            read: false,
          });
        }

        const projectBoqRecords = boqRecords.filter(
          (record) => getProjectId(record) === projectId
        );

        const overBudgetBoqRecords = projectBoqRecords.filter((record) => {
          const remaining = getBoqRemaining(record);

          return remaining !== null && remaining < 0;
        });

        if (overBudgetBoqRecords.length > 0) {
          generated.push({
            id: `notif-boq-overbudget-${projectId}`,
            projectId,
            projectName,
            priority: 'Critical',
            module: 'budget' as ModuleType,
            targetPage: 'boq-charging' as AppPage,
            summary: `${overBudgetBoqRecords.length} BOQ charging item${
              overBudgetBoqRecords.length > 1 ? 's are' : ' is'
            } over budget.`,
            timestamp: new Date(),
            read: false,
          });
        }

        const projectDeadlineRecords = deadlineRecords.filter(
          (record) => getProjectId(record) === projectId
        );

        const overdueDeadlines = projectDeadlineRecords.filter((record) => {
          if (isTaskCompleted(record)) return false;

          const dueDate = getTaskDueDate(record);

          return !!dueDate && dueDate < today;
        });

        const dueSoonDeadlines = projectDeadlineRecords.filter((record) => {
          if (isTaskCompleted(record)) return false;

          const dueDate = getTaskDueDate(record);

          if (!dueDate || dueDate < today) return false;

          return dueDate.getTime() - today.getTime() < 1000 * 60 * 60 * 24 * 7;
        });

        if (overdueDeadlines.length > 0) {
          generated.push({
            id: `notif-deadlines-overdue-${projectId}`,
            projectId,
            projectName,
            priority: 'Overdue',
            module: 'project' as ModuleType,
            targetPage: 'deadlines' as AppPage,
            summary: `${overdueDeadlines.length} deadline${
              overdueDeadlines.length > 1 ? 's are' : ' is'
            } overdue.`,
            timestamp: getRecordDate(overdueDeadlines[0]),
            read: false,
          });
        }

        if (dueSoonDeadlines.length > 0) {
          generated.push({
            id: `notif-deadlines-due-soon-${projectId}`,
            projectId,
            projectName,
            priority: 'Due Soon',
            module: 'project' as ModuleType,
            targetPage: 'deadlines' as AppPage,
            summary: `${dueSoonDeadlines.length} deadline${
              dueSoonDeadlines.length > 1 ? 's are' : ' is'
            } due soon.`,
            timestamp: getRecordDate(dueSoonDeadlines[0]),
            read: false,
          });
        }

        const projectTaskDelegations = taskDelegationRecords.filter(
          (record) => getProjectId(record) === projectId
        );

        const overdueDelegatedTasks = projectTaskDelegations.filter((record) => {
          if (isTaskCompleted(record)) return false;

          const dueDate = getTaskDueDate(record);

          return !!dueDate && dueDate < today;
        });

        const pendingDelegatedTasks = projectTaskDelegations.filter((record) => {
          if (isTaskCompleted(record)) return false;

          const dueDate = getTaskDueDate(record);

          return !dueDate || dueDate >= today;
        });

        if (overdueDelegatedTasks.length > 0) {
          generated.push({
            id: `notif-task-delegation-overdue-${projectId}`,
            projectId,
            projectName,
            priority: 'Overdue',
            module: 'project' as ModuleType,
            targetPage: 'task-delegation' as AppPage,
            summary: `${overdueDelegatedTasks.length} delegated task${
              overdueDelegatedTasks.length > 1 ? 's are' : ' is'
            } overdue.`,
            timestamp: getRecordDate(overdueDelegatedTasks[0]),
            read: false,
          });
        } else if (pendingDelegatedTasks.length > 0) {
          generated.push({
            id: `notif-task-delegation-pending-${projectId}`,
            projectId,
            projectName,
            priority: 'Informational',
            module: 'project' as ModuleType,
            targetPage: 'task-delegation' as AppPage,
            summary: `${pendingDelegatedTasks.length} delegated task${
              pendingDelegatedTasks.length > 1 ? 's are' : ' is'
            } still pending.`,
            timestamp: getRecordDate(pendingDelegatedTasks[0]),
            read: false,
          });
        }
      });

      const storedHist = localStorage.getItem('payroll_history');

      if (storedHist) {
        try {
          const history = JSON.parse(storedHist);

          const notGeneratedPayroll = history.filter((record: any) => {
            const status = String(record?.status || '').toUpperCase();

            return status === 'NOT GENERATED';
          });

          const payrollByProject = notGeneratedPayroll.reduce(
            (groups: Record<string, any[]>, record: any) => {
              const key = String(
                record?.projectId ||
                  record?.project_id ||
                  record?.selectedProjectId ||
                  record?.project_id_fk ||
                  'global'
              );

              if (!groups[key]) groups[key] = [];
              groups[key].push(record);

              return groups;
            },
            {}
          );

          Object.entries(payrollByProject).forEach(([projectId, rows]) => {
            const payrollRows = rows as any[];

            if (payrollRows.length === 0) return;

            const alreadyExists = generated.some(
              (item) => item.id === `notif-payroll-not-generated-${projectId}`
            );

            if (alreadyExists) return;

            const matchingProject = projects.find(
              (project: any) => String(project?.id) === String(projectId)
            );

            const isGlobal = projectId === 'global' || projectId === 'all';

            generated.push({
              id: `notif-payroll-not-generated-${projectId}`,
              projectId: isGlobal ? 'global' : projectId,
              projectName: isGlobal
                ? 'Global Notifications'
                : getProjectName(matchingProject),
              priority: 'Warning',
              module: 'payroll' as ModuleType,
              targetPage: 'payroll-dashboard' as AppPage,
              summary: `${payrollRows.length} payroll run${
                payrollRows.length > 1 ? 's are' : ' is'
              } not yet generated.`,
              timestamp: new Date(),
              read: false,
            });
          });
        } catch (error) {
          console.error('Failed to parse payroll history:', error);
        }
      }

      wbsTasks.forEach((task: any) => {
        if (task.status !== 'COMPLETED' && task.date) {
          const dueDate = new Date(task.date);

          if (dueDate < today) {
            generated.push({
              id: `notif-wbs-overdue-${task.wbs}`,
              projectId: 'global',
              projectName: 'Global Notifications',
              priority: 'Overdue',
              module: 'project' as ModuleType,
              targetPage: 'wbs-checklist' as AppPage,
              summary: `WBS ${task.wbs}: ${task.name} is overdue.`,
              timestamp: dueDate,
              read: false,
            });
          }
        }
      });

      mockTasks.forEach((task: any) => {
        if (task.status !== 'COMPLETED' && task.due) {
          const dueDate = new Date(task.due);

          if (dueDate < today) {
            generated.push({
              id: `notif-task-overdue-${task.wbs}`,
              projectId: 'global',
              projectName: 'Global Notifications',
              priority: 'Overdue',
              module: 'project' as ModuleType,
              targetPage: 'tasks' as AppPage,
              summary: `Task ${task.wbs}: ${task.name} is overdue. Due date was ${task.due}.`,
              timestamp: dueDate,
              read: false,
            });
          } else if (
            dueDate.getTime() - today.getTime() <
            1000 * 60 * 60 * 24 * 7
          ) {
            generated.push({
              id: `notif-task-soon-${task.wbs}`,
              projectId: 'global',
              projectName: 'Global Notifications',
              priority: 'Due Soon',
              module: 'project' as ModuleType,
              targetPage: 'tasks' as AppPage,
              summary: `Task ${task.wbs}: ${task.name} is due soon. Due date is ${task.due}.`,
              timestamp: dueDate,
              read: false,
            });
          }
        }
      });

      taskRecords.forEach((task: any) => {
        if (isTaskCompleted(task)) return;

        const taskProjectId = getProjectId(task) || 'global';
        const dueDate = getTaskDueDate(task);

        if (!dueDate) return;

        const matchingProject = projects.find(
          (project: any) => String(project?.id) === String(taskProjectId)
        );

        const projectName =
          taskProjectId === 'global'
            ? 'Global Notifications'
            : getProjectName(matchingProject);

        if (dueDate < today) {
          generated.push({
            id: `notif-task-record-overdue-${taskProjectId}-${task.id || task.wbs || task.name}`,
            projectId: taskProjectId,
            projectName,
            priority: 'Overdue',
            module: 'project' as ModuleType,
            targetPage: 'tasks' as AppPage,
            summary: `${task.name || task.title || 'Task'} is overdue.`,
            timestamp: dueDate,
            read: false,
          });
        } else if (
          dueDate.getTime() - today.getTime() <
          1000 * 60 * 60 * 24 * 7
        ) {
          generated.push({
            id: `notif-task-record-soon-${taskProjectId}-${task.id || task.wbs || task.name}`,
            projectId: taskProjectId,
            projectName,
            priority: 'Due Soon',
            module: 'project' as ModuleType,
            targetPage: 'tasks' as AppPage,
            summary: `${task.name || task.title || 'Task'} is due soon.`,
            timestamp: dueDate,
            read: false,
          });
        }
      });

      setNotifications((prev) => {
        const readStatusMap = new Map(prev.map((item) => [item.id, item.read]));

        return generated
          .map((item) => ({
            ...item,
            read: readStatusMap.has(item.id)
              ? Boolean(readStatusMap.get(item.id))
              : item.read,
          }))
          .sort((a, b) => {
            const priorityDiff =
              PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

            if (priorityDiff !== 0) return priorityDiff;

            return b.timestamp.getTime() - a.timestamp.getTime();
          });
      });

      isGenerating = false;
    };

    generateNotifications();

    window.addEventListener('projectsUpdated', generateNotifications);
    window.addEventListener('procurementUpdated', generateNotifications);
    window.addEventListener('materialsUpdated', generateNotifications);
    window.addEventListener('fuelUpdated', generateNotifications);
    window.addEventListener('payrollUpdated', generateNotifications);
    window.addEventListener('tasksUpdated', generateNotifications);
    window.addEventListener('scheduleUpdated', generateNotifications);
    window.addEventListener('budgetUpdated', generateNotifications);
    window.addEventListener('deadlinesUpdated', generateNotifications);

    const interval = setInterval(() => {
      generateNotifications();
    }, 10000);

    return () => {
      isMounted = false;

      window.removeEventListener('projectsUpdated', generateNotifications);
      window.removeEventListener('procurementUpdated', generateNotifications);
      window.removeEventListener('materialsUpdated', generateNotifications);
      window.removeEventListener('fuelUpdated', generateNotifications);
      window.removeEventListener('payrollUpdated', generateNotifications);
      window.removeEventListener('tasksUpdated', generateNotifications);
      window.removeEventListener('scheduleUpdated', generateNotifications);
      window.removeEventListener('budgetUpdated', generateNotifications);
      window.removeEventListener('deadlinesUpdated', generateNotifications);

      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (activeFilter === 'Critical') {
      filtered = filtered.filter(
        (item) =>
          item.priority === 'Critical' || item.priority === 'High Priority'
      );
    } else if (activeFilter === 'Delays') {
      filtered = filtered.filter(
        (item) => item.priority === 'Delayed' || item.priority === 'Overdue'
      );
    } else if (activeFilter === 'Due Soon') {
      filtered = filtered.filter((item) => item.priority === 'Due Soon');
    } else if (activeFilter === 'Completed') {
      filtered = filtered.filter((item) => item.read || item.resolved);
    }

    return [...filtered].sort((a, b) => {
      const priorityDiff =
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

      if (priorityDiff !== 0) return priorityDiff;

      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [activeFilter, notifications]);

  const groupedNotifications = useMemo(() => {
    const projectGroups: Record<
      string,
      {
        projectId: string;
        projectName: string;
        items: NotificationItem[];
      }
    > = {};

    filteredNotifications.forEach((notification) => {
      const key = String(notification.projectId || 'global');

      if (!projectGroups[key]) {
        projectGroups[key] = {
          projectId: key,
          projectName: notification.projectName || 'Global Notifications',
          items: [],
        };
      }

      projectGroups[key].items.push(notification);
    });

    return Object.values(projectGroups)
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => {
          const priorityDiff =
            PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

          if (priorityDiff !== 0) return priorityDiff;

          return b.timestamp.getTime() - a.timestamp.getTime();
        }),
      }))
      .sort((a, b) => {
        if (a.projectName === 'Global Notifications') return 1;
        if (b.projectName === 'Global Notifications') return -1;

        return a.projectName.localeCompare(b.projectName);
      });
  }, [filteredNotifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const projectCount = useMemo(() => {
    return new Set(
      notifications
        .filter(
          (item) => item.projectId !== 'global' && item.projectId !== 'all'
        )
        .map((item) => item.projectId)
    ).size;
  }, [notifications]);

  const handleMarkAsRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );

    setIsOpen(false);

    if (
      notification.projectId &&
      notification.projectId !== 'all' &&
      notification.projectId !== 'global'
    ) {
      onNavigateToNotification(
        notification.module,
        notification.targetPage,
        notification.projectId
      );

      return;
    }

    onNavigateToNotification(notification.module, notification.targetPage, '');
  };

  return (
    <div
      className="relative z-50 flex items-center justify-center flex-col w-full"
      ref={dropdownRef}
    >
      <button
        className="relative group transition-colors flex items-center justify-center p-2 rounded-lg hover:bg-white/10"
        title="Notifications"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell
          size={20}
          strokeWidth={2}
          className={`${
            isOpen ? 'text-white' : 'text-[#6B7280] group-hover:text-white'
          }`}
        />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-16 ml-4 w-[420px] max-h-[85vh] bg-white dark:bg-[#1E293B] shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden flex flex-col pointer-events-auto"
            style={{
              transformOrigin: 'left top',
            }}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  Command Center
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time alerts across {projectCount || 0} project
                  {projectCount === 1 ? '' : 's'}
                </p>
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  <Check size={14} /> Mark all Read
                </button>
              )}
            </div>

            <div className="flex px-4 py-3 gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 dark:border-slate-700/30">
              {(['All', 'Critical', 'Delays', 'Due Soon', 'Completed'] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-4 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>

                  <h4 className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    All caught up!
                  </h4>

                  <p className="text-[13px] text-slate-500 dark:text-slate-400">
                    No active issues matching your current filters.
                  </p>
                </div>
              ) : (
                groupedNotifications.map((projectGroup) => (
                  <div key={projectGroup.projectId} className="mb-3">
                    <div className="sticky top-0 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-sm z-10 px-5 py-2 border-y border-slate-100 dark:border-slate-700/30 shadow-sm first:border-t-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {projectGroup.projectName}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {projectGroup.items.length} alert
                          {projectGroup.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      {projectGroup.items.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`group relative p-4 flex gap-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors ${
                            !notification.read
                              ? 'bg-blue-50/50 dark:bg-blue-900/10'
                              : ''
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              PRIORITY_COLORS[notification.priority]?.bg || ''
                            } ${
                              PRIORITY_COLORS[notification.priority]?.text || ''
                            }`}
                          >
                            {PRIORITY_COLORS[notification.priority]?.icon}
                          </div>

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                {notification.priority}
                              </span>

                              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                •
                              </span>

                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {notification.module
                                  ? notification.module.charAt(0).toUpperCase() +
                                    notification.module.slice(1)
                                  : 'Unknown'}
                              </span>
                            </div>

                            <p
                              className={`text-[14px] leading-tight mb-1.5 ${
                                !notification.read
                                  ? 'font-semibold text-slate-800 dark:text-slate-100'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {notification.summary}
                            </p>

                            <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {formatDistanceToNow(notification.timestamp, {
                                addSuffix: true,
                              })}
                            </div>
                          </div>

                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <button
                                onClick={(event) =>
                                  handleMarkAsRead(notification.id, event)
                                }
                                title="Mark as read"
                                className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
                              >
                                <Check size={14} strokeWidth={2.5} />
                              </button>
                            )}

                            <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-slate-600">
                              <ChevronRight size={14} strokeWidth={2.5} />
                            </div>
                          </div>

                          {!notification.read && (
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:opacity-0 transition-opacity" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Operating seamlessly across the STEC Portal context.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}