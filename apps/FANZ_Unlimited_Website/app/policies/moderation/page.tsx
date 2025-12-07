import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function ModerationPage() {
  const policies = [
    {
      title: 'Content Management Policy',
      description: 'Content moderation guidelines and prohibited content standards',
      href: '/policies/content-management',
      icon: '🛡️'
    },
    {
      title: 'Data Collection Policy',
      description: 'How we collect and use your information across platforms',
      href: '/policies/data-collection',
      icon: '📊'
    },
    {
      title: 'Data Management Policy',
      description: '2257 recordkeeping, data security, retention, and user rights',
      href: '/policies/data-management',
      icon: '💾'
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
            <BadgeUnderground className="mb-6">🛡️ Data & Moderation</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Moderation, Data, Storage
            </h1>
            <p className="text-steel-300 max-w-3xl mx-auto">
              Content moderation guidelines and data protection policies
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
                className="group p-8 rounded-2xl bg-ink-900/50 border border-white/10 backdrop-blur-xs hover:border-neon-cyan/50 transition"
              >
                <div className="flex items-start gap-6">
                  <span className="text-5xl">{policy.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl text-white mb-2 group-hover:text-glow transition">
                      {policy.title}
                    </h3>
                    <p className="text-steel-300">{policy.description}</p>
                  </div>
                  <span className="text-neon-cyan opacity-0 group-hover:opacity-100 transition text-2xl">→</span>
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
