'use client';

import React, { useState } from 'react';
import NavPill from './NavPill';
import ButtonPrimary from './ButtonPrimary';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ink-900/95 backdrop-blur-lg border-b border-neon-pink/20 shadow-[0_4px_20px_rgba(255,45,161,0.1)]">
      {/* Animated top border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime animate-rotate-gradient"></div>

      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
        {/* Logo with 3D effect */}
        <a
          href="/"
          className="font-display text-3xl text-glow-pink neon-stroke animate-flicker hover:text-glow-cyan transition-all duration-500 relative group"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'perspective(1000px) rotateY(360deg) scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) scale(1)';
          }}
        >
          <span className="relative z-10 chromatic-text">FANZ</span>
          <span className="absolute -inset-2 bg-neon-pink/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10 animate-pulse-glow"></span>
          <span className="absolute inset-0 bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-500 -z-10"></span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <NavPill href="/for-creators">For Creators</NavPill>
          <NavPill href="/how-it-works">How It Works</NavPill>
          <NavPill href="/pricing">Pricing</NavPill>
          <ButtonPrimary href="/signup" className="ml-4">
            Sign Up Free
          </ButtonPrimary>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2 rounded-lg border border-neon-cyan/30 hover:border-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(25,240,255,0.3)] transition-all duration-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-ink-900/95 backdrop-blur-lg border-b border-neon-pink/20 shadow-[0_10px_30px_rgba(255,45,161,0.2)] p-6 md:hidden">
            <div className="flex flex-col gap-4">
              <NavPill href="/for-creators">For Creators</NavPill>
              <NavPill href="/how-it-works">How It Works</NavPill>
              <NavPill href="/pricing">Pricing</NavPill>
              <ButtonPrimary href="/signup">Sign Up Free</ButtonPrimary>
            </div>
            {/* Bottom glow */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-neon-pink to-transparent"></div>
          </div>
        )}
      </nav>
    </header>
  );
}
