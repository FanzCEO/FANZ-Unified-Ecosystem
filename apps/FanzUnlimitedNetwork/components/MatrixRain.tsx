'use client';

import { useEffect, useRef } from 'react';

interface Drop {
  x: number;
  y: number;
  speed: number;
  length: number;
  chars: string[];
}

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Characters to use
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ$¥₿₮';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: Drop[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      if (Math.random() > 0.7) { // Only 30% of columns have drops
        drops.push({
          x: i * fontSize,
          y: Math.random() * canvas.height,
          speed: Math.random() * 3 + 2,
          length: Math.floor(Math.random() * 20) + 10,
          chars: [],
        });
      }
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      // Fade effect
      ctx.fillStyle = 'rgba(10, 10, 11, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;

      drops.forEach((drop) => {
        // Generate new character for this frame
        const char = chars[Math.floor(Math.random() * chars.length)];

        // Draw the drop trail
        for (let i = 0; i < drop.length; i++) {
          const y = drop.y - i * fontSize;
          if (y < 0 || y > canvas.height) continue;

          // Gradient from bright to dark
          const brightness = 1 - (i / drop.length);
          const alpha = brightness;

          // Alternating colors for variety
          if (i === 0) {
            // Brightest character (head) - white/cyan
            ctx.fillStyle = `rgba(25, 240, 255, ${alpha})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#19F0FF';
          } else {
            // Trail characters - cyan to pink gradient
            const colorMix = i / drop.length;
            if (colorMix < 0.5) {
              ctx.fillStyle = `rgba(25, 240, 255, ${alpha * 0.8})`;
              ctx.shadowBlur = 5;
              ctx.shadowColor = '#19F0FF';
            } else {
              ctx.fillStyle = `rgba(255, 45, 161, ${alpha * 0.6})`;
              ctx.shadowBlur = 5;
              ctx.shadowColor = '#FF2DA1';
            }
          }

          // Get or generate character for this position
          if (!drop.chars[i]) {
            drop.chars[i] = chars[Math.floor(Math.random() * chars.length)];
          }

          // Randomly change character
          if (Math.random() > 0.95) {
            drop.chars[i] = chars[Math.floor(Math.random() * chars.length)];
          }

          ctx.fillText(drop.chars[i], drop.x, y);
        }

        // Move drop
        drop.y += drop.speed;

        // Reset drop when it goes off screen
        if (drop.y > canvas.height + drop.length * fontSize) {
          drop.y = -drop.length * fontSize;
          drop.speed = Math.random() * 3 + 2;
          drop.chars = [];
        }
      });

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[3]"
      style={{ opacity: 0.25, mixBlendMode: 'screen' }}
    />
  );
}
