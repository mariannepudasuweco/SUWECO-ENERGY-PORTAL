import React from 'react';

interface ProjectShellProps {
  children: React.ReactNode;
}

export function ProjectShell({ children }: ProjectShellProps) {
  return (
    <div className="project-shell relative w-full h-full">
      {children}
    </div>
  );
}
