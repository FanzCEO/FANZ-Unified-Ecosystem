import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import ButtonSecondary from '@/components/ButtonSecondary';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function Pricing() {
  const creatorPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Start creating, no strings attached',
      features: [
        'Basic profile & page',
        'Limited streaming (5hrs/month)',
        'Standard community access',
        'Basic analytics',
        'Email support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Creator Pro',
      price: '$29',
      period: 'per month',
      description: 'Full creator toolkit',
      features: [
        'Unlimited HD streaming',
        'Near By Me geolocation',
        'Media protection (Poizen)',
        'Advanced analytics',
        'Priority support',
        'Cross-platform ads (1/month)',
        'RecoveryFanz premium',
        'Custom branding'
      ],
      cta: 'Go Pro',
      popular: true
    },
    {
      name: 'Creator Elite',
      price: '$99',
      period: 'per month',
      description: 'For top-tier creators',
      features: [
        'Everything in Creator Pro',
        '4K streaming',
        'Multi-streaming',
        'White-label option',
        'API access',
        'Cross-platform ads (unlimited)',
        'Dedicated account manager',
        'Legal protection coverage',
        'Early feature access'
      ],
      cta: 'Go Elite',
      popular: false
    }
  ];

  const fanzPlans = [
    {
      name: 'Free Fanz',
      price: '$0',
      period: 'forever',
      description: 'Browse and discover',
      features: [
        'Follow unlimited creators',
        'Free content access',
        'Basic chat',
        'Community forums',
        'RecoveryFanz access'
      ],
      cta: 'Join Free',
      popular: false
    },
    {
      name: 'Premium Fanz',
      price: '$9.99',
      period: 'per month',
      description: 'Enhanced fan experience',
      features: [
        'Everything in Free',
        'Ad-free browsing',
        'HD streaming access',
        'Priority chat with creators',
        'Exclusive content badges',
        'Early access to drops',
        'Premium RecoveryFanz features',
        'Discounts on subscriptions'
      ],
      cta: 'Go Premium',
      popular: true
    },
    {
      name: 'VIP Fanz',
      price: '$24.99',
      period: 'per month',
      description: 'Ultimate superfan status',
      features: [
        'Everything in Premium',
        '4K streaming access',
        'VIP badge across platform',
        'Near By Me premium filters',
        'Exclusive VIP events',
        'Priority customer support',
        'Creator collaboration opportunities',
        'Network-wide recognition'
      ],
      cta: 'Go VIP',
      popular: false
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
            <BadgeUnderground className="mb-6">Memberships</BadgeUnderground>
            <h1 className="font-display text-6xl md:text-8xl text-glow neon-stroke animate-flicker mb-6">
              Choose Your Path
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
              Whether you're creating content or supporting creators, we've got membership tiers that unlock the full FANZ ecosystem.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      {/* Creator Memberships */}
      <section className="relative bg-ink-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 mb-4">
              For Creators
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
              Creator Memberships
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Access premium tools to build, grow, and monetize. Keep 100% of your earnings—always.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {creatorPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl backdrop-blur-xs ${
                  plan.popular
                    ? 'bg-ink-900/70 border-2 border-neon-pink shadow-neon'
                    : 'bg-ink-900/50 border border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <BadgeUnderground className="bg-neon-pink text-ink-900">Most Popular</BadgeUnderground>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-display text-glow">{plan.price}</span>
                    <span className="text-steel-300 text-sm font-mono ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-acid-lime text-lg">✓</span>
                      <span className="text-steel-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.popular ? (
                  <ButtonPrimary href="/signup" className="w-full justify-center">
                    {plan.cta}
                  </ButtonPrimary>
                ) : (
                  <ButtonSecondary href="/signup" className="w-full justify-center">
                    {plan.cta}
                  </ButtonSecondary>
                )}
              </div>
            ))}
          </div>

          {/* Creator Benefits */}
          <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10">
            <h3 className="font-display text-2xl text-white text-center mb-6">
              All Creator Memberships Include
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-4xl mb-2">💰</p>
                <p className="text-steel-300 font-mono text-sm">Keep 100% Revenue</p>
              </div>
              <div>
                <p className="text-4xl mb-2">🔒</p>
                <p className="text-steel-300 font-mono text-sm">Media Protection</p>
              </div>
              <div>
                <p className="text-4xl mb-2">📊</p>
                <p className="text-steel-300 font-mono text-sm">Real-Time Analytics</p>
              </div>
              <div>
                <p className="text-4xl mb-2">🌐</p>
                <p className="text-steel-300 font-mono text-sm">Global Reach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fanz Memberships */}
      <section className="relative bg-ink-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-[11px] tracking-widest uppercase text-steel-300 mb-4">
              For Fanz
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-white mb-4">
              Fanz Memberships
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Unlock premium features, exclusive content, and VIP access across the entire FANZ ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {fanzPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl backdrop-blur-xs ${
                  plan.popular
                    ? 'bg-ink-800/70 border-2 border-neon-cyan shadow-neon'
                    : 'bg-ink-800/50 border border-white/10'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <BadgeUnderground className="bg-neon-cyan text-ink-900">Best Value</BadgeUnderground>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-display text-glow">{plan.price}</span>
                    <span className="text-steel-300 text-sm font-mono ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-600">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-neon-cyan text-lg">✓</span>
                      <span className="text-steel-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.popular ? (
                  <ButtonPrimary href="/signup" className="w-full justify-center">
                    {plan.cta}
                  </ButtonPrimary>
                ) : (
                  <ButtonSecondary href="/signup" className="w-full justify-center">
                    {plan.cta}
                  </ButtonSecondary>
                )}
              </div>
            ))}
          </div>

          {/* Fanz Benefits */}
          <div className="p-8 rounded-2xl bg-ink-800/50 border border-white/10">
            <h3 className="font-display text-2xl text-white text-center mb-6">
              Premium Fanz Ecosystem Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-4xl mb-2">🎥</p>
                <p className="text-steel-300 font-mono text-sm">Exclusive Streams</p>
              </div>
              <div>
                <p className="text-4xl mb-2">💬</p>
                <p className="text-steel-300 font-mono text-sm">Priority Access</p>
              </div>
              <div>
                <p className="text-4xl mb-2">🎁</p>
                <p className="text-steel-300 font-mono text-sm">Special Perks</p>
              </div>
              <div>
                <p className="text-4xl mb-2">⭐</p>
                <p className="text-steel-300 font-mono text-sm">VIP Recognition</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="relative bg-ink-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
              Why FANZ Is Different
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-infra-500/30">
              <p className="text-steel-300 font-mono text-sm mb-4">Other Platforms</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-infra-500 text-lg">✗</span>
                  <span className="text-steel-300 text-sm">Take 20-30% of your earnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-infra-500 text-lg">✗</span>
                  <span className="text-steel-300 text-sm">Control your content</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-infra-500 text-lg">✗</span>
                  <span className="text-steel-300 text-sm">Hidden fees everywhere</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-infra-500 text-lg">✗</span>
                  <span className="text-steel-300 text-sm">Ban you without warning</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-acid-lime/30 relative">
              <div className="absolute inset-0 bg-grad-lime opacity-5 rounded-2xl"></div>
              <p className="text-steel-300 font-mono text-sm mb-4 relative z-10">FANZ Unlimited</p>
              <ul className="space-y-3 relative z-10">
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-lg">✓</span>
                  <span className="text-white text-sm font-display">Keep 100% of earnings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-lg">✓</span>
                  <span className="text-white text-sm font-display">You own your content</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-lg">✓</span>
                  <span className="text-white text-sm font-display">Transparent pricing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-acid-lime text-lg">✓</span>
                  <span className="text-white text-sm font-display">Creator sovereignty</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-ink-900 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.03]" style={{ backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-5xl md:text-7xl text-glow mb-6">
            Join the Movement
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Creator or fan—there's a place for you in the FANZ ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ButtonPrimary href="/signup">
              Become a Creator
            </ButtonPrimary>
            <ButtonSecondary href="/signup">
              Join as a Fanz
            </ButtonSecondary>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
