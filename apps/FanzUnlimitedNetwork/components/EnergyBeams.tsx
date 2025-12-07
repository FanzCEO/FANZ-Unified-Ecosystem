'use client';

import { useEffect, useRef } from 'react';

interface Beam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  life: number;
  maxLife: number;
  color: string;
  thickness: number;
}

export default function EnergyBeams() {
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

    const beams: Beam[] = [];
    const colors = ['#FF2DA1', '#19F0FF', '#C8FF3D'];

    // Find interactive elements to connect
    const getRandomElement = () => {
      const buttons = document.querySelectorAll('button, a[href], [role="button"]');
      if (buttons.length === 0) return null;

      const randomButton = buttons[Math.floor(Math.random() * buttons.length)] as HTMLElement;
      const rect = randomButton.getBoundingClientRect();

      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const createBeam = () => {
      const start = getRandomElement();
      const end = getRandomElement();

      if (!start || !end) return;

      // Don't create beam if points are too close
      const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      if (distance < 200) return;

      beams.push({
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        life: 0,
        maxLife: Math.random() * 60 + 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        thickness: Math.random() * 2 + 1,
      });
    };

    // Create beams periodically
    const beamInterval = setInterval(() => {
      if (beams.length < 3 && Math.random() > 0.7) {
        createBeam();
      }
    }, 1000);

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw beams
      for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        beam.life++;

        if (beam.life > beam.maxLife) {
          beams.splice(i, 1);
          continue;
        }

        const progress = beam.life / beam.maxLife;
        const opacity = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;

        // Draw main beam
        const gradient = ctx.createLinearGradient(beam.x1, beam.y1, beam.x2, beam.y2);
        gradient.addColorStop(0, beam.color);
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, beam.color);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = beam.thickness;
        ctx.globalAlpha = opacity * 0.6;

        // Animated dash effect
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -beam.life * 2;

        ctx.beginPath();
        ctx.moveTo(beam.x1, beam.y1);
        ctx.lineTo(beam.x2, beam.y2);
        ctx.stroke();

        // Draw glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = beam.color;
        ctx.lineWidth = beam.thickness * 2;
        ctx.globalAlpha = opacity * 0.3;
        ctx.beginPath();
        ctx.moveTo(beam.x1, beam.y1);
        ctx.lineTo(beam.x2, beam.y2);
        ctx.stroke();

        // Draw energy particles along beam
        for (let j = 0; j < 3; j++) {
          const particleProgress = ((beam.life + j * 20) % beam.maxLife) / beam.maxLife;
          const px = beam.x1 + (beam.x2 - beam.x1) * particleProgress;
          const py = beam.y1 + (beam.y2 - beam.y1) * particleProgress;

          ctx.shadowBlur = 15;
          ctx.globalAlpha = opacity * 0.8;
          ctx.fillStyle = beam.color;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(beamInterval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[110]"
      style={{ opacity: 0.5 }}
    />
  );
}
