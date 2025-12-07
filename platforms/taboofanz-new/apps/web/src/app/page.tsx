import Link from 'next/link';
import { ArrowRight, Shield, Eye, Sparkles, Lock, Heart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-taboo-bg relative overflow-hidden">
      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-30" />

      {/* Gradient background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-taboo-accent-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-taboo-glitch/20 rounded-full blur-[120px]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-taboo-accent-primary to-taboo-glitch flex items-center justify-center">
            <span className="text-white font-display font-bold text-xl">T</span>
          </div>
          <span className="font-display font-bold text-xl text-white">TabooFanz</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="btn-neon text-sm py-2 px-4"
          >
            Join Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 lg:px-12 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-taboo-surface border border-taboo-border mb-8">
            <span className="w-2 h-2 rounded-full bg-taboo-accent-primary animate-pulse" />
            <span className="text-sm text-white/70">The Shadow Network Awaits</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6">
            <span className="text-gradient">Enter</span> the{' '}
            <span className="relative inline-block">
              <span className="text-glitch" data-text="Taboo">
                Taboo
              </span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-3xl mx-auto mb-12">
            The dark, alt, underground creator platform. A{' '}
            <span className="text-taboo-glitch">consent-first</span> home for
            boundary-pushing creators and fans with alternative aesthetics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup?role=creator"
              className="btn-neon flex items-center gap-2 text-lg"
            >
              Become a Creator
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3 rounded-lg border border-taboo-border text-white hover:bg-taboo-surface transition"
            >
              Explore Creators
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 lg:px-12 py-24 bg-taboo-bg-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Built for the Underground
          </h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-16">
            TabooFanz is designed for creators who don&apos;t fit the mainstream.
            Privacy-first, consent-obsessed, and creator-protective.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Masked Mode */}
            <div className="card-neon p-6">
              <div className="w-12 h-12 rounded-lg bg-taboo-accent-primary/20 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-taboo-accent-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Masked Creator Mode
              </h3>
              <p className="text-white/60 text-sm">
                Never show your face. Auto-blur backgrounds, face detection warnings,
                and complete alias protection. Your identity, your control.
              </p>
            </div>

            {/* Feature 2: Consent Toolkit */}
            <div className="card-neon p-6">
              <div className="w-12 h-12 rounded-lg bg-taboo-glitch/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-taboo-glitch" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Consent & Boundaries
              </h3>
              <p className="text-white/60 text-sm">
                Set clear boundaries. Fans see &quot;Respect the Boundaries&quot; guidelines.
                Collaboration consent flows built-in.
              </p>
            </div>

            {/* Feature 3: Archetype System */}
            <div className="card-neon p-6">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Taboo Archetypes
              </h3>
              <p className="text-white/60 text-sm">
                Build your persona. The Siren, The Phantom, The Rebel, The Enigma...
                Archetypes drive discovery and visual identity.
              </p>
            </div>

            {/* Feature 4: Region Blocking */}
            <div className="card-neon p-6">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Region & IP Blocking
              </h3>
              <p className="text-white/60 text-sm">
                Block specific countries, states, or regions. Control exactly who
                can access your content. Your safety, your rules.
              </p>
            </div>

            {/* Feature 5: Alt Discovery */}
            <div className="card-neon p-6">
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Alt-Friendly Discovery
              </h3>
              <p className="text-white/60 text-sm">
                Find creators by vibe: goth, punk, cyberpunk, power dynamics,
                masked personas. The algorithm respects your comfort.
              </p>
            </div>

            {/* Feature 6: Creator-First */}
            <div className="card-neon p-6">
              <div className="w-12 h-12 rounded-lg bg-taboo-success/20 flex items-center justify-center mb-4">
                <span className="text-taboo-success font-bold text-xl">80%</span>
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                Creator-First Earnings
              </h3>
              <p className="text-white/60 text-sm">
                Keep 80% of what you earn. Low fees, transparent payouts,
                and a platform that actually respects your work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Archetypes Showcase */}
      <section className="relative z-10 px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Find Your Archetype
          </h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-16">
            Every creator has a persona. Choose yours and let fans discover you
            by the energy you bring.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'The Siren', class: 'badge-archetype-siren' },
              { name: 'The Phantom', class: 'badge-archetype-phantom' },
              { name: 'The Rebel', class: 'badge-archetype-rebel' },
              { name: 'The Doll', class: 'badge-archetype-doll' },
              { name: 'The Beast', class: 'badge-archetype-beast' },
              { name: 'The Enigma', class: 'badge-archetype-enigma' },
              { name: 'The Oracle', class: 'badge-archetype-oracle' },
              { name: 'The Switch', class: 'badge-archetype-switch' },
              { name: 'The Sovereign', class: 'badge-archetype-sovereign' },
            ].map((archetype) => (
              <span
                key={archetype.name}
                className={`badge-archetype ${archetype.class} text-sm`}
              >
                {archetype.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 lg:px-12 py-24 bg-gradient-to-b from-taboo-bg to-taboo-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to embrace the <span className="text-gradient">darkness</span>?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join the shadow network. Create without limits. Connect with fans who
            truly understand.
          </p>
          <Link href="/signup" className="btn-neon inline-flex items-center gap-2 text-lg">
            Create Your Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-12 border-t border-taboo-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-taboo-accent-primary to-taboo-glitch flex items-center justify-center">
                <span className="text-white font-display font-bold">T</span>
              </div>
              <span className="font-display font-bold text-white">TabooFanz</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/50">
              <Link href="/legal/terms" className="hover:text-white transition">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="/legal/2257" className="hover:text-white transition">
                18 U.S.C. 2257
              </Link>
              <Link href="/support" className="hover:text-white transition">
                Support
              </Link>
            </div>

            <p className="text-sm text-white/30">
              &copy; {new Date().getFullYear()} TabooFanz. Part of the FANZ Ecosystem.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
