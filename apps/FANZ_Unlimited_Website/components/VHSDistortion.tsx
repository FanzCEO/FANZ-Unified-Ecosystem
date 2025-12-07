'use client';

import { useEffect, useRef } from 'react';

export default function VHSDistortion() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    let glitchIntensity = 0;

    const drawVHSEffect = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.016;

      // Random glitch trigger
      if (Math.random() > 0.98) {
        glitchIntensity = Math.random() * 0.5;
      } else {
        glitchIntensity *= 0.95;
      }

      // Horizontal tracking errors
      if (glitchIntensity > 0.1) {
        const numLines = Math.floor(Math.random() * 5) + 2;
        for (let i = 0; i < numLines; i++) {
          const y = Math.random() * canvas.height;
          const height = Math.random() * 40 + 10;
          const offset = (Math.random() - 0.5) * 100 * glitchIntensity;

          ctx.fillStyle = `rgba(255, 45, 161, ${glitchIntensity * 0.3})`;
          ctx.fillRect(offset, y, canvas.width, height);

          ctx.fillStyle = `rgba(25, 240, 255, ${glitchIntensity * 0.2})`;
          ctx.fillRect(-offset, y + 2, canvas.width, height);
        }
      }

      // Vertical sync issues
      if (Math.random() > 0.95) {
        const rollAmount = Math.random() * 20 + 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, rollAmount);
      }

      // Random static noise bars
      if (Math.random() > 0.9) {
        const barY = Math.random() * canvas.height;
        const barHeight = Math.random() * 3 + 1;

        for (let x = 0; x < canvas.width; x += 2) {
          const brightness = Math.random();
          ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`;
          ctx.fillRect(x, barY, 2, barHeight);
        }
      }

      // Chromatic aberration displacement
      if (glitchIntensity > 0.2) {
        const displacement = glitchIntensity * 5;

        // Red channel
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 0, 0, ${glitchIntensity * 0.15})`;
        ctx.fillRect(-displacement, 0, canvas.width, canvas.height);

        // Cyan channel
        ctx.fillStyle = `rgba(0, 255, 255, ${glitchIntensity * 0.15})`;
        ctx.fillRect(displacement, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'source-over';
      }

      // VHS tape edge warping
      const warpAmount = Math.sin(time * 2) * 2;
      if (Math.abs(warpAmount) > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, warpAmount * 5, canvas.height);
        ctx.fillRect(canvas.width - warpAmount * 5, 0, warpAmount * 5, canvas.height);
      }

      requestAnimationFrame(drawVHSEffect);
    };

    drawVHSEffect();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[120]"
      style={{ opacity: 0.4, mixBlendMode: 'overlay' }}
    />
  );
}
