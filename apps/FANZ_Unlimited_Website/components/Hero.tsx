import React from 'react';
import ButtonPrimary from './ButtonPrimary';
import ButtonSecondary from './ButtonSecondary';
import NeonSign from './NeonSign';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink-900 text-white">
      {/* Background layers */}
      <div className="absolute inset-0 noisy"></div>
      <div className="absolute inset-0 bg-grid opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-neon-pink/5 via-transparent to-neon-cyan/5"></div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-28 relative z-10">
        <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 border-pulse px-3 py-1 rounded-md animate-pulse">
          Underground • Creator-Owned
        </span>

        {/* Enhanced neon sign with glitch effect */}
        <div className="mt-4 animate-glitch-hard">
          <NeonSign text="FANZ" className="" />
        </div>

        {/* Holographic subtitle */}
        <div className="mt-2">
          <span className="holographic text-4xl md:text-5xl font-display font-bold">
            UNLIMITED
          </span>
        </div>

        <p className="mt-6 max-w-2xl text-steel-300 text-lg font-medium">
          <span className="text-glow-cyan">The neon backbone for creators</span>—own it all, keep it all.
        </p>

        {/* Feature badges */}
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-neon-pink/10 text-neon-pink border border-neon-pink/30 text-glow-pink">
            100% OWNERSHIP
          </span>
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 text-glow-cyan">
            ZERO CUTS
          </span>
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-acid-lime/10 text-acid-lime border border-acid-lime/30 text-glow-lime">
            MAX CONTROL
          </span>
        </div>

        {/* Enhanced buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <ButtonPrimary href="#launch">
            Launch Your Hub
          </ButtonPrimary>
          <ButtonSecondary href="#explore">
            Explore the Network
          </ButtonSecondary>
        </div>

        {/* Data stats */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-xl">
          <div className="text-center">
            <div className="font-display text-3xl text-neon-pink text-glow-pink font-bold">99%</div>
            <div className="font-mono text-xs text-steel-400 mt-1">CREATOR KEEPS</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl text-neon-cyan text-glow-cyan font-bold">∞</div>
            <div className="font-mono text-xs text-steel-400 mt-1">POSSIBILITIES</div>
          </div>
          <div className="text-center">
            <div className="font-display text-3xl text-acid-lime text-glow-lime font-bold">24/7</div>
            <div className="font-mono text-xs text-steel-400 mt-1">ALWAYS ON</div>
          </div>
        </div>
      </div>

      {/* Bottom gradient border */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>

      {/* CRT scan effect */}
      <div className="pointer-events-none absolute inset-0 crt-scan"></div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-neon-cyan/30 animate-flicker">
        [SYSTEM_ONLINE]
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-neon-pink/30 animate-pulse">
        &gt;_READY
      </div>
    </section>
  );
}
