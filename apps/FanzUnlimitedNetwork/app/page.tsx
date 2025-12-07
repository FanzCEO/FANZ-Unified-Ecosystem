import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import ButtonSecondary from '@/components/ButtonSecondary';
import CardGlass from '@/components/CardGlass';
import BadgeUnderground from '@/components/BadgeUnderground';
import BrandsCarousel3D from '@/components/BrandsCarousel3D';
import TheatricalRibbons from '@/components/TheatricalRibbons';

export default function Home() {
  return (
    <main className="min-h-screen bg-ink-900">
      <TheatricalRibbons />
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="absolute inset-0 bg-grid opacity-[.05]"></div>
        <div className="absolute inset-0 gradient-overlay-cyber"></div>
        <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Creator-Owned Platform</BadgeUnderground>
            <h1 className="font-display text-6xl md:text-9xl text-glow-pink neon-stroke-pink animate-flicker mb-6">
              FANZ UNLIMITED
            </h1>
            <p className="text-2xl md:text-3xl text-white mb-4 font-display">
              Your Community <span className="text-neon-pink">•</span> Your Freedom <span className="text-neon-cyan">•</span> Your Connection
            </p>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-steel-300">
              The underground creator platform built for sovereignty. Stream, monetize, connect—100% on your terms. No corporate BS, no hidden fees, no censorship.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonPrimary href="/signup">
                Start Creating Now
              </ButtonPrimary>
              <ButtonSecondary href="/how-it-works">
                See How It Works
              </ButtonSecondary>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime"></div>
        <div className="pointer-events-none absolute inset-0 crt-scan"></div>
        <div className="pointer-events-none absolute inset-0 scanlines opacity-10"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative bg-ink-800 py-24">
        <div className="absolute inset-0 bg-grid-small opacity-[.02]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-neon-cyan mb-4">
              Platform Features
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-white text-glow mb-4">
              Built Different
            </h2>
            <p className="text-lg text-steel-300 max-w-2xl mx-auto">
              Everything you need to own your creator business—no middlemen, no compromises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CardGlass
              title="Live Streaming"
              description="Go live, cash in on streaming minutes. Interactive features with full creator control."
            >
              <div className="mt-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                <span className="text-xs text-steel-400 font-mono">LIVE NOW</span>
              </div>
            </CardGlass>

            <CardGlass
              title="Near By Me"
              description="Geolocation feature connects creators with fans in their area. Build local communities."
            >
              <div className="mt-4">
                <span className="text-xs text-steel-400 font-mono">📍 Location-Based Discovery</span>
              </div>
            </CardGlass>

            <CardGlass
              title="Media Protection"
              description="Content Defense with Poizen™ forensic signatures. Your content, secured."
            >
              <div className="mt-4">
                <span className="text-xs text-neon-pink font-mono">🔒 Poizen Protected</span>
              </div>
            </CardGlass>
          </div>
        </div>
      </section>

      {/* FANZ Network Brands Carousel */}
      <BrandsCarousel3D />

      {/* Monetization Section */}
      <section className="relative bg-ink-900 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-acid-lime mb-4">
                Keep 100%
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-white text-glow mb-6">
                Direct Payouts.<br/>Zero Platform Fees.
              </h2>
              <p className="text-lg text-steel-300 mb-6">
                Your fans pay you directly. No corporate cuts. No waiting periods. Your money, your account, instant access.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">⚡</span>
                  <div>
                    <p className="text-white font-display">Subscription Revenue</p>
                    <p className="text-sm text-slate-600">Set your own prices, keep everything</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">💰</span>
                  <div>
                    <p className="text-white font-display">Tips & Donations</p>
                    <p className="text-sm text-slate-600">Direct fan support, zero middlemen</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-pink text-xl">📺</span>
                  <div>
                    <p className="text-white font-display">Streaming Minutes</p>
                    <p className="text-sm text-slate-600">Monetize every second you stream</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="p-8 rounded-3xl bg-ink-800/80 border-2 border-neon-pink/30 backdrop-blur-md shadow-[0_0_40px_rgba(255,45,161,0.2)] hover:shadow-[0_0_60px_rgba(255,45,161,0.4)] transition-all duration-300">
                <div className="absolute inset-0 gradient-overlay-pink rounded-3xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <p className="text-sm text-neon-cyan font-mono mb-2 uppercase tracking-wider">Your Earnings This Month</p>
                    <p className="text-7xl font-display text-glow-pink animate-pulse-glow">$12,847</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-neon-pink/20 hover:border-neon-pink/50 transition-colors">
                      <span className="text-sm text-steel-300">Subscriptions</span>
                      <span className="text-white font-display text-neon-pink">$8,200</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-neon-cyan/20 hover:border-neon-cyan/50 transition-colors">
                      <span className="text-sm text-steel-300">Tips</span>
                      <span className="text-white font-display text-neon-cyan">$3,450</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-acid-lime/20 hover:border-acid-lime/50 transition-colors">
                      <span className="text-sm text-steel-300">Streaming</span>
                      <span className="text-white font-display text-acid-lime">$1,197</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-lg bg-acid-lime/10 border-2 border-acid-lime/50 glow-box-lime">
                    <p className="text-xs text-steel-300 font-mono mb-1 uppercase">Platform Fee</p>
                    <p className="text-3xl font-display text-acid-lime text-glow-lime">$0.00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Platform Advertising */}
      <section className="relative bg-ink-800 py-24">
        <div className="absolute inset-0 bg-grid-small opacity-[.02]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white text-glow mb-4">
              Cross-Platform Advertising
            </h2>
            <p className="text-lg text-steel-300 max-w-2xl mx-auto">
              Purchase or earn ad space across the network. Your content, everywhere.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {['Homepage Takeover', 'Featured Creator', 'Stream Promotion', 'Community Spotlight'].map((type, i) => (
              <div key={i} className="group p-6 rounded-xl bg-ink-900/50 border border-white/10 hover:border-neon-cyan/50 text-center transition-all duration-300 hover-lift">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-pink via-neon-cyan to-acid-lime mx-auto mb-4 group-hover:shadow-[0_0_30px_rgba(255,45,161,0.6)] transition-all duration-300 animate-rotate-gradient"></div>
                <p className="font-display text-white group-hover:text-glow-cyan transition">{type}</p>
                <p className="text-xs text-steel-400 mt-2 font-mono group-hover:text-neon-cyan transition">Boost Visibility</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RecoveryFanz Community */}
      <section className="relative bg-ink-900 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.03]"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="p-12 rounded-3xl bg-ink-800/80 border-2 border-acid-lime/30 backdrop-blur-md shadow-[0_0_40px_rgba(200,255,61,0.2)] text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-acid-lime/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <BadgeUnderground className="mb-4">Free Community</BadgeUnderground>
              <h2 className="font-display text-4xl md:text-6xl text-white text-glow-lime mb-4">
                RecoveryFanz
              </h2>
              <p className="text-lg text-steel-300 max-w-2xl mx-auto mb-8">
                Free-to-use social community for all walks of life. No judgment, just connection.
              </p>
              <ButtonSecondary href="https://recoveryfanz.com">
                Join RecoveryFanz
              </ButtonSecondary>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative bg-ink-800 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.05]"></div>
        <div className="absolute inset-0 gradient-overlay-cyber"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-5xl md:text-8xl text-glow-pink neon-stroke-pink animate-flicker mb-6">
            Own Your World
          </h2>
          <p className="text-xl text-steel-300 mb-10">
            Join creators who refuse to be <span className="text-neon-cyan">platforms' products</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonPrimary href="/signup">
              Start Creating Free
            </ButtonPrimary>
            <ButtonSecondary href="/pricing">
              View Pricing
            </ButtonSecondary>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-neon-pink via-neon-cyan to-acid-lime"></div>
      </section>

      <Footer />
    </main>
  );
}
