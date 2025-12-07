import React from 'react';

interface NeonSignProps {
  text: string;
  className?: string;
}

export default function NeonSign({ text, className = '' }: NeonSignProps) {
  return (
    <h2 className={`font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker ${className}`}>
      {text}
    </h2>
  );
}
