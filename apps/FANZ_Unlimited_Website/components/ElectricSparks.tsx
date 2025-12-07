'use client';

import { useEffect, useRef } from 'react';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function ElectricSparks() {
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

    const sparks: Spark[] = [];
    const colors = ['#FF2DA1', '#19F0FF', '#C8FF3D'];

    const createSparks = (x: number, y: number, count: number = 20) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;

        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: Math.random() * 30 + 30,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    // Listen for clicks on buttons, links, etc.
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        createSparks(e.clientX, e.clientY, 25);
      }
    };

    document.addEventListener('click', handleClick);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];

        // Update position
        spark.x += spark.vx;
        spark.y += spark.vy;
        spark.vy += 0.2; // Gravity
        spark.vx *= 0.98; // Friction
        spark.life++;

        // Remove dead sparks
        if (spark.life > spark.maxLife) {
          sparks.splice(i, 1);
          continue;
        }

        // Calculate opacity based on life
        const opacity = 1 - spark.life / spark.maxLife;

        // Draw spark
        ctx.shadowBlur = 10;
        ctx.shadowColor = spark.color;
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = opacity;

        // Draw as a small circle
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw trailing line
        if (spark.life > 1) {
          const prevX = spark.x - spark.vx;
          const prevY = spark.y - spark.vy;

          ctx.strokeStyle = spark.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = opacity * 0.5;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(spark.x, spark.y);
          ctx.stroke();
        }

        // Lightning bolt effect (occasional)
        if (spark.life < 5 && Math.random() > 0.7) {
          const boltX = spark.x + (Math.random() - 0.5) * 20;
          const boltY = spark.y + (Math.random() - 0.5) * 20;

          ctx.strokeStyle = spark.color;
          ctx.lineWidth = 1;
          ctx.globalAlpha = opacity * 0.8;
          ctx.beginPath();
          ctx.moveTo(spark.x, spark.y);
          ctx.lineTo(boltX, boltY);
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[250]"
    />
  );
}
