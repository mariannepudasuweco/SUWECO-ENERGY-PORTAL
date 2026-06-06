import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import type { AppPage, ModuleType } from '../types/pages';

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  status: string;
  created_at?: string | null;
};

export type RolePermission = {
  id?: number;
  role: string;
  page: string;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

type Action = 'view' | 'add' | 'edit' | 'delete';

type AccessContextValue = {
  user: User | null;
  profile: UserProfile | null;
  permissions: RolePermission[];
  loadingAccess: boolean;
  accessError: string | null;
  refreshAccess: () => Promise<void>;
  hasPermission: (pageOrKey: AppPage | string, action?: Action) => boolean;
  canEditRow: (pageOrKey: AppPage | string, row: { created_by?: string | null }) => boolean;
  canDeleteRow: (pageOrKey: AppPage | string, row: { created_by?: string | null }) => boolean;
  getPermissionKey: (pageOrKey: AppPage | string) => string;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export const pagePermissionMap: Record<string, string> = {
  dashboard: 'main_dashboard',
  projects: 'projects',
  tasks: 'delegation_tasks',
  calendar: 'project_schedule_tasks',

  'ai-meeting-recorder': 'tools',
  'reports-notifications': 'generated_reports',

  'boq-charging': 'budget_boq_charging',
  'expense-overview': 'budget_boq_charging',
  'look-ahead': 'project_schedule_tasks',
  'bill-of-quantities': 'budget_boq_charging',

  'procurement-dashboard': 'procurement_requests',
  request: 'procurement_requests',
  manila: 'manila_procurement',
  local: 'local_procurement',
  materials: 'materials_masterlist',
  fuel: 'fuel_records',

  'payroll-dashboard': 'payroll_runs',
  employee: 'payroll_employees',
  attendance: 'payroll_attendance',

  'project-schedule': 'project_schedule_tasks',
  'activity-history': 'project_schedule_tasks',
  'activity-week-detail': 'project_schedule_tasks',
  'task-dashboard': 'delegation_tasks',
  'kanban-board': 'delegation_tasks',
  deadlines: 'delegation_tasks',
  'task-delegation': 'delegation_tasks',
  'wbs-checklist': 'wbs_checklist_items',
  'wbs-sequence': 'wbs_checklist_items',
};

export const modulePermissionKeys: Record<Exclude<ModuleType, null>, string[]> = {
  budget: ['budget_boq_charging', 'project_schedule_tasks'],
  procurement: [
    'procurement_requests',
    'manila_procurement',
    'local_procurement',
    'materials_masterlist',
    'materials_transactions',
    'fuel_records',
  ],
  payroll: ['payroll_runs', 'payroll_employees', 'payroll_attendance'],
  project: ['project_schedule_tasks', 'delegation_tasks', 'wbs_checklist_items'],
  tools: ['tools'],
  reports: ['generated_reports'],
};

const getPermissionKey = (pageOrKey: AppPage | string) => pagePermissionMap[pageOrKey] || pageOrKey;

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const refreshAccess = async () => {
    setLoadingAccess(true);
    setAccessError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    console.log('AUTH USER:', userData?.user);
    console.log('AUTH USER ERROR:', userError);

    if (userError || !userData?.user) {
      setUser(null);
      setProfile(null);
      setPermissions([]);
      setAccessError(userError?.message || 'No logged-in user found.');
      setLoadingAccess(false);
      return;
    }

    setUser(userData.user);

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    console.log('USER PROFILE:', profileData);
    console.log('PROFILE ERROR:', profileError);

    if (profileError || !profileData) {
      setProfile(null);
      setPermissions([]);
      setAccessError(profileError?.message || 'No user profile found for this user.');
      setLoadingAccess(false);
      return;
    }

    setProfile(profileData as UserProfile);

    if ((profileData as UserProfile).status !== 'Active') {
      setPermissions([]);
      setAccessError('Your account is not active yet. Please contact the administrator.');
      setLoadingAccess(false);
      return;
    }

    const { data: permissionData, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', (profileData as UserProfile).role);

    console.log('ROLE PERMISSIONS:', permissionData);
    console.log('PERMISSIONS ERROR:', permissionsError);

    if (permissionsError) {
      setPermissions([]);
      setAccessError(permissionsError.message);
    } else {
      setPermissions((permissionData || []) as RolePermission[]);
    }

    setLoadingAccess(false);
  };

  useEffect(() => {
    refreshAccess();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshAccess();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AccessContextValue>(() => {
    const hasPermission = (pageOrKey: AppPage | string, action: Action = 'view') => {
      if (profile?.role === 'Project Manager') return true;

      const permissionKey = getPermissionKey(pageOrKey);
      const permission = permissions.find((p) => p.page === permissionKey);

      if (!permission) return false;
      if (action === 'view') return permission.can_view;
      if (action === 'add') return permission.can_add;
      if (action === 'edit') return permission.can_edit;
      if (action === 'delete') return permission.can_delete;
      return false;
    };

    const canEditRow = (pageOrKey: AppPage | string, row: { created_by?: string | null }) => {
      if (profile?.role === 'Project Manager') return true;
      return hasPermission(pageOrKey, 'edit') && !!user?.id && row.created_by === user.id;
    };

    const canDeleteRow = (pageOrKey: AppPage | string, row: { created_by?: string | null }) => {
      if (profile?.role === 'Project Manager') return true;
      return hasPermission(pageOrKey, 'delete') && !!user?.id && row.created_by === user.id;
    };

    return {
      user,
      profile,
      permissions,
      loadingAccess,
      accessError,
      refreshAccess,
      hasPermission,
      canEditRow,
      canDeleteRow,
      getPermissionKey,
    };
  }, [user, profile, permissions, loadingAccess, accessError]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess must be used inside AccessProvider');
  }
  return context;
}
