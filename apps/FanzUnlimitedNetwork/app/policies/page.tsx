import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function Policies() {
  const categories = [
    {
      name: 'Legal and Compliance',
      count: 7,
      slug: 'legal-compliance',
      icon: '⚖️',
      description: 'Legal requirements, compliance standards, and regulatory policies'
    },
    {
      name: 'Moderation, Data, Storage',
      count: 3,
      slug: 'moderation',
      icon: '🛡️',
      description: 'Content moderation guidelines and data protection policies'
    },
    {
      name: 'About Us',
      count: 2,
      slug: 'about',
      icon: '🏢',
      description: 'Company information and mission'
    },
    {
      name: 'User Agreements',
      count: 1,
      slug: 'user-agreements',
      icon: '📝',
      description: 'Terms users agree to when using the platform'
    },
    {
      name: 'DMCA',
      count: 1,
      slug: 'dmca',
      icon: '©️',
      description: 'Copyright infringement and DMCA takedown procedures'
    },
    {
      name: 'Starz and Co-Starz Guidez and Rulez',
      count: 5,
      slug: 'starz-rules',
      icon: '⭐',
      description: 'Guidelines for creators and collaborators'
    },
    {
      name: 'Ethics, Diversity, Inclusion, Compliance',
      count: 1,
      slug: 'ethics',
      icon: '🤝',
      description: 'Ethical standards and diversity policies'
    },
    {
      name: 'Terms and Conditions',
      count: 2,
      slug: 'terms',
      icon: '📋',
      description: 'Platform terms of service'
    },
    {
      name: 'Transactions and Shop',
      count: 2,
      slug: 'transactions',
      icon: '💳',
      description: 'Payment processing and shop policies'
    },
    {
      name: 'Health and Human Resources',
      count: 1,
      slug: 'health',
      icon: '🏥',
      description: 'Health resources and HR policies'
    },
    {
      name: 'Retail SOPs & Policies',
      count: 1,
      slug: 'retail',
      icon: '🏪',
      description: 'Retail standard operating procedures'
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
            <BadgeUnderground className="mb-6">Knowledge Base</BadgeUnderground>
            <h1 className="font-display text-6xl md:text-8xl text-glow neon-stroke animate-flicker mb-6">
              Policies & Legal
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
              Complete documentation on platform policies, legal compliance, user agreements, and operational guidelines.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      {/* Categories Grid */}
      <section className="relative bg-ink-800 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <a
                key={index}
                href={`/policies/${category.slug}`}
                className="group p-8 rounded-2xl bg-ink-900/50 border border-white/10 backdrop-blur-xs hover:border-neon-pink/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-5xl">{category.icon}</span>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-steel-300">
                    {category.count} {category.count === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <h3 className="font-display text-xl text-white mb-2 group-hover:text-glow transition">
                  {category.name}
                </h3>
                <p className="text-sm text-slate-600">{category.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="relative bg-ink-900 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-4">
              Most Viewed Policies
            </h2>
            <p className="text-lg text-slate-600">Quick access to frequently referenced documents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a href="/policies/privacy" className="p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 transition">
              <h3 className="font-display text-lg text-white mb-2">Privacy Policy</h3>
              <p className="text-sm text-slate-600">How we collect, use, and protect your data</p>
            </a>
            <a href="/policies/terms" className="p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 transition">
              <h3 className="font-display text-lg text-white mb-2">Terms of Service</h3>
              <p className="text-sm text-slate-600">Platform usage terms and conditions</p>
            </a>
            <a href="/policies/dmca" className="p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 transition">
              <h3 className="font-display text-lg text-white mb-2">DMCA Policy</h3>
              <p className="text-sm text-slate-600">Copyright infringement reporting procedures</p>
            </a>
            <a href="/policies/age-verification" className="p-6 rounded-xl bg-ink-800/50 border border-white/10 hover:border-neon-cyan/50 transition">
              <h3 className="font-display text-lg text-white mb-2">Age Verification</h3>
              <p className="text-sm text-slate-600">Age verification and compliance requirements</p>
            </a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="relative bg-ink-800 py-24">
        <div className="absolute inset-0 bg-grid opacity-[.03]" style={{ backgroundSize: '32px 32px' }}></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
            Questions About Our Policies?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Contact our support team for clarification or assistance
          </p>
          <a
            href="mailto:support@fanzunlimited.com"
            className="inline-block px-8 py-4 rounded-xl font-display text-steel-300 border border-steel-400/30 bg-white/5 backdrop-blur-xs hover:bg-white/10 transition"
          >
            support@fanzunlimited.com
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
