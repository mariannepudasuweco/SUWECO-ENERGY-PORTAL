import React from 'react';
import { Calculator, ShoppingCart, Users, Briefcase, Wrench, CalendarDays, History, Image, LayoutDashboard, UserPlus, CheckSquare, FileText, PiggyBank, Eye, ClipboardList, MapPin, Truck, Box, Fuel, Clock, Mic, BellRing } from 'lucide-react';
import { ModuleType } from '../types/pages';

export const monitoringModules = [
  {
    id: 'budget' as ModuleType,
    label: 'Budget',
    icon: <Calculator size={20} />,
    items: [
      { id: 'boq-charging', label: 'BOQ Charging', icon: <PiggyBank size={16}/> },
      { id: 'expense-overview', label: 'Expense Overview', icon: <FileText size={16}/> },
      { id: 'look-ahead', label: 'Look Ahead', icon: <Eye size={16}/> },
      { id: 'bill-of-quantities', label: 'BOQ', icon: <ClipboardList size={16}/> },
    ]
  },
  {
    id: 'procurement' as ModuleType,
    label: 'Procurement',
    icon: <ShoppingCart size={20} />,
    items: [
      { id: 'procurement-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16}/> },
      { id: 'request', label: 'Request', icon: <ClipboardList size={16}/> },
      { id: 'manila', label: 'Manila', icon: <Truck size={16}/> },
      { id: 'local', label: 'Local', icon: <MapPin size={16}/> },
      { type: 'header', label: 'Inventory' },
      { id: 'materials', label: 'Materials', icon: <Box size={16}/> },
      { id: 'fuel', label: 'Fuel', icon: <Fuel size={16}/> },
    ]
  },
  {
    id: 'payroll' as ModuleType,
    label: 'Payroll',
    icon: <Users size={20} />,
    items: [
      { id: 'payroll-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16}/> },
      { id: 'employee', label: 'Employee', icon: <Users size={16}/> },
      { id: 'attendance', label: 'Attendance', icon: <Clock size={16}/> },
    ]
  },
  {
    id: 'project' as ModuleType,
    label: 'Task',
    icon: <Briefcase size={20} />,
    items: [
      { id: 'project-schedule', label: 'Project Schedule', icon: <CalendarDays size={16}/> },
      { id: 'activity-history', label: 'Activity History', icon: <History size={16}/> },
      { type: 'header', label: 'Task' },
      { id: 'task-dashboard', label: 'Coordination', icon: <LayoutDashboard size={16}/> },
      { id: 'task-delegation', label: 'Delegation', icon: <UserPlus size={16}/> },
      { id: 'wbs-checklist', label: 'WBS Checklist', icon: <CheckSquare size={16}/> },
    ]
  },
  {
    id: 'tools' as ModuleType,
    label: 'Tools',
    icon: <Wrench size={20} />,
    items: [
      { id: 'ai-meeting-recorder', label: 'AI Meeting Recorder', icon: <Mic size={16}/> }
    ]
  },
  {
    id: 'reports' as ModuleType,
    label: 'Reports',
    icon: <FileText size={20} />,
    items: [
      { id: 'reports-notifications', label: 'Reports', icon: <BellRing size={16}/> }
    ]
  }
];
