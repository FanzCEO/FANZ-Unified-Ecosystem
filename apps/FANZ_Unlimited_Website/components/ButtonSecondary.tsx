import React from 'react';

interface ButtonSecondaryProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function ButtonSecondary({ children, href, onClick, className = '' }: ButtonSecondaryProps) {
  const baseClasses = `rounded-ultra px-7 py-3.5 font-display font-semibold text-base tracking-flow text-soft-glow-cyan text-white border border-white/30 bg-white/5 backdrop-blur-xs hover:bg-white/10 hover:border-neon-cyan/50 hover:shadow-[0_0_20px_rgba(25,240,255,0.3)] hover:scale-105 active:scale-95 animate-flicker transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] ${className}`;
  const baseClasses = `relative rounded-xl px-6 py-3 font-display text-sm font-bold uppercase tracking-wide text-glow text-neon-cyan border-2 border-neon-cyan/40 bg-white/5 backdrop-blur-xs hover:bg-neon-cyan/20 hover:border-neon-cyan hover:scale-105 hover:shadow-[0_0_30px_rgba(25,240,255,0.6)] active:scale-95 animate-flicker transition-all duration-300 overflow-hidden ${className}`;

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        <span className="relative z-10">{children}</span>
        <span className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 via-neon-cyan/30 to-neon-pink/20 opacity-0 hover:opacity-100 transition-opacity duration-300 animate-rotate-gradient"></span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 via-neon-cyan/30 to-neon-pink/20 opacity-0 hover:opacity-100 transition-opacity duration-300 animate-rotate-gradient"></span>
    </button>
  );
}
