import React from 'react';

interface PlatformCardProps {
  name: string;
  description: string;
  color?: 'pink' | 'cyan' | 'lime' | 'purple';
  size?: 'small' | 'medium' | 'large';
}

export default function PlatformCard({ name, description, color = 'cyan', size = 'medium' }: PlatformCardProps) {
  const colorClasses = {
    pink: 'border-neon-pink/30 hover:border-neon-pink hover:shadow-[0_0_30px_rgba(255,45,161,0.3)] bg-neon-pink/5',
    cyan: 'border-neon-cyan/30 hover:border-neon-cyan hover:shadow-[0_0_30px_rgba(25,240,255,0.3)] bg-neon-cyan/5',
    lime: 'border-acid-lime/30 hover:border-acid-lime hover:shadow-[0_0_30px_rgba(200,255,61,0.3)] bg-acid-lime/5',
    purple: 'border-uv-500/30 hover:border-uv-500 hover:shadow-[0_0_30px_rgba(122,44,255,0.3)] bg-uv-500/5',
  };

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <div
      className={`rounded-sexy backdrop-blur-md border-2 transition-all duration-300 hover-lift ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      <h3 className="font-display font-semibold tracking-flow text-white mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
        {name}
      </h3>
      <p className={`font-sans text-steel-300 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${textSizeClasses[size]}`}>
        {description}
      </p>
    </div>
  );
}
