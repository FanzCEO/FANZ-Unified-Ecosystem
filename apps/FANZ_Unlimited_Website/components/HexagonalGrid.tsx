'use client';

import { useEffect, useRef } from 'react';

export default function HexagonalGrid() {
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

    const hexSize = 30;
    const hexagons: Array<{ x: number; y: number; opacity: number; pulseSpeed: number }> = [];

    // Calculate hexagon positions
    const cols = Math.ceil(canvas.width / (hexSize * 1.5)) + 2;
    const rows = Math.ceil(canvas.height / (hexSize * Math.sqrt(3))) + 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * hexSize * 1.5;
        const y = row * hexSize * Math.sqrt(3) + (col % 2) * (hexSize * Math.sqrt(3) / 2);

        hexagons.push({
          x,
          y,
          opacity: Math.random() * 0.3,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }
    }

    // Draw hexagon
    const drawHexagon = (x: number, y: number, size: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + size * Math.cos(angle);
        const hy = y + size * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      }
      ctx.closePath();
    };

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      hexagons.forEach((hex) => {
        // Pulse opacity
        hex.opacity = Math.sin(time * hex.pulseSpeed) * 0.15 + 0.15;

        // Random color
        const colorChoice = Math.floor((hex.x + hex.y + time * 10) % 3);
        let color;
        if (colorChoice === 0) {
          color = `rgba(255, 45, 161, ${hex.opacity})`;
        } else if (colorChoice === 1) {
          color = `rgba(25, 240, 255, ${hex.opacity})`;
        } else {
          color = `rgba(200, 255, 61, ${hex.opacity})`;
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        drawHexagon(hex.x, hex.y, hexSize);
        ctx.stroke();

        // Occasional fill for variety
        if (Math.random() > 0.98) {
          ctx.fillStyle = color;
          ctx.fill();
        }
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
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ opacity: 0.15, mixBlendMode: 'screen' }}
    />
  );
}
