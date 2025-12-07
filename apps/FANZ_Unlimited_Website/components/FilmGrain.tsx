'use client';

import { useEffect, useRef } from 'react';

export default function FilmGrain() {
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

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const pixels = imageData.data;

      // Pulsing intensity
      time += 0.05;
      const intensity = (Math.sin(time) * 0.5 + 0.5) * 0.15 + 0.05;

      // Generate random noise
      for (let i = 0; i < pixels.length; i += 4) {
        const noise = Math.random() * 255 * intensity;

        pixels[i] = noise;     // R
        pixels[i + 1] = noise; // G
        pixels[i + 2] = noise; // B
        pixels[i + 3] = noise * 0.8; // A
      }

      ctx.putImageData(imageData, 0, 0);

      requestAnimationFrame(drawGrain);
    };

    drawGrain();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[115]"
      style={{ opacity: 0.4, mixBlendMode: 'overlay' }}
    />
  );
}
