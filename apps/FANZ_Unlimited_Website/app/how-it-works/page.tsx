import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Sign Up Free',
      description: 'Create your account in 60 seconds. No credit card required to start.',
      features: ['Choose your username', 'Set up your profile', 'Verify your identity']
    },
    {
      number: '02',
      title: 'Build Your Hub',
      description: 'Customize your creator page. Add your content, set your prices, connect payment.',
      features: ['Upload content', 'Set subscription tiers', 'Connect bank/crypto wallet']
    },
    {
      number: '03',
      title: 'Go Live & Earn',
      description: 'Start streaming, posting, connecting. Fans subscribe, you get paid directly.',
      features: ['Stream in HD', 'Post exclusive content', 'Chat with fans']
    },
    {
      number: '04',
      title: 'Get Paid Instantly',
      description: 'Money hits your account immediately. No waiting, no platform holds.',
      features: ['Direct deposits', 'Real-time earnings', '100% of revenue']
    }
  ];

  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">How It Works</BadgeUnderground>
            <h1 className="font-display text-6xl md:text-8xl text-glow neon-stroke animate-flicker mb-6">
              Simple AF
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
              Four steps from signup to paycheck. No corporate BS, no complicated onboarding. Just create, connect, and get paid.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      {/* Steps */}
      <section className="relative bg-ink-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="space-y-24">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 mb-4">
                    Step {step.number}
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
                    {step.title}
                  </h2>
                  <p className="text-lg text-slate-600 mb-6">
                    {step.description}
                  </p>
                  <ul className="space-y-3">
                    {step.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-acid-lime text-xl">→</span>
                        <span className="text-steel-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                  <div className="relative p-8 rounded-2xl bg-ink-900/50 border border-white/10 backdrop-blur-xs">
                    <div className="absolute top-4 right-4">
                      <span className="text-8xl font-display text-glow opacity-20">
                        {step.number}
                      </span>
                    </div>
                    <div className="aspect-square bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-6xl mb-4">
                          {index === 0 && '📝'}
                          {index === 1 && '🎨'}
                          {index === 2 && '🎥'}
                          {index === 3 && '💰'}
                        </p>
                        <p className="text-white font-display text-xl">{step.title}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Breakdown */}
      <section className="relative bg-ink-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              All tools included. No extra costs, no surprise fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎥', name: 'HD Streaming', desc: 'Broadcast in high quality' },
              { icon: '💬', name: 'Direct Chat', desc: 'Talk to your community' },
              { icon: '📊', name: 'Analytics', desc: 'Track your growth' },
              { icon: '🔒', name: 'Media Protection', desc: 'Poizen signatures' },
              { icon: '📍', name: 'Near By Me', desc: 'Geolocation features' },
              { icon: '💰', name: 'Direct Payouts', desc: '100% to you' },
              { icon: '📢', name: 'Advertising', desc: 'Promote across network' },
              { icon: '🌐', name: 'RecoveryFanz', desc: 'Free community access' }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-ink-800/50 border border-white/10 text-center hover:border-neon-pink/50 transition"
              >
                <p className="text-4xl mb-3">{feature.icon}</p>
                <p className="font-display text-white mb-1">{feature.name}</p>
                <p className="text-xs text-slate-600">{feature.desc}</p>
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
            Start in Minutes
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            No complicated setup. Just sign up and start creating.
          </p>
          <ButtonPrimary href="/signup">
            Create Your Account
          </ButtonPrimary>
        </div>
      </section>

      <Footer />
    </main>
  );
}
