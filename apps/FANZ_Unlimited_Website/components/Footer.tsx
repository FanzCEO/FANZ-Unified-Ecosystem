import React from 'react';
import BadgeUnderground from './BadgeUnderground';

export default function Footer() {
  return (
    <footer className="relative bg-ink-900/95 backdrop-blur-xl border-t border-neon-pink/30 z-20">
      {/* Animated top border */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-neon-pink via-neon-cyan to-transparent opacity-70 shadow-[0_0_20px_rgba(255,45,161,0.5)]"></div>

      {/* Background overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 to-ink-900/90 backdrop-blur-sm"></div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="relative group">
            <a
              href="/"
              className="font-display text-4xl font-bold tracking-tight text-soft-glow-pink mb-4 inline-block hover:text-soft-glow-cyan transition-all duration-300 hover:scale-105 drop-shadow-[0_0_8px_rgba(255,45,161,0.8)]"
            >
              FANZ
              <span className="absolute -inset-2 bg-neon-pink/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10"></span>
            </a>
            <p className="text-base font-sans font-medium text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Creator-owned platform. Underground. Unapologetic.
            </p>
            <div className="mt-4">
              <BadgeUnderground>Beta Access</BadgeUnderground>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-display text-base font-semibold uppercase tracking-wide text-neon-cyan mb-4 drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">
              Platform
            </h4>
            <ul className="space-y-3">
              <li><a href="/for-creators" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Features</a></li>
              <li><a href="/pricing" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Pricing</a></li>
              <li><a href="/how-it-works" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">How It Works</a></li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="font-display text-base font-semibold uppercase tracking-wide text-neon-pink mb-4 drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">
              Creators
            </h4>
            <ul className="space-y-3">
              <li><a href="/for-creators" className="text-base font-sans font-medium text-white hover:text-neon-pink hover:text-glow-pink transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">For Creators</a></li>
              <li><a href="/#features" className="text-base font-sans font-medium text-white hover:text-neon-pink hover:text-glow-pink transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Platform Features</a></li>
              <li><a href="/signup" className="text-base font-sans font-medium text-white hover:text-neon-pink hover:text-glow-pink transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Start Creating</a></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="font-display text-base font-semibold uppercase tracking-wide text-acid-lime mb-4 drop-shadow-[0_2px_6px_rgba(200,255,61,0.7)]">
              Legal & Policies
            </h4>
            <ul className="space-y-3">
              <li><a href="/ecosystem" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Ecosystem</a></li>
              <li><a href="/policies" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">All Policies</a></li>
              <li><a href="/policies/privacy" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Privacy Policy</a></li>
              <li><a href="/policies/terms" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Terms of Service</a></li>
              <li><a href="/policies/user-agreement" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">User Agreement</a></li>
              <li><a href="/policies/legal-library" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Legal Library</a></li>
              <li><a href="/policies/compliance-guide" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Compliance Guide</a></li>
              <li><a href="/policies/age-verification" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Age Verification</a></li>
              <li><a href="/policies/compliance-ethics" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Compliance & Ethics</a></li>
              <li><a href="/policies/dmca" className="text-base font-sans font-medium text-white hover:text-acid-lime hover:text-glow-lime transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">DMCA</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-base font-semibold uppercase tracking-wide text-neon-pink mb-4 drop-shadow-[0_2px_6px_rgba(255,45,161,0.7)]">
              Resources
            </h4>
            <ul className="space-y-3">
              <li><a href="/policies/healthcare-resources" className="text-base font-sans font-medium text-white hover:text-neon-pink hover:text-glow-pink transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Healthcare Resources</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-base font-semibold uppercase tracking-wide text-neon-cyan mb-4 drop-shadow-[0_2px_6px_rgba(25,240,255,0.7)]">
              Company
            </h4>
            <ul className="space-y-3">
              <li><a href="/ecosystem" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Ecosystem</a></li>
              <li><a href="/" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">About</a></li>
              <li><a href="mailto:josh@fanzunlimited.com" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Contact</a></li>
              <li><a href="/signup" className="text-base font-sans font-medium text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Join Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neon-pink/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-sans font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            © {new Date().getFullYear()} <span className="text-neon-pink font-bold text-glow-pink">FANZ™ Group Holdings LLC</span>. Creator-owned.
          </p>
          <div className="flex gap-6">
            <a href="/policies/privacy" className="text-sm font-sans font-semibold text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Privacy</a>
            <a href="/policies/terms" className="text-sm font-sans font-semibold text-white hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
