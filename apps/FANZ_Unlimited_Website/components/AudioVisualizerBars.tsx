'use client';

import { useEffect, useRef } from 'react';

export default function AudioVisualizerBars() {
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

    const barCount = 60;
    const bars: Array<{ height: number; targetHeight: number; speed: number; x: number }> = [];

    // Initialize bars
    for (let i = 0; i < barCount; i++) {
      bars.push({
        height: Math.random() * 100,
        targetHeight: Math.random() * 100,
        speed: Math.random() * 2 + 1,
        x: (i / barCount) * canvas.width,
      });
    }

    const colors = ['#FF2DA1', '#19F0FF', '#C8FF3D', '#7A2CFF'];

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / barCount;

      bars.forEach((bar, index) => {
        // Update bar position
        bar.x = (index / barCount) * canvas.width;

        // Smooth animation towards target
        if (Math.abs(bar.height - bar.targetHeight) < 1) {
          bar.targetHeight = Math.random() * (canvas.height * 0.4) + 20;
        }

        if (bar.height < bar.targetHeight) {
          bar.height += bar.speed;
        } else {
          bar.height -= bar.speed;
        }

        // Choose color based on height
        let color;
        if (bar.height < canvas.height * 0.15) {
          color = colors[2]; // Lime for low
        } else if (bar.height < canvas.height * 0.25) {
          color = colors[1]; // Cyan for medium
        } else {
          color = colors[0]; // Pink for high
        }

        // Draw bar
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.15;

        // Bar
        ctx.fillRect(
          bar.x,
          canvas.height - bar.height,
          barWidth * 0.6,
          bar.height
        );

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillRect(
          bar.x,
          canvas.height - bar.height,
          barWidth * 0.6,
          3
        );

        ctx.shadowBlur = 0;
      });

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
      className="fixed inset-0 pointer-events-none z-[2]"
      style={{ opacity: 0.3 }}
    />
  );
}
