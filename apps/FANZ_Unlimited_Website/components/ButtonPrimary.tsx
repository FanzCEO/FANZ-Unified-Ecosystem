import React from 'react';

interface ButtonPrimaryProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function ButtonPrimary({ children, href, onClick, className = '' }: ButtonPrimaryProps) {
  const baseClasses = `relative inline-flex items-center gap-2 rounded-ultra px-7 py-3.5 font-display font-semibold text-base tracking-flow text-ink-900 bg-acid-lime hover:brightness-110 hover:scale-105 active:brightness-90 active:scale-95 transition-all duration-300 will-change-transform shadow-[0_4px_16px_rgba(0,0,0,0.3)] ${className}`;
  const baseClasses = `relative inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-sm font-bold tracking-wide text-ink-900 bg-acid-lime hover:brightness-110 hover:scale-105 active:brightness-90 active:scale-95 transition-all duration-300 will-change-transform btn-liquid hover-distort ${className}`;

  if (href) {
    return (
      <a href={href} className={baseClasses}>
        <span className="relative z-10">{children}</span>
        <span aria-hidden className="absolute inset-0 rounded-ultra shadow-neon opacity-70 animate-neonbuzz pointer-events-none"></span>
        <span className="relative z-10 font-bold uppercase">{children}</span>
        <span aria-hidden className="absolute inset-0 rounded-xl shadow-neon opacity-70 animate-neonbuzz pointer-events-none"></span>
        <span aria-hidden className="absolute -inset-1 rounded-xl bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime opacity-0 hover:opacity-30 blur-lg transition-opacity duration-300 pointer-events-none"></span>
      </a>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      <span className="relative z-10">{children}</span>
      <span aria-hidden className="absolute inset-0 rounded-ultra shadow-neon opacity-70 animate-neonbuzz pointer-events-none"></span>
      <span className="relative z-10 font-bold uppercase">{children}</span>
      <span aria-hidden className="absolute inset-0 rounded-xl shadow-neon opacity-70 animate-neonbuzz pointer-events-none"></span>
      <span aria-hidden className="absolute -inset-1 rounded-xl bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime opacity-0 hover:opacity-30 blur-lg transition-opacity duration-300 pointer-events-none"></span>
    </button>
  );
}
