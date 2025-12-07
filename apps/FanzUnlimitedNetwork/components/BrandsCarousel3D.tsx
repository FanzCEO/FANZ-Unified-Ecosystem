'use client';

import { useState } from 'react';

interface Brand {
  name: string;
  tagline: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  features: string[];
  url?: string;
}

export default function BrandsCarousel3D() {
  const [activeIndex, setActiveIndex] = useState(0);

  const brands: Brand[] = [
    {
      name: 'FANZ Unlimited',
      tagline: 'All-Access Creator Platform',
      description: 'The flagship platform for all creators. Stream, monetize, and connect with your community—100% on your terms.',
      color: '#FF2DA1',
      gradient: 'from-neon-pink to-neon-cyan',
      icon: '🌟',
      features: ['Live Streaming', 'Direct Payouts', 'Geolocation', 'Content Protection'],
      url: 'https://fanzunlimited.com'
    },
    {
      name: 'BoyFanz',
      tagline: 'For Male Creators',
      description: 'Dedicated platform for male creators and performers. Build your brand, connect with fans, monetize your content.',
      color: '#19F0FF',
      gradient: 'from-neon-cyan to-acid-lime',
      icon: '👔',
      features: ['Male-Focused', 'Premium Content', 'Fan Connections', 'Revenue Control'],
      url: 'https://boyfanz.com'
    },
    {
      name: 'GirlFanz',
      tagline: 'For Female Creators',
      description: 'Empowering female creators with tools for success. Your platform, your rules, your revenue.',
      color: '#FF2DA1',
      gradient: 'from-neon-pink via-purple-500 to-neon-cyan',
      icon: '👗',
      features: ['Female-Focused', 'Safety First', 'Content Defense', 'Direct Earnings'],
      url: 'https://girlfanz.com'
    },
    {
      name: 'PupFanz',
      tagline: 'Kink & Fetish Community',
      description: 'Safe space for kink, fetish, and alternative lifestyle creators. No judgment, full acceptance.',
      color: '#C8FF3D',
      gradient: 'from-acid-lime to-neon-cyan',
      icon: '🐾',
      features: ['Kink-Friendly', 'Community-Driven', 'Privacy-Focused', 'BDSM Safe'],
      url: 'https://pupfanz.com'
    },
    {
      name: 'RecoveryFanz',
      tagline: 'Free Support Community',
      description: 'Free social platform for recovery, sobriety, and mental health support. All walks of life welcome.',
      color: '#19F0FF',
      gradient: 'from-neon-cyan to-blue-400',
      icon: '🌈',
      features: ['100% Free', 'Recovery Support', 'Mental Health', 'No Judgment'],
      url: 'https://recoveryfanz.com'
    },
    {
      name: 'Content Defense',
      tagline: 'Protect Your Work',
      description: 'Automated DMCA takedown service with Poizen™ forensic watermarking. Your content, secured.',
      color: '#FF2DA1',
      gradient: 'from-red-500 to-neon-pink',
      icon: '🛡️',
      features: ['DMCA Automation', 'Forensic Watermarks', 'Piracy Monitoring', 'Legal Support']
    },
    {
      name: 'FanzLanding',
      tagline: 'Central Hub',
      description: 'Your gateway to all FANZ platforms and services. Connect to multiple platforms, manage everything in one place.',
      color: '#C8FF3D',
      gradient: 'from-neon-pink via-neon-cyan to-acid-lime',
      icon: '🚀',
      features: ['Multi-Platform', 'Unified Login', 'Cross-Promotion', 'Central Dashboard']
    }
  ];

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % brands.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + brands.length) % brands.length);
  };

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="relative w-full py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-[.05]"></div>
      <div className="absolute inset-0 gradient-overlay-cyber"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-neon-cyan mb-4">
            Our Ecosystem
          </span>
          <h2 className="font-display text-5xl md:text-7xl text-white text-glow-pink neon-stroke-pink animate-flicker mb-4">
            FANZ Network
          </h2>
          <p className="text-lg text-steel-300 max-w-2xl mx-auto">
            Seven platforms, one mission: creator sovereignty
          </p>
        </div>

        {/* 3D Carousel Container */}
        <div className="relative h-[600px] flex items-center justify-center perspective-1000">
          {/* Cards */}
          <div className="relative w-full h-full">
            {brands.map((brand, index) => {
              const offset = index - activeIndex;
              const isActive = index === activeIndex;

              // Calculate position and rotation for 3D carousel effect
              const translateZ = isActive ? 0 : -200;
              const rotateY = offset * 45;
              const translateX = offset * 350;
              const opacity = isActive ? 1 : Math.max(0.3, 1 - Math.abs(offset) * 0.3);
              const scale = isActive ? 1 : Math.max(0.7, 1 - Math.abs(offset) * 0.15);
              const zIndex = isActive ? 50 : 50 - Math.abs(offset);

              return (
                <div
                  key={brand.name}
                  className="absolute left-1/2 top-1/2 cursor-pointer transition-all duration-700 ease-out"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                    opacity,
                    zIndex,
                    transformStyle: 'preserve-3d',
                  }}
                  onClick={() => goToSlide(index)}
                >
                  <div className={`w-[450px] h-[500px] rounded-3xl p-8 backdrop-blur-lg border-2 transition-all duration-500 ${
                    isActive
                      ? `bg-ink-900/90 border-[${brand.color}] shadow-[0_0_60px_${brand.color}66] animate-neonbuzz`
                      : 'bg-ink-900/50 border-white/20'
                  }`}>
                    {/* Brand Icon */}
                    <div className={`text-8xl mb-4 text-center transition-all duration-500 ${
                      isActive ? 'animate-float' : ''
                    }`}>
                      {brand.icon}
                    </div>

                    {/* Brand Name */}
                    <h3 className={`font-display text-4xl text-center mb-2 transition-all duration-500 ${
                      isActive ? 'text-glow-pink' : 'text-white'
                    }`}>
                      {brand.name}
                    </h3>

                    {/* Tagline */}
                    <p className={`text-center font-display text-sm uppercase tracking-wider mb-4 transition-all duration-500`}
                       style={{ color: isActive ? brand.color : '#888' }}>
                      {brand.tagline}
                    </p>

                    {/* Description */}
                    <p className={`text-center text-sm mb-6 transition-all duration-500 ${
                      isActive ? 'text-steel-300' : 'text-steel-400'
                    }`}>
                      {brand.description}
                    </p>

                    {/* Features */}
                    {isActive && (
                      <div className="grid grid-cols-2 gap-2 mb-6 animate-fadeIn">
                        {brand.features.map((feature, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-center"
                          >
                            <span className="text-xs text-steel-300 font-mono">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA Button */}
                    {isActive && brand.url && (
                      <a
                        href={brand.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block w-full py-3 rounded-xl font-display font-bold uppercase tracking-wider text-center transition-all duration-300 bg-gradient-to-r ${brand.gradient} text-white hover:scale-105`}
                        style={{
                          boxShadow: `0 0 20px ${brand.color}66`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Explore {brand.name}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[100] p-4 rounded-full bg-ink-900/80 border-2 border-neon-cyan/50 hover:border-neon-cyan hover:shadow-[0_0_20px_rgba(25,240,255,0.6)] transition-all duration-300 group"
          >
            <svg className="w-6 h-6 text-neon-cyan group-hover:text-glow-cyan transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[100] p-4 rounded-full bg-ink-900/80 border-2 border-neon-pink/50 hover:border-neon-pink hover:shadow-[0_0_20px_rgba(255,45,161,0.6)] transition-all duration-300 group"
          >
            <svg className="w-6 h-6 text-neon-pink group-hover:text-glow-pink transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex justify-center gap-3 mt-12">
          {brands.map((brand, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === activeIndex
                  ? 'w-12 h-3 bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime shadow-[0_0_15px_rgba(255,45,161,0.8)]'
                  : 'w-3 h-3 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to ${brand.name}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom Border */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime"></div>
    </div>
  );
}
