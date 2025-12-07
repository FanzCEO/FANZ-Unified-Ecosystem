import React from 'react';
import BadgeUnderground from './BadgeUnderground';

export default function Footer() {
  return (
    <footer className="relative bg-ink-900 border-t border-neon-pink/20">
      {/* Animated top border */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-neon-pink via-neon-cyan to-transparent opacity-50"></div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="relative group">
            <a
              href="/"
              className="font-display text-3xl text-glow-pink neon-stroke-pink mb-4 inline-block hover:text-glow-cyan transition-all duration-300 hover:scale-110"
            >
              FANZ
              <span className="absolute -inset-2 bg-neon-pink/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg -z-10"></span>
            </a>
            <p className="text-sm text-steel-300">
              Creator-owned platform. Underground. Unapologetic.
            </p>
            <div className="mt-4">
              <BadgeUnderground>Beta Access</BadgeUnderground>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-neon-cyan mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              <li><a href="/for-creators" className="text-sm text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">Features</a></li>
              <li><a href="/pricing" className="text-sm text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">Pricing</a></li>
              <li><a href="/how-it-works" className="text-sm text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">How It Works</a></li>
            </ul>
          </div>

          {/* Creators */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-neon-pink mb-4">
              Creators
            </h4>
            <ul className="space-y-2">
              <li><a href="/for-creators" className="text-sm text-steel-300 hover:text-neon-pink hover:text-glow-pink transition-all duration-300">For Creators</a></li>
              <li><a href="/#features" className="text-sm text-steel-300 hover:text-neon-pink hover:text-glow-pink transition-all duration-300">Platform Features</a></li>
              <li><a href="/signup" className="text-sm text-steel-300 hover:text-neon-pink hover:text-glow-pink transition-all duration-300">Start Creating</a></li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-acid-lime mb-4">
              Legal & Policies
            </h4>
            <ul className="space-y-2">
              <li><a href="/policies" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">All Policies</a></li>
              <li><a href="/policies/privacy" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">Privacy Policy</a></li>
              <li><a href="/policies/terms" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">Terms of Service</a></li>
              <li><a href="/policies/user-agreement" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">User Agreement</a></li>
              <li><a href="/policies/legal-library" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">Legal Library</a></li>
              <li><a href="/policies/compliance-guide" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">Compliance Guide</a></li>
              <li><a href="/policies/age-verification" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">Age Verification</a></li>
              <li><a href="/policies/compliance-ethics" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">Compliance & Ethics</a></li>
              <li><a href="/policies/dmca" className="text-sm text-steel-300 hover:text-acid-lime hover:text-glow-lime transition-all duration-300">DMCA</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-neon-pink mb-4">
              Resources
            </h4>
            <ul className="space-y-2">
              <li><a href="/policies/healthcare-resources" className="text-sm text-steel-300 hover:text-neon-pink hover:text-glow-pink transition-all duration-300">Healthcare Resources</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-sm uppercase tracking-wider text-neon-cyan mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-sm text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">About</a></li>
              <li><a href="mailto:josh@fanzunlimited.com" className="text-sm text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">Contact</a></li>
              <li><a href="/signup" className="text-sm text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">Join Us</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neon-pink/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-steel-300 font-mono">
            © {new Date().getFullYear()} <span className="text-neon-pink">FANZ™ Group Holdings LLC</span>. Creator-owned.
          </p>
          <div className="flex gap-4">
            <a href="/policies/privacy" className="text-xs text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">Privacy</a>
            <a href="/policies/terms" className="text-xs text-steel-300 hover:text-neon-cyan hover:text-glow-cyan transition-all duration-300">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
