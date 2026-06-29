import React from 'react';
import { AppPage, ModuleType } from './pages';

export interface NavItem {
  id: AppPage;
  label: string;
  icon?: React.ReactNode;
}

export interface ModuleNavSection {
  module: ModuleType;
  label: string;
  items: (NavItem | { type: 'header'; label: string })[];
}
