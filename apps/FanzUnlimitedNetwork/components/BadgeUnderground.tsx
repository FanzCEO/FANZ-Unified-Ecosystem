import React from 'react';

interface BadgeUndergroundProps {
  children: React.ReactNode;
  className?: string;
}

export default function BadgeUnderground({ children, className = '' }: BadgeUndergroundProps) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-ink-900 border border-steel-400/30 text-steel-300 ${className}`}>
      {children}
    </span>
  );
}
