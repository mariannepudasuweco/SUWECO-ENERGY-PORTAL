import React from 'react';

interface PageContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageContainer({ title, description, children, actions }: PageContainerProps) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight dark:text-white">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
