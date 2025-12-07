import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function StarzRulesPage() {
  const policies = [
    {
      title: 'Compliance Guide for Starz & Fanz',
      description: 'Complete creator compliance roadmap: account setup, taxes, content requirements, payouts, and safety',
      href: '/policies/compliance-guide',
      icon: '⭐'
    }
  ];

  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <a href="/policies" className="inline-block mb-6 text-neon-cyan hover:text-glow transition font-mono text-sm">
              ← Back to All Policies
            </a>
            <BadgeUnderground className="mb-6">⭐ Creator Resources</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Starz & Co-Starz Guidez and Rulez
            </h1>
            <p className="text-steel-300 max-w-3xl mx-auto">
              Guidelines, compliance resources, and best practices for creators and collaborators
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 gap-6">
            {policies.map((policy, index) => (
              <a
                key={index}
                href={policy.href}
                className="group p-8 rounded-2xl bg-ink-900/50 border border-white/10 backdrop-blur-xs hover:border-acid-lime/50 transition"
              >
                <div className="flex items-start gap-6">
                  <span className="text-5xl">{policy.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl text-white mb-2 group-hover:text-glow transition">
                      {policy.title}
                    </h3>
                    <p className="text-steel-300">{policy.description}</p>
                  </div>
                  <span className="text-acid-lime opacity-0 group-hover:opacity-100 transition text-2xl">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
