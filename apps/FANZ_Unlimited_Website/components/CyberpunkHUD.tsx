'use client';

import { useEffect, useState } from 'react';

export default function CyberpunkHUD() {
  const [time, setTime] = useState('');
  const [fps, setFps] = useState(60);
  const [connectionStatus, setConnectionStatus] = useState<'SECURE' | 'ONLINE'>('SECURE');

  useEffect(() => {
    // Update time
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    // Simulate FPS counter
    let frameCount = 0;
    let lastTime = performance.now();

    const countFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime >= lastTime + 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFPS);
    };
    countFPS();

    // Random connection status flicker
    const statusInterval = setInterval(() => {
      setConnectionStatus(Math.random() > 0.95 ? 'ONLINE' : 'SECURE');
    }, 3000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[150] font-mono text-[10px]">
      {/* Top Left Corner */}
      <div className="absolute top-4 left-4 space-y-1">
        <div className="flex items-center gap-2 text-neon-cyan/60">
          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
          <span>SYSTEM_ACTIVE</span>
        </div>
        <div className="text-steel-400/50">
          VER: 4.5.2
        </div>
        <div className="text-neon-pink/40 animate-flicker">
          USER://GUEST
        </div>
      </div>

      {/* Top Right Corner */}
      <div className="absolute top-4 right-4 text-right space-y-1">
        <div className="text-neon-cyan/60">
          {time}
        </div>
        <div className="text-steel-400/50">
          FPS: <span className={fps >= 55 ? 'text-acid-lime' : 'text-neon-pink'}>{fps}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-steel-400/50">STATUS:</span>
          <span className={`${connectionStatus === 'SECURE' ? 'text-acid-lime' : 'text-neon-cyan'} animate-pulse`}>
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Bottom Left Corner */}
      <div className="absolute bottom-4 left-4 space-y-1">
        <div className="text-steel-400/50">
          PROTOCOL: HTTPS
        </div>
        <div className="text-neon-pink/40">
          PORT: 443
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-neon-pink/40"></div>
            <div className="w-1 h-3 bg-neon-cyan/40"></div>
            <div className="w-1 h-3 bg-acid-lime/40"></div>
            <div className="w-1 h-3 bg-neon-pink/40 animate-pulse"></div>
          </div>
          <span className="text-steel-400/50">SIGNAL</span>
        </div>
      </div>

      {/* Bottom Right Corner - Data stream */}
      <div className="absolute bottom-4 right-4 text-right space-y-1">
        <div className="text-steel-400/50">
          BANDWIDTH: <span className="text-acid-lime/60">MAX</span>
        </div>
        <div className="text-neon-cyan/40 animate-flicker">
          LATENCY: 12ms
        </div>
        <div className="text-steel-400/50">
          UPTIME: 99.9%
        </div>
      </div>

      {/* Corner Brackets (decorative) */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-neon-pink/20"></div>
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-neon-cyan/20"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-acid-lime/20"></div>
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-neon-pink/20"></div>

      {/* Scanline effect on edges */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent animate-pulse"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-pink/30 to-transparent animate-pulse"></div>
    </div>
  );
}
