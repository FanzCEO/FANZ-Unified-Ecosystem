import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function DataCollectionPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Privacy & Data</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Data Collection Statement
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective: January 1, 2025 | Revised: February 14, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Overview</h2>
              <p className="text-steel-300 mb-4">
                FANZ Unlimited Network (FUN) L.L.C.™ collects and processes data necessary to operate our platform, ensure security, maintain compliance, and provide premium features to creators and fanz.
              </p>
              <p className="text-steel-300">
                This statement outlines what data we collect, why we collect it, how we use it, and your rights regarding your data.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Data We Collect Automatically</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Device & Browser Information</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• IP address and approximate geolocation</li>
                    <li>• Browser type, version, and language settings</li>
                    <li>• Operating system and device type</li>
                    <li>• Screen resolution and viewport size</li>
                    <li>• Unique device identifiers</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Usage Data</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Pages visited and content viewed</li>
                    <li>• Time spent on platform and individual pages</li>
                    <li>• Click patterns and navigation paths</li>
                    <li>• Search queries and filters used</li>
                    <li>• Content interactions (likes, comments, shares)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Performance & Diagnostics</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Page load times and performance metrics</li>
                    <li>• Error logs and crash reports</li>
                    <li>• Network connection quality</li>
                    <li>• Feature usage patterns</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Data You Provide</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Account Information</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Email address and username</li>
                    <li>• Display name and profile bio</li>
                    <li>• Profile photo and banner image</li>
                    <li>• Age verification documents (securely stored, not publicly visible)</li>
                    <li>• Communication preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Creator-Specific Data</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Payment information (processed by Stripe, not stored by FANZ)</li>
                    <li>• Tax information (W-9/W-8 forms for compliance)</li>
                    <li>• Content uploads and metadata</li>
                    <li>• Subscription pricing and tier settings</li>
                    <li>• Analytics preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Communications</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Messages sent to creators or support</li>
                    <li>• Comments and community posts</li>
                    <li>• Support tickets and inquiries</li>
                    <li>• Feedback and survey responses</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">How We Use Your Data</h2>
              <div className="space-y-3 text-steel-300">
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Platform Operation</p>
                    <p>Provide core features, process transactions, deliver content, and maintain account functionality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Security & Fraud Prevention</p>
                    <p>Detect suspicious activity, prevent unauthorized access, combat payment fraud, and enforce platform rules</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Legal Compliance</p>
                    <p>Comply with age verification laws, tax reporting, DMCA requirements, and law enforcement requests</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Product Improvement</p>
                    <p>Analyze usage patterns, test new features, optimize performance, and enhance user experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Communications</p>
                    <p>Send service updates, platform notifications, and optional marketing (you can opt out)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Data Sharing</h2>
              <p className="text-steel-300 mb-4">We share data only when necessary:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Recipient</th>
                      <th className="pb-3 text-white font-display">Data Shared</th>
                      <th className="pb-3 text-white font-display">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">Payment Processors</td>
                      <td className="py-3">Payment details, transaction info</td>
                      <td className="py-3">Process payouts and subscriptions</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Cloud Infrastructure</td>
                      <td className="py-3">Content files, encrypted data</td>
                      <td className="py-3">Storage and delivery (AWS/GCP)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Analytics Partners</td>
                      <td className="py-3">Anonymized usage data</td>
                      <td className="py-3">Performance monitoring</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Verification Services</td>
                      <td className="py-3">ID documents (encrypted)</td>
                      <td className="py-3">Age verification compliance</td>
                    </tr>
                    <tr>
                      <td className="py-3">Law Enforcement</td>
                      <td className="py-3">As legally required</td>
                      <td className="py-3">Valid legal requests only</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-steel-300 mt-4 text-sm italic">
                We NEVER sell your personal data to third parties. Ever.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Cookies & Tracking Technologies</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Essential Cookies</h3>
                  <p>Required for login, security, and core functionality. Cannot be disabled.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Analytics Cookies</h3>
                  <p>Help us understand how users interact with the platform. Can be disabled in settings.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Preference Cookies</h3>
                  <p>Remember your settings, language, and preferences. Recommended to keep enabled.</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Your Data Rights</h2>
              <div className="space-y-3 text-steel-300">
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">→</span>
                  <div>
                    <p className="text-white font-display mb-1">Access Your Data</p>
                    <p>Request a copy of all data we have about you (delivered within 30 days)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">→</span>
                  <div>
                    <p className="text-white font-display mb-1">Correct Inaccurate Data</p>
                    <p>Update incorrect information through account settings or support request</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">→</span>
                  <div>
                    <p className="text-white font-display mb-1">Delete Your Data</p>
                    <p>Request account deletion (most data deleted within 30 days, some retained for legal compliance)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">→</span>
                  <div>
                    <p className="text-white font-display mb-1">Opt Out of Marketing</p>
                    <p>Unsubscribe from promotional emails (service emails still required)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan text-xl">→</span>
                  <div>
                    <p className="text-white font-display mb-1">Data Portability</p>
                    <p>Export your content and data in machine-readable format</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Data Retention Periods</h2>
              <ul className="space-y-2 text-steel-300">
                <li>• <span className="text-white">Active accounts:</span> Data retained while account is active</li>
                <li>• <span className="text-white">Deleted accounts:</span> 30-day grace period for recovery, then permanent deletion</li>
                <li>• <span className="text-white">Financial records:</span> 7 years (IRS requirement)</li>
                <li>• <span className="text-white">Verification records:</span> 7 years (2257 compliance)</li>
                <li>• <span className="text-white">Moderation logs:</span> 5 years (platform safety)</li>
                <li>• <span className="text-white">Backup copies:</span> 90 days maximum</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">International Data Transfers</h2>
              <p className="text-steel-300 mb-4">
                FANZ operates globally. Your data may be transferred to and processed in the United States and other countries where our infrastructure partners operate.
              </p>
              <p className="text-steel-300">
                We use Standard Contractual Clauses (SCCs) and ensure all partners maintain GDPR-equivalent protections.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Security Measures</h2>
              <ul className="space-y-2 text-steel-300">
                <li>• End-to-end encryption for sensitive data</li>
                <li>• Multi-factor authentication available</li>
                <li>• Regular security audits and penetration testing</li>
                <li>• Employee access controls and monitoring</li>
                <li>• Incident response protocols</li>
                <li>• Data breach notification procedures</li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30">
              <h2 className="font-display text-3xl text-white mb-4">Data Privacy Requests</h2>
              <p className="text-steel-300 mb-4">
                To exercise your data rights or ask questions about data collection:
              </p>
              <a
                href="mailto:privacy@fanzunlimited.com"
                className="text-neon-pink font-mono hover:text-glow transition"
              >
                privacy@fanzunlimited.com
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
