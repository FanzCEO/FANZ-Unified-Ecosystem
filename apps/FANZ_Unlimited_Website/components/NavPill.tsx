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
      className={`rounded-full px-5 py-2.5 text-sm font-sans font-medium tracking-flow border transition-all duration-300 ${
        active
          ? 'border-white/40 text-white text-soft-shadow'
          : 'border-white/15 text-white hover:text-neon-cyan hover:border-neon-cyan/50 hover:shadow-[0_0_15px_rgba(25,240,255,0.3)] text-soft-shadow'
      } ${className}`}
    >
      {children}
    </a>
  );
}
