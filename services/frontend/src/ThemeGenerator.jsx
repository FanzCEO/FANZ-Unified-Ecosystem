import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Sun, Moon, Zap, Droplet, Flame, Leaf, Star, Heart } from 'lucide-react';

// Dynamic Color Palette Generator
export function ColorPaletteGenerator({ onThemeChange }) {
  const [baseColor, setBaseColor] = useState('#6b5f24');
  const [theme, setTheme] = useState('golden');
  const [isDark, setIsDark] = useState(true);
  
  const themes = {
    golden: { primary: '#6b5f24', secondary: '#161718', accent: '#ffd700' },
    neon: { primary: '#ff00ff', secondary: '#0a0a0a', accent: '#00ffff' },
    ocean: { primary: '#006994', secondary: '#051923', accent: '#00d4ff' },
    sunset: { primary: '#ff6b35', secondary: '#2c0e37', accent: '#ffa500' },
    forest: { primary: '#228b22', secondary: '#0d1f0d', accent: '#90ee90' },
    cosmic: { primary: '#9400d3', secondary: '#0a0014', accent: '#ff1493' },
    fire: { primary: '#ff4500', secondary: '#1a0500', accent: '#ffa500' },
    ice: { primary: '#00bfff', secondary: '#001a33', accent: '#e0ffff' }
  };

  const generatePalette = (base) => {
    const h = parseInt(base.slice(1, 3), 16);
    const s = parseInt(base.slice(3, 5), 16);
    const l = parseInt(base.slice(5, 7), 16);
    
    return {
      primary: base,
      lighter: `#${Math.min(255, h + 30).toString(16).padStart(2, '0')}${Math.min(255, s + 30).toString(16).padStart(2, '0')}${Math.min(255, l + 30).toString(16).padStart(2, '0')}`,
      darker: `#${Math.max(0, h - 30).toString(16).padStart(2, '0')}${Math.max(0, s - 30).toString(16).padStart(2, '0')}${Math.max(0, l - 30).toString(16).padStart(2, '0')}`,
      complementary: `#${(255 - h).toString(16).padStart(2, '0')}${(255 - s).toString(16).padStart(2, '0')}${(255 - l).toString(16).padStart(2, '0')}`
    };
  };

  const applyTheme = (themeName) => {
    const selectedTheme = themes[themeName];
    const palette = generatePalette(selectedTheme.primary);
    
    document.documentElement.style.setProperty('--primary-color', selectedTheme.primary);
    document.documentElement.style.setProperty('--secondary-color', selectedTheme.secondary);
    document.documentElement.style.setProperty('--accent-color', selectedTheme.accent);
    document.documentElement.style.setProperty('--primary-lighter', palette.lighter);
    document.documentElement.style.setProperty('--primary-darker', palette.darker);
    
    setTheme(themeName);
    if (onThemeChange) onThemeChange(themeName, selectedTheme);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
        <div className="flex items-center space-x-2 mb-4">
          <Palette className="h-5 w-5 text-white" />
          <span className="text-white font-semibold">Theme Studio</span>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(themes).map(([name, colors]) => (
            <button
              key={name}
              onClick={() => applyTheme(name)}
              className={`group relative w-12 h-12 rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-110 ${theme === name ? 'ring-2 ring-white' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
              }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-all duration-300"></div>
              {theme === name && (
                <Star className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white" />
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isDark ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-white" />}
          </button>
          
          <input
            type="color"
            value={baseColor}
            onChange={(e) => {
              setBaseColor(e.target.value);
              const palette = generatePalette(e.target.value);
              document.documentElement.style.setProperty('--primary-color', e.target.value);
            }}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// Interactive Onboarding Tour
export function OnboardingTour({ steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const defaultSteps = steps || [
    {
      target: '.dashboard',
      title: 'Welcome to FANZ OS!',
      content: 'Your command center for managing content and earnings',
      position: 'bottom'
    },
    {
      target: '.content-hub',
      title: 'Content Hub',
      content: 'Upload and manage all your content in one place',
      position: 'right'
    },
    {
      target: '.streaming',
      title: 'Go Live',
      content: 'Stream to your audience with military-grade security',
      position: 'left'
    },
    {
      target: '.analytics',
      title: 'Analytics',
      content: 'Track your performance and earnings in real-time',
      position: 'top'
    }
  ];

  useEffect(() => {
    if (isActive && currentStep < defaultSteps.length) {
      const target = document.querySelector(defaultSteps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      }
    }
  }, [currentStep, isActive]);

  const nextStep = () => {
    if (currentStep < defaultSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      if (onComplete) onComplete();
    }
  };

  const skipTour = () => {
    setIsActive(false);
    if (onComplete) onComplete();
  };

  if (!isActive || currentStep >= defaultSteps.length) return null;

  const step = defaultSteps[currentStep];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[9998] pointer-events-none">
        <div
          className="absolute w-32 h-32 rounded-full border-4 border-white/50 animate-pulse"
          style={{
            left: position.x - 64,
            top: position.y - 64,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)'
          }}
        />
      </div>
      
      <div
        className="fixed z-[9999] animate-slideIn"
        style={{
          left: position.x + (step.position === 'left' ? -320 : step.position === 'right' ? 80 : -160),
          top: position.y + (step.position === 'top' ? -120 : step.position === 'bottom' ? 80 : -40)
        }}
      >
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-2xl max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-white">{step.title}</h3>
            <button
              onClick={skipTour}
              className="text-white/60 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
          
          <p className="text-white/90 mb-4">{step.content}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {defaultSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep ? 'bg-white w-6' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              {currentStep === defaultSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-purple-600"></div>
      </div>
    </>
  );
}

// Personalized Dashboard Widget System
export function DashboardWidget({ 
  id, 
  title, 
  icon, 
  content, 
  size = 'medium',
  onRemove,
  onResize,
  isDragging = false
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2',
    full: 'col-span-4 row-span-2'
  };

  const handleResize = () => {
    setIsAnimating(true);
    const sizes = ['small', 'medium', 'large', 'full'];
    const currentIndex = sizes.indexOf(size);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];
    if (onResize) onResize(id, nextSize);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div
      className={`${sizeClasses[size]} ${isDragging ? 'opacity-50' : ''} ${isAnimating ? 'scale-95' : ''} transition-all duration-300`}
    >
      <div className={`h-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-300 ${isMinimized ? 'h-16' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              {icon}
            </div>
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
              </svg>
            </button>
            <button
              onClick={handleResize}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
              </svg>
            </button>
            <button
              onClick={() => onRemove && onRemove(id)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="animate-fadeIn">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

// Real-time Collaboration Annotation
export function AnnotationLayer({ contentId, userId }) {
  const [annotations, setAnnotations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedTool, setSelectedTool] = useState('pen');
  const [color, setColor] = useState('#ff00ff');
  const [showAnnotations, setShowAnnotations] = useState(true);

  const tools = [
    { id: 'pen', icon: '✏️', name: 'Pen' },
    { id: 'highlight', icon: '🖍️', name: 'Highlight' },
    { id: 'arrow', icon: '➡️', name: 'Arrow' },
    { id: 'text', icon: '💬', name: 'Text' },
    { id: 'emoji', icon: '😊', name: 'Emoji' }
  ];

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      const newAnnotation = {
        id: Date.now(),
        type: selectedTool,
        path: currentPath,
        color: color,
        userId: userId,
        timestamp: new Date().toISOString()
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      // Here you would sync with WebSocket for real-time collaboration
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {showAnnotations && (
        <>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-auto"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          >
            {annotations.map((annotation) => (
              <path
                key={annotation.id}
                d={`M ${annotation.path.map(p => `${p.x},${p.y}`).join(' L ')}`}
                stroke={annotation.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-drawLine"
              />
            ))}
            
            {isDrawing && currentPath.length > 0 && (
              <path
                d={`M ${currentPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                stroke={color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}
          </svg>
          
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl rounded-2xl p-3 pointer-events-auto">
            <div className="flex space-x-2 mb-3">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    selectedTool === tool.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 scale-110'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={tool.name}
                >
                  <span className="text-lg">{tool.icon}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <button
                onClick={() => setAnnotations([])}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className="px-3 py-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                {showAnnotations ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Micro-interactions Component
export function MicroInteractions({ children, type = 'hover' }) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [ripples, setRipples] = useState([]);

  const interactions = {
    hover: 'hover:scale-105 hover:rotate-1 transition-all duration-300',
    bounce: 'hover:animate-bounce',
    pulse: 'hover:animate-pulse',
    wiggle: 'hover:animate-wiggle',
    glow: 'hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]',
    tilt: 'hover:transform hover:perspective-1000 hover:rotateX-10 hover:rotateY-10',
    float: 'animate-float'
  };

  const handleRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();
    
    setRipples(prev => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);
  };

  return (
    <div
      className={`relative ${interactions[type]} cursor-pointer`}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onClick={handleRipple}
    >
      {children}
      
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none animate-ripple"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)',
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}
      
      {isInteracting && type === 'glow' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

// Add these animations to your CSS
export const animations = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes drawLine {
    from {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes ripple {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes wiggle {
    0%, 100% { transform: rotate(-3deg); }
    50% { transform: rotate(3deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-slideIn { animation: slideIn 0.5s ease-out; }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
  .animate-drawLine { animation: drawLine 0.5s ease-out; }
  .animate-ripple { animation: ripple 0.6s ease-out; }
  .animate-wiggle { animation: wiggle 0.3s ease-in-out infinite; }
  .animate-float { animation: float 3s ease-in-out infinite; }
`;