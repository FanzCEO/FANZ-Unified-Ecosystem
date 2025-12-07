import React from 'react';

interface NavPillProps {
  children: React.ReactNode;
  href: string;
  active?: boolean;
  className?: string;
}

export default function NavPill({ children, href, active = false, className = '' }: NavPillProps) {
  return (
    <a
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-sans border transition ${
        active
          ? 'border-white/30 text-white'
          : 'border-white/10 text-steel-300 hover:text-white hover:border-white/30'
      } ${className}`}
    >
      {children}
    </a>
  );
}
