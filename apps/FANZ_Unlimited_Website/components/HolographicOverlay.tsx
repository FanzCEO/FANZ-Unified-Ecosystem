'use client';

import { useEffect, useState } from 'react';

export default function HolographicOverlay() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Holographic interference pattern */}
      <div
        className="fixed inset-0 pointer-events-none z-[100] mix-blend-overlay opacity-20"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,45,161,0.03) 2px,
              rgba(255,45,161,0.03) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(25,240,255,0.03) 2px,
              rgba(25,240,255,0.03) 4px
            )
          `,
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />

      {/* Chromatic aberration overlay */}
      <div className="fixed inset-0 pointer-events-none z-[101] opacity-30">
        <div className="absolute inset-0 animate-chromatic-drift"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(255,45,161,0.05) 100%)',
            mixBlendMode: 'screen'
          }}
        />
        <div className="absolute inset-0 animate-chromatic-drift-reverse"
          style={{
            background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(25,240,255,0.05) 100%)',
            mixBlendMode: 'screen',
            animationDelay: '1s'
          }}
        />
      </div>

      {/* Vignette glow */}
      <div
        className="fixed inset-0 pointer-events-none z-[99]"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(10,10,11,0.4) 100%)',
        }}
      />
    </>
  );
}
