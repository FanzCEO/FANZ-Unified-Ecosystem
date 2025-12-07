import React from 'react';
import { Activity, Users, Heart, Shield, Zap, Eye } from 'lucide-react';

const platforms = [
  {
    id: 'boyfanz',
    name: 'BOYFANZ',
    description: 'Male creator platform',
    color: 'var(--neon-blue)',
    icon: Users,
    stats: '12.3K Active',
    gradient: 'from-blue-500 to-cyan-400'
  },
  {
    id: 'girlfanz',
    name: 'GIRLFANZ',
    description: 'Female creator platform',
    color: 'var(--neon-pink)',
    icon: Heart,
    stats: '18.7K Active',
    gradient: 'from-pink-500 to-rose-400'
  },
  {
    id: 'pupfanz',
    name: 'PUPFANZ',
    description: 'Pup play community',
    color: 'var(--neon-green)',
    icon: Zap,
    stats: '5.2K Active',
    gradient: 'from-green-500 to-emerald-400'
  },
  {
    id: 'daddyfanz',
    name: 'DADDYFANZ',
    description: 'Daddy community',
    color: '#ff8800',
    icon: Shield,
    stats: '8.9K Active',
    gradient: 'from-orange-500 to-amber-400'
  },
  {
    id: 'tranzfanz',
    name: 'TRANZFANZ',
    description: 'Trans creator platform',
    color: '#00ffff',
    icon: Activity,
    stats: '7.1K Active',
    gradient: 'from-cyan-500 to-teal-400'
  },
  {
    id: 'taboofanz',
    name: 'TABOOFANZ',
    description: 'Alternative content',
    color: '#ff00ff',
    icon: Eye,
    stats: '3.8K Active',
    gradient: 'from-purple-500 to-violet-400'
  }
];

export default function PlatformSelector({ onSelectPlatform, currentPlatform }) {
  return (
    <div className="min-h-screen bg-[var(--dark-bg)] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-5xl lg:text-6xl heading-futuristic mb-4">
            SELECT YOUR <span className="text-neon">PLATFORM</span>
          </h1>
          <p className="text-xl text-gray-400">
            Choose your community. Switch anytime. Keep your profile.
          </p>
        </div>

        {/* Platform Grid */}
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform, index) => {
              const Icon = platform.icon;
              const isActive = currentPlatform === platform.id;
              
              return (
                <button
                  key={platform.id}
                  onClick={() => onSelectPlatform(platform.id)}
                  className={`card-futuristic group relative overflow-hidden transition-all duration-500 hover:scale-105 ${
                    isActive ? 'ring-2' : ''
                  }`}
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    borderColor: isActive ? platform.color : 'rgba(255, 0, 128, 0.2)',
                    ringColor: platform.color
                  }}
                >
                  {/* Gradient Background on Hover */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  ></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Icon 
                            className="h-8 w-8 transition-colors duration-300"
                            style={{ color: platform.color }}
                          />
                          <div 
                            className="absolute inset-0 h-8 w-8 opacity-30 blur-xl animate-pulse"
                            style={{ backgroundColor: platform.color }}
                          ></div>
                        </div>
                        <div className="text-left">
                          <h3 
                            className="text-xl heading-futuristic"
                            style={{ color: platform.color }}
                          >
                            {platform.name}
                          </h3>
                          <p className="text-xs text-gray-500">{platform.description}</p>
                        </div>
                      </div>
                      {isActive && (
                        <div 
                          className="badge-glow text-xs"
                          style={{ background: platform.color }}
                        >
                          ACTIVE
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4" style={{ color: platform.color }} />
                        <span className="text-gray-400">{platform.stats}</span>
                      </div>
                      <span 
                        className="text-xs uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ color: platform.color }}
                      >
                        Enter →
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.random() * 40 + 60}%`,
                          background: `linear-gradient(90deg, ${platform.color}, transparent)`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div 
                      className="absolute inset-x-0 top-0 h-px"
                      style={{ 
                        background: `linear-gradient(90deg, transparent, ${platform.color}, transparent)`,
                        animation: 'scanline 3s linear infinite'
                      }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-4 gap-4">
          <div className="text-center animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-3xl heading-futuristic text-[var(--neon-green)]">58.3K</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Users</div>
          </div>
          <div className="text-center animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <div className="text-3xl heading-futuristic text-[var(--neon-blue)]">12.8K</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Creators</div>
          </div>
          <div className="text-center animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <div className="text-3xl heading-futuristic text-[var(--neon-purple)]">2.4M</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Content Items</div>
          </div>
          <div className="text-center animate-slide-up" style={{ animationDelay: '0.9s' }}>
            <div className="text-3xl heading-futuristic text-[var(--neon-pink)]">$847K</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Monthly Volume</div>
          </div>
        </div>
      </div>
    </div>
  );
}