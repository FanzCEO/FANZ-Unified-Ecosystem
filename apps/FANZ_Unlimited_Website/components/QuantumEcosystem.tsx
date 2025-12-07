'use client';

import { useState, useRef, useEffect } from 'react';

interface Platform {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  security: string[];
  color: string;
  position: { x: number; y: number; z: number };
}

export default function QuantumEcosystem() {
  const [rotation, setRotation] = useState({ x: 20, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSecurityLayers, setShowSecurityLayers] = useState(true);
  const [showDataFlow, setShowDataFlow] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const platforms: Platform[] = [
    // Core Infrastructure
    {
      id: 'fanzos',
      name: 'FanzOS',
      category: 'Core Infrastructure',
      description: 'The quantum orchestration layer. Every API call, task queue, and AI agent flows through FanzOS in real-time.',
      features: [
        'Real-time API orchestration',
        'AI agent coordination',
        'Task queue management',
        'System-wide event handling',
        'Microservices architecture'
      ],
      security: [
        'Military-grade AES-256 encryption',
        'Zero-trust architecture',
        'Real-time threat detection',
        'Quantum-resistant algorithms'
      ],
      color: '#FF2DA1',
      position: { x: 0, y: 0, z: 0 }
    },
    {
      id: 'fanzhubvault',
      name: 'FanzHubVault',
      category: 'Core Infrastructure',
      description: 'Fort Knox for creator data. Stores identity verification, contracts, 2257/2258 compliance records, and legal documents with blockchain-level security.',
      features: [
        'Identity verification storage',
        'Legal compliance tracking',
        '2257/2258 record keeping',
        'Contract management',
        'Audit trail logging'
      ],
      security: [
        'Military-grade encryption at rest',
        'Multi-factor authentication',
        'Biometric verification',
        'Immutable audit logs',
        'GDPR & CCPA compliant'
      ],
      color: '#19F0FF',
      position: { x: -200, y: 100, z: 200 }
    },
    {
      id: 'fanzmediacore',
      name: 'FanzMediaCore',
      category: 'Core Infrastructure',
      description: 'The content fortress. Every upload is transcoded, AI-moderated, forensically fingerprinted with FanzForensics™, watermarked, and delivered via global CDN.',
      features: [
        'FanzForensics™ signature protection',
        'AI content moderation',
        'Multi-format transcoding',
        'Invisible watermarking',
        'Global CDN delivery',
        'Real-time virus scanning'
      ],
      security: [
        'Forensic fingerprinting',
        'Invisible watermark embedding',
        'Content integrity verification',
        'DMCA auto-enforcement',
        'Piracy detection AI'
      ],
      color: '#C8FF3D',
      position: { x: 200, y: 100, z: 200 }
    },
    {
      id: 'fanzmoney',
      name: 'FanzMoney',
      category: 'Core Infrastructure',
      description: 'The financial powerhouse. Handles wallets, escrow, direct payouts, affiliate payments, and creator banking with zero platform fees.',
      features: [
        'Multi-currency wallets',
        'Instant payouts',
        'Escrow management',
        'Affiliate tracking',
        'Tax documentation',
        'Fraud prevention'
      ],
      security: [
        'PCI-DSS Level 1 compliance',
        'Bank-grade encryption',
        'Multi-sig transactions',
        'Real-time fraud detection',
        'Anti-money laundering (AML)'
      ],
      color: '#FF2DA1',
      position: { x: -200, y: -100, z: 200 }
    },
    {
      id: 'fanzmobile',
      name: 'FanzMobile',
      category: 'Core Infrastructure',
      description: 'Creator command center in your pocket. Upload, verify, publish, monetize, and manage everything across all platforms.',
      features: [
        'Cross-platform publishing',
        'Co-Star verification',
        'AI post approval',
        'Financial dashboard',
        'Real-time analytics',
        'Content scheduling'
      ],
      security: [
        'Biometric authentication',
        'End-to-end encryption',
        'Secure content uploads',
        'Device verification',
        'Remote wipe capability'
      ],
      color: '#19F0FF',
      position: { x: 200, y: -100, z: 200 }
    },
    // Creator Platforms
    {
      id: 'boyfanz',
      name: 'BoyFanz',
      category: 'Creator Platforms',
      description: 'Flagship gay creator platform. The pulse of the network with live streaming, premium content, and community features.',
      features: [
        'Live streaming',
        'Premium subscriptions',
        'Direct messaging',
        'Content marketplace',
        'Community forums'
      ],
      security: [
        'Age verification',
        'Content moderation AI',
        'Privacy controls',
        'Safe browsing'
      ],
      color: '#19F0FF',
      position: { x: -300, y: 0, z: -200 }
    },
    {
      id: 'girlfanz',
      name: 'GirlFanz',
      category: 'Creator Platforms',
      description: 'Female creator ecosystem focused on glamour, lifestyle, and empowerment with advanced monetization tools.',
      features: [
        'Lifestyle content',
        'Beauty & wellness',
        'Fashion showcases',
        'Coaching programs',
        'Brand partnerships'
      ],
      security: [
        'Enhanced privacy',
        'Stalker protection',
        'Location masking',
        'Content encryption'
      ],
      color: '#FF2DA1',
      position: { x: -150, y: 0, z: -200 }
    },
    {
      id: 'taboo fanz',
      name: 'TabooFanz',
      category: 'Creator Platforms',
      description: 'The edge platform for experimental, kink, fetish, and alternative lifestyle content without judgment.',
      features: [
        'Kink & fetish content',
        'Alternative lifestyles',
        'Private communities',
        'Custom experiences',
        'No censorship'
      ],
      security: [
        'Anonymous browsing',
        'Encrypted storage',
        'Consent verification',
        'Safe word protocols'
      ],
      color: '#7A2CFF',
      position: { x: 0, y: 0, z: -200 }
    },
    // AI & Intelligence
    {
      id: 'fanzgpt',
      name: 'FanzGPT',
      category: 'AI Intelligence',
      description: 'Central AI brain orchestrating conversation flows, creator support, and ecosystem automation with ethical guardrails.',
      features: [
        'Natural language processing',
        'Creator support automation',
        'Content suggestions',
        'Sentiment analysis',
        'Multi-language support'
      ],
      security: [
        'Data anonymization',
        'Privacy-first training',
        'Ethical AI guidelines',
        'Bias detection'
      ],
      color: '#19F0FF',
      position: { x: 300, y: 0, z: -200 }
    },
    {
      id: 'fanzspicyai',
      name: 'FanzSpicyAI',
      category: 'AI Intelligence',
      description: 'Unfiltered AI model for creative, spicy, and adult-safe interactions without corporate censorship.',
      features: [
        'Adult content understanding',
        'Creative generation',
        'Personalized responses',
        'Context awareness',
        'No prudish filters'
      ],
      security: [
        'Age-gated access',
        'Consent verification',
        'Content boundaries',
        'User privacy'
      ],
      color: '#FF2DA1',
      position: { x: 400, y: 0, z: -200 }
    },
    // Social Universe
    {
      id: 'fanzuniverse',
      name: 'FanzUniverse',
      category: 'Social Universe',
      description: 'The social metaverse. Facebook + Fetlife + Reddit fused into one platform with global feeds, events, and communities.',
      features: [
        'Global social feeds',
        'Vertical communities',
        'Live events',
        'Direct messaging',
        'Group forums',
        'Creator discovery'
      ],
      security: [
        'Content filtering',
        'Block/report tools',
        'Privacy zones',
        'Safe spaces'
      ],
      color: '#C8FF3D',
      position: { x: 0, y: 200, z: -100 }
    }
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
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
    setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
  };

  const handlePlatformClick = (platform: Platform) => {
    setSelectedPlatform(platform);
    // Zoom into the platform
    setZoom(2);
  };

  const handleCloseDetail = () => {
    setSelectedPlatform(null);
    setZoom(1);
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

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Space Background */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/20 via-black to-black"></div>

      {/* Animated Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 200 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      {/* Controls Panel */}
      <div className="absolute top-8 left-8 z-30 space-y-4">
        <div className="p-6 rounded-2xl bg-ink-900/90 backdrop-blur-xl border-2 border-neon-pink/30 shadow-[0_0_40px_rgba(255,45,161,0.3)]">
          <h2 className="font-display text-2xl font-black text-white mb-4 text-glow-pink drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            QUANTUM CONTROL
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => setShowSecurityLayers(!showSecurityLayers)}
              className={`w-full px-4 py-2 rounded-lg font-sans font-semibold text-sm transition-all duration-300 ${
                showSecurityLayers
                  ? 'bg-neon-pink text-ink-900 shadow-[0_0_20px_rgba(255,45,161,0.6)]'
                  : 'bg-white/10 text-white border border-white/30'
              }`}
            >
              🛡️ Security Layers
            </button>
            <button
              onClick={() => setShowDataFlow(!showDataFlow)}
              className={`w-full px-4 py-2 rounded-lg font-sans font-semibold text-sm transition-all duration-300 ${
                showDataFlow
                  ? 'bg-neon-cyan text-ink-900 shadow-[0_0_20px_rgba(25,240,255,0.6)]'
                  : 'bg-white/10 text-white border border-white/30'
              }`}
            >
              ⚡ Data Pipelines
            </button>
            <div className="pt-3 border-t border-white/20">
              <p className="font-mono text-xs text-steel-300 mb-2">Zoom: {(zoom * 100).toFixed(0)}%</p>
              <p className="font-mono text-xs text-steel-300">Platforms: {platforms.length}</p>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="p-6 rounded-2xl bg-ink-900/90 backdrop-blur-xl border-2 border-acid-lime/30 shadow-[0_0_40px_rgba(200,255,61,0.3)]">
          <h3 className="font-display text-lg font-bold text-acid-lime mb-3 drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">
            🔐 SECURITY LAYERS
          </h3>
          <ul className="space-y-2 text-sm font-sans text-white">
            <li className="flex items-start gap-2">
              <span className="text-acid-lime">✓</span>
              <span>Military-grade AES-256 encryption</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-acid-lime">✓</span>
              <span>FanzForensics™ signature protection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-acid-lime">✓</span>
              <span>Zero-trust architecture</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-acid-lime">✓</span>
              <span>Quantum-resistant algorithms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-acid-lime">✓</span>
              <span>Real-time threat detection</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-8 right-8 z-20">
        <div className="p-4 rounded-xl bg-ink-900/90 backdrop-blur-xl border-2 border-neon-cyan/30">
          <p className="font-mono text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <span className="text-neon-cyan">DRAG</span> to rotate •{' '}
            <span className="text-neon-pink">SCROLL</span> to zoom •{' '}
            <span className="text-acid-lime">CLICK</span> platforms
          </p>
        </div>
      </div>

      {/* 3D Space Container */}
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
          className="absolute top-1/2 left-1/2 transform-gpu transition-transform duration-300"
          style={{
            transform: `translate(-50%, -50%) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Central Core - FanzOS */}
          <div
            className="absolute"
            style={{
              transform: 'translateZ(0px)',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="relative group">
              <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-neon-pink via-neon-cyan to-acid-lime animate-rotate-gradient shadow-[0_0_100px_rgba(255,45,161,1)]">
                <div className="w-full h-full rounded-2xl backdrop-blur-sm border-4 border-white/30 flex items-center justify-center flex-col p-4">
                  <span className="font-display text-2xl font-black text-white text-glow-pink drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    FanzOS
                  </span>
                  <span className="font-mono text-xs text-white mt-2 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    Quantum Core
                  </span>
                </div>
              </div>

              {/* Security Shields */}
              {showSecurityLayers && (
                <>
                  {[1, 2, 3].map((layer) => (
                    <div
                      key={layer}
                      className="absolute inset-0 rounded-2xl border-2 border-acid-lime/30 animate-pulse"
                      style={{
                        width: `${140 + layer * 40}px`,
                        height: `${140 + layer * 40}px`,
                        left: `${-layer * 20}px`,
                        top: `${-layer * 20}px`,
                        animationDelay: `${layer * 0.3}s`,
                        boxShadow: `0 0 ${20 + layer * 10}px rgba(200, 255, 61, 0.${7 - layer})`
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Platform Containers */}
          {platforms.slice(1).map((platform, index) => {
            const isSelected = selectedPlatform?.id === platform.id;
            return (
              <div
                key={platform.id}
                className="absolute cursor-pointer group"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translateX(${platform.position.x}px) translateY(${platform.position.y}px) translateZ(${platform.position.z}px)`,
                  transformStyle: 'preserve-3d'
                }}
                onClick={() => handlePlatformClick(platform)}
              >
                {/* Platform Container */}
                <div
                  className={`relative w-32 h-32 rounded-xl transition-all duration-300 ${
                    isSelected ? 'scale-150' : 'group-hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: `${platform.color}20`,
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    borderColor: platform.color,
                    boxShadow: `0 0 ${isSelected ? '60' : '30'}px ${platform.color}80, inset 0 0 20px ${platform.color}40`,
                    transform: 'rotateY(0deg) rotateX(0deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Platform Name */}
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    <span
                      className="font-display text-sm font-bold text-center drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                      style={{ color: platform.color }}
                    >
                      {platform.name}
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-mono font-bold whitespace-nowrap"
                    style={{
                      backgroundColor: `${platform.color}40`,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: platform.color,
                      color: 'white'
                    }}
                  >
                    {platform.category}
                  </div>

                  {/* Glow Effect */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow: `0 0 40px ${platform.color}`
                    }}
                  />
                </div>

                {/* Data Pipeline to Core */}
                {showDataFlow && (
                  <svg
                    className="absolute pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${Math.sqrt(Math.pow(platform.position.x, 2) + Math.pow(platform.position.y, 2))}px`,
                      height: '3px',
                      transform: `translate(-50%, -50%) rotate(${Math.atan2(platform.position.y, platform.position.x)}rad)`,
                      transformOrigin: 'left center'
                    }}
                  >
                    <line
                      x1="0"
                      y1="1.5"
                      x2="100%"
                      y2="1.5"
                      stroke={platform.color}
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-12"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </line>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Detail Panel */}
      {selectedPlatform && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="max-w-4xl w-full mx-8 p-8 rounded-3xl bg-ink-900 border-4 shadow-[0_0_80px_rgba(255,45,161,0.5)] max-h-[90vh] overflow-y-auto"
            style={{
              borderColor: selectedPlatform.color,
              boxShadow: `0 0 80px ${selectedPlatform.color}80`
            }}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold mb-3"
                  style={{
                    backgroundColor: `${selectedPlatform.color}40`,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: selectedPlatform.color,
                    color: selectedPlatform.color
                  }}
                >
                  {selectedPlatform.category}
                </span>
                <h2
                  className="font-display text-4xl font-black mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  style={{ color: selectedPlatform.color }}
                >
                  {selectedPlatform.name}
                </h2>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 transition-all duration-300"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-lg text-white font-sans mb-8 leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              {selectedPlatform.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Features */}
              <div className="p-6 rounded-2xl bg-white/5 border-2 border-neon-cyan/30">
                <h3 className="font-display text-xl font-bold text-neon-cyan mb-4 drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">
                  ⚡ Features
                </h3>
                <ul className="space-y-2">
                  {selectedPlatform.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-white font-sans">
                      <span className="text-neon-cyan mt-1">▸</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security */}
              <div className="p-6 rounded-2xl bg-white/5 border-2 border-acid-lime/30">
                <h3 className="font-display text-xl font-bold text-acid-lime mb-4 drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">
                  🛡️ Security
                </h3>
                <ul className="space-y-2">
                  {selectedPlatform.security.map((sec, i) => (
                    <li key={i} className="flex items-start gap-2 text-white font-sans">
                      <span className="text-acid-lime mt-1">✓</span>
                      <span>{sec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* FanzForensics Callout */}
            {selectedPlatform.id === 'fanzmediacore' && (
              <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 border-2 border-neon-pink/50 shadow-[0_0_40px_rgba(255,45,161,0.3)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-neon-pink/30 border-2 border-neon-pink flex items-center justify-center">
                    <span className="text-2xl">🔬</span>
                  </div>
                  <h4 className="font-display text-2xl font-black text-neon-pink drop-shadow-[0_2px_8px_rgba(255,45,161,0.8)]">
                    FanzForensics™
                  </h4>
                </div>
                <p className="text-white font-sans leading-relaxed">
                  Every piece of content uploaded to FANZ is embedded with an invisible, forensic-grade digital signature.
                  If your content is stolen and posted elsewhere, FanzForensics can trace it back to the exact upload,
                  timestamp, and user account. Our AI scans the web 24/7, automatically issuing DMCA takedowns and
                  protecting your intellectual property with military-grade precision.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FanzForensics Badge */}
      <div className="absolute bottom-8 right-8 z-20">
        <div className="p-4 rounded-xl bg-ink-900/90 backdrop-blur-xl border-2 border-neon-pink/30 shadow-[0_0_40px_rgba(255,45,161,0.3)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-pink/30 border-2 border-neon-pink flex items-center justify-center">
              <span className="text-xl">🔬</span>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-neon-pink drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">
                FanzForensics™
              </p>
              <p className="font-mono text-xs text-steel-300">Signature Protection Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-8 z-20">
        <div className="p-4 rounded-xl bg-ink-900/90 backdrop-blur-xl border-2 border-white/30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-pink"></div>
              <span className="font-mono text-xs text-white">Core</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neon-cyan"></div>
              <span className="font-mono text-xs text-white">Creators</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-acid-lime"></div>
              <span className="font-mono text-xs text-white">Social</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="font-mono text-xs text-white">Edge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Credits */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="p-4 rounded-xl bg-ink-900/90 backdrop-blur-xl border-2 border-neon-pink/30 shadow-[0_0_30px_rgba(255,45,161,0.3)]">
          <div className="text-center">
            <p className="font-display text-sm font-bold text-white mb-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
              Developed by <span className="text-neon-pink text-glow-pink">Joshua Stone</span>
            </p>
            <p className="font-mono text-xs text-steel-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              FANZ CEO • 2025
            </p>
            <p className="font-mono text-xs text-steel-400 mt-1">
              Licensed to <span className="text-neon-cyan">FANZ™ Group Holdings LLC</span>
            </p>
            <p className="font-mono text-xs text-steel-500">All Rights Reserved</p>
          </div>
        </div>
      </div>
    </div>
  );
}
