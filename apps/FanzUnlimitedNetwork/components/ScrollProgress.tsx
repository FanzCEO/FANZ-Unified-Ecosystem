'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollableHeight = documentHeight - windowHeight;
      const progress = (scrollTop / scrollableHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-ink-900/50 z-[9998]">
        <div
          className="h-full bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime transition-all duration-150 ease-out relative"
          style={{ width: `${scrollProgress}%` }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime blur-md opacity-60"></div>

          {/* Moving light */}
          <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white/60 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* Circular progress indicator (bottom right) */}
      <div className="fixed bottom-8 right-8 z-[9998] hidden md:block">
        <div className="relative w-16 h-16">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="url(#progress-gradient)"
              strokeWidth="3"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - scrollProgress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-150 ease-out"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 45, 161, 0.6))' }}
            />
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF2DA1" />
                <stop offset="50%" stopColor="#19F0FF" />
                <stop offset="100%" stopColor="#C8FF3D" />
              </linearGradient>
            </defs>
          </svg>

          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-neon-cyan font-bold">
              {Math.round(scrollProgress)}%
            </span>
          </div>

          {/* Pulsing background */}
          <div className="absolute inset-0 bg-neon-pink/10 rounded-full blur-xl animate-pulse-glow -z-10"></div>
        </div>
      </div>
    </>
  );
}
