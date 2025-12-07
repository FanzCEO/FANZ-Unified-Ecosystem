import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function DataManagementPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Data Security</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Data Management Policy
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective Date: January 1, 2025 | Last Updated: November 5, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Scope */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Scope</h2>
              <p className="text-steel-300">
                Governs collection, processing, storage, retention, and access to personal data across FANZ Platforms. Works with the Privacy Policy and this KB's Age Verification policy.
              </p>
            </div>

            {/* Section 1 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1) 2257 Record-Keeping</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• We maintain secure digital records (IDs, consent forms, model releases, custodian info) per 18 U.S.C. § 2257</li>
                <li>• Encrypted at rest, limited to authorized compliance personnel, access logged</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2) End-User Age Verification (Summary)</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• DOB at sign-up; automated checks via VerifyMy; if flagged, government ID</li>
                <li>• Optional credit-card authorization for anti-fraud/age signal</li>
                <li>• Verified users gain access; suspected falsification ⇒ suspension pending review</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3) Data Security & Access Controls</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <p className="text-white font-display mb-2">Encryption</p>
                  <p>AES-256 at rest; TLS in transit</p>
                </div>
                <div>
                  <p className="text-white font-display mb-2">Access</p>
                  <p>Role-based access, least-privilege, MFA for admins</p>
                </div>
                <div>
                  <p className="text-white font-display mb-2">Cybersecurity</p>
                  <p>AI threat detection, EDR monitoring, vulnerability scans, regular backups and recovery testing</p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4) Data Minimization & Storage</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• We collect only what's necessary to operate, verify, pay, secure, and comply</li>
                <li>• <span className="text-white font-display">Age/ID artifacts:</span> where feasible, verification images and biometric templates are retained minimally to complete verification + short risk window; then deleted or irreversibly de-identified unless law requires retention</li>
                <li>• We retain verification outcomes, timestamps, and compliance metadata to meet 2257, tax, fraud-prevention, and legal defense needs</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5) Retention & Deletion</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">2257/Finance:</span> kept per statute (commonly 3–7+ years)</li>
                <li>• <span className="text-white font-display">Moderation Logs:</span> retained on a risk-based schedule to deter abuse and support investigations</li>
                <li>• <span className="text-white font-display">Deletion Requests:</span> honored per applicable law (subject to legal holds and statutory retention)</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6) Access & Rights Requests</h2>
              <p className="text-steel-300 mb-4">
                Submit requests to <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono">support@fanzunlimited.com</a> or via in-product tools.
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• We authenticate requesters and respond within legal timelines (with appeal process where required)</li>
                <li>• Where law allows, users may access, correct, delete, port, or object/restrict certain processing</li>
                <li>• CPRA "sale/share" opt-outs honored (we do not sell personal data)</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">7) Third-Party & Government Access</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Only authorized FANZ personnel access personal data</li>
                <li>• <span className="text-white font-display">Processors</span> (e.g., VerifyMy, payment, hosting, analytics) access data solely to provide contracted services under DPA/SCCs/IDTA where needed</li>
                <li>• <span className="text-white font-display">Government/lawful requests</span> require valid legal process; emergencies handled per law with documentation</li>
              </ul>
            </div>

            {/* Section 8 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">8) Audits & Governance</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Quarterly compliance audits; periodic third-party assessments as needed</li>
                <li>• New tooling undergoes security and privacy review (threat model + DPIA/LIAs where required)</li>
              </ul>
            </div>

            {/* Section 9 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">9) Miscellaneous</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Disciplinary actions apply for internal policy violations</li>
                <li>• Archiving of critical records occurs at least every 30 days (with integrity checks)</li>
                <li>• Policy conflicts default to the Terms of Service for dispute resolution and limits of liability</li>
              </ul>
            </div>

            {/* Section 10 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">10) Updates & Contact</h2>
              <p className="text-steel-300 mb-4">
                This Policy may be updated; material changes posted in the KB and/or in-product notices.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-white font-display mb-1">Legal Department</p>
                  <a href="mailto:Legal@FanzUnlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    Legal@FanzUnlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Support</p>
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
