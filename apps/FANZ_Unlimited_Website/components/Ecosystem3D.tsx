'use client';

import { useState, useRef, useEffect } from 'react';

export default function Ecosystem3D() {
  const [rotation, setRotation] = useState({ x: 20, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotation(prev => ({
      x: prev.x - deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.cursor = 'default';
    }

    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);

  const layers = [
    {
      name: 'Core Brain',
      distance: 0,
      color: '#FF2DA1',
      platforms: ['FanzOS', 'FanzDash', 'TaskSparks', 'FanzSSO', 'FanzHubVault', 'FanzMediaCore', 'FanzCRM', 'FanzMoney', 'FanzMobile']
    },
    {
      name: 'Creator Verticals',
      distance: 180,
      color: '#19F0FF',
      platforms: ['BoyFanz', 'GirlFanz', 'DaddyFanz', 'BearFanz', 'PupFanz', 'CougarFanz', 'TransFanz', 'FemmeFanz', 'TabooFanz', 'SouthernFanz', 'FanzUncut', 'FanzDiscreet', 'FanzEliteTube', 'FanzTube', 'Outlawz']
    },
    {
      name: 'Social Universe',
      distance: 280,
      color: '#C8FF3D',
      platforms: ['FanzUniverse', 'FanzClubCentral', 'FanzMeet', 'StarzCards', 'FanzLink', 'Starz Social']
    },
    {
      name: 'Commerce',
      distance: 380,
      color: '#FF2DA1',
      platforms: ['FanzCommercePod', 'FanzFiliate', 'FanziesDropper', 'FanzWorkMarketplace', 'FanzDefenderDMCA', 'FanzProspectus']
    },
    {
      name: 'AI Intelligence',
      distance: 480,
      color: '#19F0FF',
      platforms: ['FanzGPT', 'FanzSpicyAI', 'FanzChatbotCommand', 'FanzForge', 'FanzVarsity', 'AiDashboard']
    },
    {
      name: 'Entertainment',
      distance: 580,
      color: '#C8FF3D',
      platforms: ['FanzRadio', 'FanzReels', 'VisionForge', 'FanzLanding']
    }
  ];

  return (
    <div className="relative w-full h-screen bg-ink-900 overflow-hidden">
      {/* Instructions */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-black text-white text-glow-pink mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          FANZ ECOSYSTEM 3D
        </h2>
        <p className="font-mono text-sm text-steel-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <span className="text-neon-cyan">DRAG</span> to rotate •{' '}
          <span className="text-neon-pink">SCROLL</span> to zoom •{' '}
          <span className="text-acid-lime">EXPLORE</span> the network
        </p>
      </div>

      {/* 3D Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 perspective-2000"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="absolute top-1/2 left-1/2 transform-gpu transition-transform"
          style={{
            transform: `translate(-50%, -50%) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scale})`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          {/* Central Core */}
          <div
            className="absolute"
            style={{
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-neon-pink via-neon-cyan to-acid-lime animate-rotate-gradient shadow-[0_0_80px_rgba(255,45,161,0.8)]">
              <div className="w-full h-full rounded-full backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                <span className="font-display text-xl font-black text-white text-glow-pink">
                  FanzOS
                </span>
              </div>
            </div>
          </div>

          {/* Layer Rings */}
          {layers.map((layer, layerIndex) => {
            const radius = 200 + (layerIndex * 80);
            const platformCount = layer.platforms.length;

            return (
              <div key={layerIndex}>
                {/* Ring */}
                <div
                  className="absolute rounded-full border-2 opacity-20"
                  style={{
                    width: `${radius * 2}px`,
                    height: `${radius * 2}px`,
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translateZ(${layer.distance}px)`,
                    borderColor: layer.color,
                    boxShadow: `0 0 30px ${layer.color}40`,
                    transformStyle: 'preserve-3d'
                  }}
                />

                {/* Layer Label */}
                <div
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translateZ(${layer.distance}px) translateY(-${radius + 40}px)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="px-4 py-2 rounded-full backdrop-blur-md border-2" style={{
                    borderColor: layer.color,
                    backgroundColor: `${layer.color}10`,
                    boxShadow: `0 0 20px ${layer.color}40`
                  }}>
                    <span className="font-display text-sm font-bold whitespace-nowrap drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" style={{ color: layer.color }}>
                      {layer.name}
                    </span>
                  </div>
                </div>

                {/* Platform Nodes */}
                {layer.platforms.map((platform, index) => {
                  const angle = (index / platformCount) * Math.PI * 2;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <div
                      key={index}
                      className="absolute group"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translateX(${x}px) translateY(${y}px) translateZ(${layer.distance}px)`,
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      {/* Node */}
                      <div
                        className="w-3 h-3 rounded-full transition-all duration-300 group-hover:scale-150"
                        style={{
                          backgroundColor: layer.color,
                          boxShadow: `0 0 15px ${layer.color}, 0 0 30px ${layer.color}80`
                        }}
                      />

                      {/* Label on hover */}
                      <div className="absolute left-1/2 top-6 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                        <div className="px-3 py-1 rounded-lg backdrop-blur-xl border" style={{
                          borderColor: layer.color,
                          backgroundColor: `${layer.color}20`,
                          boxShadow: `0 0 15px ${layer.color}60`
                        }}>
                          <span className="font-mono text-xs font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {platform}
                          </span>
                        </div>
                      </div>

                      {/* Connection line to center */}
                      <svg
                        className="absolute opacity-10 pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          width: `${Math.sqrt(x * x + y * y) + layer.distance}px`,
                          height: '2px',
                          transform: `translate(-50%, -50%) rotate(${Math.atan2(y, x)}rad)`,
                          transformOrigin: 'left center'
                        }}
                      >
                        <line
                          x1="0"
                          y1="1"
                          x2="100%"
                          y2="1"
                          stroke={layer.color}
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                      </svg>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Orbital Lines */}
          {layers.map((layer, index) => (
            <div
              key={`orbit-${index}`}
              className="absolute rounded-full border opacity-5"
              style={{
                width: `${(200 + index * 80) * 2}px`,
                height: `${(200 + index * 80) * 2}px`,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${layer.distance}px)`,
                borderColor: layer.color,
                transformStyle: 'preserve-3d'
              }}
            />
          ))}
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-80 z-20">
        <div className="p-6 rounded-2xl bg-ink-900/90 backdrop-blur-xl border-2 border-neon-pink/30">
          <h3 className="font-display text-xl font-bold text-white mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            Network Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-steel-300">Total Platforms</span>
              <span className="font-display text-lg font-bold text-neon-pink">42</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-steel-300">Network Layers</span>
              <span className="font-display text-lg font-bold text-neon-cyan">6</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-steel-300">Orchestrated by</span>
              <span className="font-display text-lg font-bold text-acid-lime">FanzOS</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-steel-300">Status</span>
              <span className="font-mono text-sm font-bold text-acid-lime flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-acid-lime animate-pulse"></span>
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-[.02] pointer-events-none"></div>
      <div className="absolute inset-0 gradient-overlay-cyber opacity-20 pointer-events-none"></div>
    </div>
  );
}
