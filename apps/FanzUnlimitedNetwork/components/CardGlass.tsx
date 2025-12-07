'use client';

import React, { useRef, useState, MouseEvent } from 'react';

interface CardGlassProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

export default function CardGlass({ title, description, children, className = '' }: CardGlassProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovering(false);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={`relative rounded-2xl p-6 bg-ink-800/70 backdrop-blur-xs shadow-glass border border-white/10 transition-all duration-300 ${
        isHovering ? 'glow-intense border-neon-pink/30' : ''
      } ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovering ? 'translateZ(20px) scale(1.02)' : 'translateZ(0) scale(1)'}`,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="absolute inset-0 bg-grid opacity-[.05] pointer-events-none rounded-2xl" style={{ backgroundSize: '32px 32px' }}></div>

      {/* Scanline effect on hover */}
      {isHovering && (
        <div className="absolute inset-0 scanline-strong opacity-50 rounded-2xl pointer-events-none" />
      )}

      {/* Data stream effect */}
      <div className="absolute inset-0 data-stream opacity-30 rounded-2xl pointer-events-none" />

      <h3 className="font-display text-xl text-white relative z-10 chromatic-text">{title}</h3>
      <p className="text-sm text-slate-600 mt-2 relative z-10">{description}</p>
      {children && <div className="mt-4 relative z-10">{children}</div>}
    </div>
  );
}
