import React, { useEffect } from 'react';

/**
 * HYBRID WRAPPER (DEPRECATED PATTERN)
 * 
 * This page acts as an empty container that delegating rendering to Vanilla JS.
 * It exists purely so `pageRegistry.tsx` has a valid React component to mount.
 * 
 * MIGRATION STATUS: 🔴 pending
 * FUTURE GOAL: Migrate this file to be a "React Native" implementation, replacing
 * the `window.renderProjectScheduleView` call with full React code.
 */
export default function ProjectSchedulePage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const func = (window as any).renderProjectScheduleView;
      if (typeof func === 'function') {
        setTimeout(() => func(), 0);
      }
    }
  }, []);

  return <></>;
}
