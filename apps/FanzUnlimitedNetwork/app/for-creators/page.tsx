import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import CardGlass from '@/components/CardGlass';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function ForCreators() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">For Creators</BadgeUnderground>
            <h1 className="font-display text-6xl md:text-8xl text-glow neon-stroke animate-flicker mb-6">
              Your Platform.<br/>Your Rules.
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
              Everything you need to build, grow, and monetize your creator business. No corporate overlords. No hidden fees. Just pure creative freedom.
            </p>
            <div className="mt-10">
              <ButtonPrimary href="/signup">
                Start Creating Free
              </ButtonPrimary>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      {/* Live Streaming */}
      <section className="relative bg-ink-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 mb-4">
                Live Streaming
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
                Go Live.<br/>Get Paid.
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Cash in on every streaming minute. Interactive features, full HD quality, zero platform cuts. Your stream, your revenue.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">🎥</span>
                  <div>
                    <p className="text-white font-display">HD Live Streaming</p>
                    <p className="text-sm text-slate-600">Crystal clear quality, professional tools</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">💵</span>
                  <div>
                    <p className="text-white font-display">Minute-by-Minute Monetization</p>
                    <p className="text-sm text-slate-600">Earn from every second you stream</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-pink text-xl">🎮</span>
                  <div>
                    <p className="text-white font-display">Interactive Features</p>
                    <p className="text-sm text-slate-600">Lovense integration, polls, reactions</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 backdrop-blur-xs">
              <div className="aspect-video bg-ink-800 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-neon-cyan/20 mx-auto mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-neon-cyan animate-pulse"></div>
                  </div>
                  <p className="text-steel-300 font-mono text-sm">LIVE NOW</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-steel-300 text-sm font-mono">Viewers</p>
                  <p className="text-2xl font-display text-white">2,847</p>
                </div>
                <div>
                  <p className="text-steel-300 text-sm font-mono">Earnings (Today)</p>
                  <p className="text-2xl font-display text-acid-lime">$342</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Near By Me */}
      <section className="relative bg-ink-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 p-8 rounded-2xl bg-ink-800/50 border border-white/10 backdrop-blur-xs">
              <div className="aspect-square bg-ink-900 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20"></div>
                <div className="relative z-10 text-center">
                  <p className="text-6xl mb-4">📍</p>
                  <p className="text-white font-display text-xl">Near By Me</p>
                  <p className="text-steel-300 text-sm font-mono mt-2">Find creators in your area</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-white font-display">2.3mi</p>
                  <p className="text-xs text-steel-400 font-mono">Away</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 text-center">
                  <p className="text-white font-display">45</p>
                  <p className="text-xs text-steel-400 font-mono">Nearby</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 mb-4">
                Geolocation
              </span>
              <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
                Build Local.<br/>Connect Real.
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Near By Me connects you with fans in your area. Build local communities, meet in real life, create authentic connections.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-neon-pink text-xl">📍</span>
                  <div>
                    <p className="text-white font-display">Location-Based Discovery</p>
                    <p className="text-sm text-slate-600">Fans find you, you find fans</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">🌐</span>
                  <div>
                    <p className="text-white font-display">Privacy Controls</p>
                    <p className="text-sm text-slate-600">You control who sees your location</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">🤝</span>
                  <div>
                    <p className="text-white font-display">Local Events</p>
                    <p className="text-sm text-slate-600">Host meetups, collabs, IRL experiences</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Media Protection */}
      <section className="relative bg-ink-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 mb-4">
              Security
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
              Your Content.<br/>Locked Down.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Partnership with MojoSign and Ghost Army. Every piece of media gets a Poizen forensic signature. Theft detection, watermarking, legal protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CardGlass
              title="Forensic Signatures"
              description="Every image, every video gets unique Poizen watermarking. Track your content across the internet."
            >
              <div className="mt-4">
                <span className="text-xs text-steel-400 font-mono">🔒 MojoSign Powered</span>
              </div>
            </CardGlass>

            <CardGlass
              title="Theft Detection"
              description="Ghost Army monitors for unauthorized use. Automated DMCA takedowns, legal support included."
            >
              <div className="mt-4">
                <span className="text-xs text-steel-400 font-mono">⚡ Auto-Protection</span>
              </div>
            </CardGlass>

            <CardGlass
              title="Legal Backup"
              description="Full legal support when your content is stolen. We fight for you, covered in your membership."
            >
              <div className="mt-4">
                <span className="text-xs text-steel-400 font-mono">⚖️ Legal Shield</span>
              </div>
            </CardGlass>
          </div>
        </div>
      </section>

      {/* Cross-Platform Advertising */}
      <section className="relative bg-ink-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
              Advertise Everywhere
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Purchase or earn ad space across the entire FANZ network. Boost your visibility, grow your audience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Homepage Takeover', price: '$500/day' },
              { name: 'Featured Creator', price: '$200/week' },
              { name: 'Stream Promotion', price: '$100/stream' },
              { name: 'Community Spotlight', price: 'Earned' }
            ].map((ad, i) => (
              <div key={i} className="p-6 rounded-xl bg-ink-800/50 border border-white/10 text-center hover:border-neon-pink/50 transition">
                <div className="w-16 h-16 rounded-full bg-grad-brand mx-auto mb-4"></div>
                <p className="font-display text-white mb-2">{ad.name}</p>
                <p className="text-acid-lime font-mono text-sm">{ad.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-ink-800 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.03]" style={{ backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-5xl md:text-7xl text-glow mb-6">
            Ready to Own It?
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Join creators who keep 100% and answer to no one.
          </p>
          <ButtonPrimary href="/signup">
            Start Creating Free
          </ButtonPrimary>
        </div>
      </section>

      <Footer />
    </main>
  );
}
