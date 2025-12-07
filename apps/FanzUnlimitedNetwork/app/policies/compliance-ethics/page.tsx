import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function ComplianceEthicsPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Ethics & Compliance</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Compliance & Ethics Policy
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective Date: February 7, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Overview */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Overview</h2>
              <p className="text-steel-300">
                FANZ™ Group Holdings LLC is committed to maintaining the highest standards of compliance, ethics, diversity, and inclusion across all platforms. This policy establishes requirements for taxation, identity verification, child protection, and ethical conduct.
              </p>
            </div>

            {/* Taxation & Tax Compliance */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1. Taxation & Tax Compliance</h2>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">1.1 Content Creator Tax Requirements</h3>
              <p className="text-steel-300 mb-4">All Content Stars earning income through FANZ platforms must comply with federal and state tax obligations:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">U.S. Creators:</span> Must complete IRS Form W-9 before payouts begin</li>
                <li>• <span className="text-white font-display">International Creators:</span> Must complete IRS Form W-8BEN or appropriate equivalent</li>
                <li>• <span className="text-white font-display">1099-NEC Forms:</span> Issued annually to U.S. creators earning $600+ per calendar year</li>
                <li>• <span className="text-white font-display">Quarterly Estimated Taxes:</span> Creators are responsible for their own tax filings and estimated payments</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">1.2 Platform Tax Obligations</h3>
              <p className="text-steel-300 mb-4">FANZ maintains compliance with:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• IRS reporting requirements for payments to contractors (1099-NEC, 1099-K)</li>
                <li>• State sales tax collection where required</li>
                <li>• International tax treaties and withholding requirements</li>
                <li>• Financial transaction reporting (FinCEN Form 114 for applicable transactions)</li>
              </ul>

              <div className="p-4 rounded-lg bg-ink-800 border border-white/5 mt-4">
                <p className="text-white font-display mb-2">Tax Records Retention</p>
                <p className="text-steel-300 text-sm">All tax-related records are retained for 7 years per IRS requirements.</p>
              </div>
            </div>

            {/* KYC/KYB Requirements */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2. KYC/KYB Requirements</h2>

              <h3 className="font-display text-2xl text-white mb-3">2.1 Know Your Customer (KYC)</h3>
              <p className="text-steel-300 mb-4">All users, particularly Content Stars and paying subscribers, must verify their identity:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Government-issued photo ID verification</li>
                <li>• Real-time liveness detection and facial matching</li>
                <li>• Address verification for financial transactions</li>
                <li>• Phone number and email verification</li>
                <li>• Sanctions and watchlist screening (OFAC, FinCEN)</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">2.2 Know Your Business (KYB)</h3>
              <p className="text-steel-300 mb-4">Business entities operating on FANZ must provide:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Business registration documents (Articles of Incorporation, LLC Operating Agreement)</li>
                <li>• Employer Identification Number (EIN)</li>
                <li>• Beneficial ownership information (individuals owning 25%+ of entity)</li>
                <li>• Business address and contact information</li>
                <li>• Bank account verification for entity payouts</li>
              </ul>

              <div className="p-4 rounded-lg bg-ink-800 border border-neon-pink/30 mt-4">
                <p className="text-white font-display mb-2">Anti-Money Laundering (AML)</p>
                <p className="text-steel-300 text-sm">
                  FANZ maintains AML compliance programs including transaction monitoring, suspicious activity reporting (SAR), and currency transaction reports (CTR) where applicable.
                </p>
              </div>
            </div>

            {/* COPPA Compliance */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3. COPPA Compliance</h2>
              <p className="text-steel-300 mb-4">
                The Children's Online Privacy Protection Act (COPPA) requires special protections for users under 13. FANZ is an 18+ platform and strictly prohibits minors.
              </p>

              <h3 className="font-display text-2xl text-white mb-3">3.1 Age Restrictions</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Platform is restricted to users 18 years of age or older</li>
                <li>• Mandatory age verification at signup</li>
                <li>• Additional verification for users in age-restricted states</li>
                <li>• Zero tolerance for underage access attempts</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">3.2 Data Collection from Minors</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• FANZ does not knowingly collect data from individuals under 18</li>
                <li>• If underage access is detected, account is immediately terminated</li>
                <li>• Data collected from minors is promptly deleted</li>
                <li>• Law enforcement is notified if exploitation is suspected</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">3.3 Parental Controls & Safety</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Clear 18+ warnings on all platform entry points</li>
                <li>• Device and IP-based blocking for known minors</li>
                <li>• Educational resources for parents about platform restrictions</li>
                <li>• Cooperation with parental monitoring services</li>
              </ul>
            </div>

            {/* Diversity, Equity & Inclusion */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4. Diversity, Equity & Inclusion</h2>

              <h3 className="font-display text-2xl text-white mb-3">4.1 Platform Commitment</h3>
              <p className="text-steel-300 mb-4">
                FANZ is committed to creating an inclusive environment for all users regardless of:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Race, ethnicity, or national origin</li>
                <li>• Gender identity or expression</li>
                <li>• Sexual orientation</li>
                <li>• Disability status</li>
                <li>• Age (18+ requirement notwithstanding)</li>
                <li>• Religion or belief system</li>
                <li>• Body type, appearance, or physical characteristics</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">4.2 Anti-Discrimination Policy</h3>
              <p className="text-steel-300 mb-4">Prohibited conduct includes:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Hate speech targeting protected characteristics</li>
                <li>• Harassment or bullying based on identity</li>
                <li>• Discriminatory content pricing or access restrictions</li>
                <li>• Platform manipulation to exclude or marginalize groups</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">4.3 Inclusive Platform Features</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Multiple gender identity options in profile settings</li>
                <li>• Pronoun selection and display</li>
                <li>• Accessibility features for users with disabilities</li>
                <li>• Content discovery algorithms that promote diverse creators</li>
                <li>• Platform-specific communities (BoyFanz, GirlFanz, TransFanz, etc.)</li>
              </ul>
            </div>

            {/* Ethical Standards */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5. Ethical Standards</h2>

              <h3 className="font-display text-2xl text-white mb-3">5.1 Creator Conduct</h3>
              <p className="text-steel-300 mb-4">Content Stars are expected to:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Maintain honest and transparent communication with subscribers</li>
                <li>• Deliver promised content and services</li>
                <li>• Respect intellectual property rights of others</li>
                <li>• Disclose sponsored content and brand partnerships</li>
                <li>• Treat co-stars and collaborators fairly and respectfully</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">5.2 Subscriber Conduct</h3>
              <p className="text-steel-300 mb-4">Subscribers must:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Respect creator boundaries and content policies</li>
                <li>• Refrain from harassment, stalking, or doxxing</li>
                <li>• Not share, redistribute, or pirate creator content</li>
                <li>• Honor payment commitments and subscriptions</li>
                <li>• Report policy violations through proper channels</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">5.3 Platform Obligations</h3>
              <p className="text-steel-300 mb-4">FANZ commits to:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Fair and consistent policy enforcement</li>
                <li>• Transparent communication about platform changes</li>
                <li>• Timely payment processing for creators</li>
                <li>• Responsive customer support</li>
                <li>• Protection of user data and privacy</li>
                <li>• Continuous improvement of safety features</li>
              </ul>
            </div>

            {/* Reporting & Enforcement */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6. Reporting & Enforcement</h2>

              <h3 className="font-display text-2xl text-white mb-3">6.1 Violation Reporting</h3>
              <p className="text-steel-300 mb-4">Users can report compliance or ethics violations through:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• In-platform reporting tool (anonymous option available)</li>
                <li>• Email: <a href="mailto:compliance@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono">compliance@fanzunlimited.com</a></li>
                <li>• Ethics hotline: (945) 998-9033</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">6.2 Investigation Process</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Complaints acknowledged within 24 hours</li>
                <li>• Investigation completed within 7 business days</li>
                <li>• Confidentiality maintained for reporters</li>
                <li>• No retaliation against good-faith reporters</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">6.3 Consequences</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left mt-4">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Violation Type</th>
                      <th className="pb-3 text-white font-display">First Offense</th>
                      <th className="pb-3 text-white font-display">Repeat Offense</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">Tax Non-Compliance</td>
                      <td className="py-3">Warning + 30-day correction period</td>
                      <td className="py-3">Account suspension, IRS referral</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">KYC/KYB Fraud</td>
                      <td className="py-3">Immediate suspension</td>
                      <td className="py-3">Permanent ban, legal action</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Discrimination/Harassment</td>
                      <td className="py-3">Content removal, warning</td>
                      <td className="py-3">30-day suspension or permanent ban</td>
                    </tr>
                    <tr>
                      <td className="py-3">Minor Safety Violation</td>
                      <td className="py-3">Immediate permanent ban</td>
                      <td className="py-3">Law enforcement referral</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Contact */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-white font-display mb-1">Compliance & Ethics</p>
                  <a href="mailto:compliance@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    compliance@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Tax Questions</p>
                  <a href="mailto:tax@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    tax@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">General Support</p>
                  <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    support@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Address</p>
                  <p className="text-steel-300 font-mono text-sm">30 N Gould Street #45302, Sheridan, WY 82801</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
