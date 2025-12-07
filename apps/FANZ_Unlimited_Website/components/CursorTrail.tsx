'use client';

import { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export default function CursorTrail() {
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

    const trail: TrailPoint[] = [];
    const maxTrailLength = 30;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Add new trail point
      trail.push({
        x: mouseX,
        y: mouseY,
        life: 1,
      });

      // Limit trail length
      if (trail.length > maxTrailLength) {
        trail.shift();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw trail
      for (let i = 0; i < trail.length; i++) {
        const point = trail[i];
        point.life -= 0.05;

        if (point.life <= 0) {
          trail.splice(i, 1);
          i--;
          continue;
        }

        const progress = i / trail.length;
        const size = 8 * point.life * progress;
        const opacity = point.life * progress;

        // Draw with chromatic aberration effect
        ctx.shadowBlur = 30;

        // Pink layer
        ctx.shadowColor = '#FF2DA1';
        ctx.fillStyle = '#FF2DA1';
        ctx.globalAlpha = opacity * 0.6;
        ctx.beginPath();
        ctx.arc(point.x - 1, point.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Cyan layer
        ctx.shadowColor = '#19F0FF';
        ctx.fillStyle = '#19F0FF';
        ctx.globalAlpha = opacity * 0.6;
        ctx.beginPath();
        ctx.arc(point.x + 1, point.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Yellow layer
        ctx.shadowColor = '#C8FF3D';
        ctx.fillStyle = '#C8FF3D';
        ctx.globalAlpha = opacity * 0.4;
        ctx.beginPath();
        ctx.arc(point.x, point.y - 1, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines
        if (i > 0) {
          const prevPoint = trail[i - 1];
          const gradient = ctx.createLinearGradient(
            prevPoint.x,
            prevPoint.y,
            point.x,
            point.y
          );
          gradient.addColorStop(0, '#FF2DA1');
          gradient.addColorStop(0.5, '#7A2CFF');
          gradient.addColorStop(1, '#19F0FF');

          ctx.strokeStyle = gradient;
          ctx.globalAlpha = opacity * 0.3;
          ctx.lineWidth = 2 * progress;
          ctx.beginPath();
          ctx.moveTo(prevPoint.x, prevPoint.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
