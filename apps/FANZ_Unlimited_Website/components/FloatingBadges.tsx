'use client';

import { useEffect, useState } from 'react';

interface Badge {
  id: number;
  text: string;
  icon: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

export default function FloatingBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    const badgeData = [
      { text: 'VERIFIED', icon: '✓', color: 'neon-cyan' },
      { text: '100% OWNED', icon: '⚡', color: 'acid-lime' },
      { text: 'SECURE', icon: '🔒', color: 'neon-pink' },
      { text: 'ELITE', icon: '⭐', color: 'uv-500' },
      { text: 'PRO', icon: '💎', color: 'neon-cyan' },
    ];

    const initialBadges: Badge[] = badgeData.map((data, index) => ({
      id: index,
      text: data.text,
      icon: data.icon,
      x: Math.random() * (window.innerWidth - 150),
      y: Math.random() * (window.innerHeight - 100),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      color: data.color,
    }));

    setBadges(initialBadges);

    const animate = () => {
      setBadges((prevBadges) =>
        prevBadges.map((badge) => {
          let newX = badge.x + badge.vx;
          let newY = badge.y + badge.vy;
          let newVx = badge.vx;
          let newVy = badge.vy;

          // Bounce off edges
          if (newX <= 0 || newX >= window.innerWidth - 150) {
            newVx *= -1;
            newX = Math.max(0, Math.min(newX, window.innerWidth - 150));
          }
          if (newY <= 0 || newY >= window.innerHeight - 100) {
            newVy *= -1;
            newY = Math.max(0, Math.min(newY, window.innerHeight - 100));
          }

          return {
            ...badge,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: badge.rotation + badge.rotationSpeed,
          };
        })
      );
    };

    const interval = setInterval(animate, 1000 / 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[125] overflow-hidden">
      {badges.map((badge) => (
        <div
          key={badge.id}
          className={`absolute px-4 py-2 rounded-full border-2 backdrop-blur-sm font-display text-xs font-bold uppercase tracking-wider transition-transform duration-100 hover:scale-110 pointer-events-auto cursor-pointer
            ${
              badge.color === 'neon-cyan'
                ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan text-glow-cyan'
                : badge.color === 'acid-lime'
                ? 'border-acid-lime/50 bg-acid-lime/10 text-acid-lime text-glow-lime'
                : badge.color === 'neon-pink'
                ? 'border-neon-pink/50 bg-neon-pink/10 text-neon-pink text-glow-pink'
                : 'border-uv-500/50 bg-uv-500/10 text-uv-500'
            }
          `}
          style={{
            left: `${badge.x}px`,
            top: `${badge.y}px`,
            transform: `rotate(${badge.rotation}deg)`,
          }}
        >
          <span className="mr-2">{badge.icon}</span>
          {badge.text}
        </div>
      ))}
    </div>
  );
}
