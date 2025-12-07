'use client';

import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoaded(true), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  if (isLoaded) return null;

  const asciiArt = `
███████╗ █████╗ ███╗   ██╗███████╗
██╔════╝██╔══██╗████╗  ██║╚══███╔╝
█████╗  ███████║██╔██╗ ██║  ███╔╝
██╔══╝  ██╔══██║██║╚██╗██║ ███╔╝
██║     ██║  ██║██║ ╚████║███████╗
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝
  `;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-ink-900 flex items-center justify-center transition-opacity duration-500 ${
        progress >= 100 ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Matrix rain background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-grid-small opacity-30"></div>
      </div>

      {/* Scanlines */}
      <div className="absolute inset-0 scanlines opacity-50"></div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 px-4">
        {/* ASCII Art Logo */}
        <pre className="font-mono text-[10px] md:text-xs text-neon-cyan text-glow-cyan animate-flicker leading-tight whitespace-pre">
          {asciiArt}
        </pre>

        {/* Subtitle */}
        <div className="text-xl md:text-2xl font-display text-neon-pink text-glow-pink uppercase tracking-wider animate-pulse-glow">
          Unlimited
        </div>

        {/* Loading bar */}
        <div className="max-w-md mx-auto space-y-3">
          <div className="relative h-2 bg-ink-800 rounded-full overflow-hidden border border-neon-cyan/30">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 animate-rotate-gradient opacity-60"></div>
            </div>
            {/* Glow effect */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime blur-md opacity-50 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Progress percentage */}
          <div className="flex items-center justify-between font-mono text-xs text-neon-cyan">
            <span className="animate-flicker">LOADING...</span>
            <span className="text-glow-cyan font-bold">{Math.floor(progress)}%</span>
          </div>

          {/* Loading messages */}
          <div className="font-mono text-[10px] text-steel-400 animate-pulse min-h-[12px]">
            {progress < 30 && '&gt; Initializing neural network...'}
            {progress >= 30 && progress < 60 && '&gt; Connecting to the grid...'}
            {progress >= 60 && progress < 90 && '&gt; Synchronizing data streams...'}
            {progress >= 90 && '&gt; Ready to deploy...'}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-steel-400">
          <span className="animate-pulse">[</span>
          <span className="text-neon-pink animate-flicker">●</span>
          <span className="text-neon-cyan animate-flicker" style={{ animationDelay: '0.5s' }}>●</span>
          <span className="text-acid-lime animate-flicker" style={{ animationDelay: '1s' }}>●</span>
          <span className="animate-pulse">]</span>
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-steel-400 opacity-50">
        &gt; SYS_INIT_V4.5
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-steel-400 opacity-50">
        PORT://8080_
      </div>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-steel-400 opacity-50">
        USER://GUEST
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[10px] text-neon-cyan opacity-50 animate-pulse">
        ONLINE
      </div>
    </div>
  );
}
