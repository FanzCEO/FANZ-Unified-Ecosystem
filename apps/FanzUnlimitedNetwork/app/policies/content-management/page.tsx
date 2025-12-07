import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function ContentManagementPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Legal</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Content Management Policy
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective: October 24, 2024 | Updated: January 1, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Purpose & Scope</h2>
              <p className="text-steel-300 mb-4">
                This policy establishes comprehensive guidelines for content creation, moderation, and management across the FANZ Unlimited Network (FUN) L.L.C.™ platform.
              </p>
              <p className="text-steel-300">
                Our content management framework ensures legal compliance, creator protection, and community safety while maintaining the platform's underground, unapologetic ethos.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Content Submission Requirements</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Age Verification</h3>
                  <p>All content creators must complete age verification (18+) before publishing content. Compliance with 18 U.S.C. § 2257 is mandatory.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Content Ownership</h3>
                  <p>Creators retain 100% ownership of their content. FANZ holds a non-exclusive license to host, display, and distribute content on the platform.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Prohibited Content</h3>
                  <ul className="space-y-2 mt-2 ml-4">
                    <li>• Content involving minors or individuals appearing to be minors</li>
                    <li>• Non-consensual content or deepfakes</li>
                    <li>• Content promoting illegal activities</li>
                    <li>• Hate speech, harassment, or violent threats</li>
                    <li>• Content violating intellectual property rights</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Content Moderation Process</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Automated Screening</h3>
                  <p>All uploaded content undergoes AI-powered screening for prohibited material before publication.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Human Review</h3>
                  <p>Flagged content is reviewed by trained moderation staff within 24-48 hours.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Creator Appeals</h3>
                  <p>Creators may appeal content removal decisions within 14 days. Appeals are reviewed by senior moderation team.</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Media Protection</h2>
              <p className="text-steel-300 mb-4">
                FANZ employs multi-layered content protection technology:
              </p>
              <ul className="space-y-2 text-steel-300">
                <li>• <span className="text-white font-display">MojoSign™</span> - Invisible watermarking for leak tracing</li>
                <li>• <span className="text-white font-display">Ghost Army™</span> - Automated DMCA takedown coordination</li>
                <li>• <span className="text-white font-display">Poizen™</span> - Content encryption and DRM</li>
                <li>• <span className="text-white font-display">Screen capture prevention</span> - Technical safeguards against recording</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Violation Consequences</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Offense</th>
                      <th className="pb-3 text-white font-display">First Violation</th>
                      <th className="pb-3 text-white font-display">Repeat Violation</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">Minor Policy Breach</td>
                      <td className="py-3">Warning + Content Removal</td>
                      <td className="py-3">14-day suspension</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Major Policy Breach</td>
                      <td className="py-3">30-day suspension</td>
                      <td className="py-3">Permanent ban</td>
                    </tr>
                    <tr>
                      <td className="py-3">Illegal Content</td>
                      <td className="py-3">Immediate ban + law enforcement referral</td>
                      <td className="py-3">N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Data Retention</h2>
              <p className="text-steel-300 mb-4">
                Content and associated metadata retention periods:
              </p>
              <ul className="space-y-2 text-steel-300">
                <li>• Active content: Stored indefinitely while account is active</li>
                <li>• Deleted content: 30-day retention for recovery, then permanent deletion</li>
                <li>• Moderation records: 5 years for compliance purposes</li>
                <li>• Age verification records: 7 years per federal requirements</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30">
              <h2 className="font-display text-3xl text-white mb-4">Questions or Appeals</h2>
              <p className="text-steel-300 mb-4">
                For content policy questions or to appeal a moderation decision:
              </p>
              <a
                href="mailto:moderation@fanzunlimited.com"
                className="text-neon-pink font-mono hover:text-glow transition"
              >
                moderation@fanzunlimited.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
