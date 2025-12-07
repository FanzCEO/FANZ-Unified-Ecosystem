import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function DMCAPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Copyright Protection</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              DMCA Policy
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective: October 24, 2024 | Updated: February 7, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Copyright Infringement Policy</h2>
              <p className="text-steel-300 mb-4">
                FANZ Unlimited Network (FUN) L.L.C.™ respects the intellectual property rights of creators and complies with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512.
              </p>
              <p className="text-steel-300">
                This policy outlines our procedures for handling copyright infringement claims and protecting creator content from unauthorized distribution.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Creator Protection: Content Defense</h2>
              <p className="text-steel-300 mb-4">
                FANZ provides automated DMCA takedown coordination through our in-house Content Defense service:
              </p>
              <div className="space-y-3 text-steel-300">
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Automated Monitoring</p>
                    <p>AI-powered scanning of major piracy sites, tube sites, and file-sharing platforms</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Instant Takedown Notices</p>
                    <p>Automated DMCA notices sent on behalf of creators within minutes of leak detection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Forensic Watermarking</p>
                    <p>Poizen™ forensic signatures help identify leak sources and copyright violators</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime text-xl">✓</span>
                  <div>
                    <p className="text-white font-display mb-1">Legal Support</p>
                    <p>Creator Elite members receive legal assistance for persistent copyright violations</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Filing a DMCA Takedown Notice</h2>
              <p className="text-steel-300 mb-4">
                If your copyrighted material appears on FANZ without authorization, submit a DMCA takedown notice including:
              </p>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Required Information</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Your physical or electronic signature</li>
                    <li>• Identification of the copyrighted work claimed to be infringed</li>
                    <li>• URL(s) or location of the infringing material on FANZ</li>
                    <li>• Your contact information (email, phone, address)</li>
                    <li>• Statement of good faith belief that use is unauthorized</li>
                    <li>• Statement that information is accurate and you're authorized to act on behalf of copyright owner</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Where to Send</h3>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5 mt-2">
                    <p className="text-white font-display mb-2">DMCA Designated Agent:</p>
                    <p className="font-mono text-sm">FANZ Unlimited Network (FUN) L.L.C.™</p>
                    <p className="font-mono text-sm">Attn: DMCA Agent</p>
                    <p className="font-mono text-sm">Email: <a href="mailto:dmca@fanzunlimited.com" className="text-neon-pink hover:text-glow transition">dmca@fanzunlimited.com</a></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Our Response Process</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Step</th>
                      <th className="pb-3 text-white font-display">Action</th>
                      <th className="pb-3 text-white font-display">Timeframe</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">1. Notice Received</td>
                      <td className="py-3">Review for completeness and validity</td>
                      <td className="py-3">Within 24 hours</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">2. Content Removal</td>
                      <td className="py-3">Disable access to allegedly infringing material</td>
                      <td className="py-3">Within 24-48 hours</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">3. User Notification</td>
                      <td className="py-3">Notify uploader of takedown and provide counter-notice procedure</td>
                      <td className="py-3">Within 48 hours</td>
                    </tr>
                    <tr>
                      <td className="py-3">4. Counter-Notice Period</td>
                      <td className="py-3">Allow 10-14 days for counter-notice response</td>
                      <td className="py-3">10-14 business days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Filing a Counter-Notice</h2>
              <p className="text-steel-300 mb-4">
                If your content was removed due to a DMCA claim and you believe the removal was in error or you have authorization to use the material, you may file a counter-notice.
              </p>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Counter-Notice Requirements</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• Your physical or electronic signature</li>
                    <li>• Identification of the material removed and its prior location</li>
                    <li>• Statement under penalty of perjury that removal was a mistake or misidentification</li>
                    <li>• Your name, address, phone number</li>
                    <li>• Statement consenting to jurisdiction of federal court in your district</li>
                    <li>• Statement that you'll accept service of process from the original complainant</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">What Happens Next</h3>
                  <p>Upon receiving a valid counter-notice, we forward it to the original complainant. If they don't file a court action within 10-14 business days, we may restore the content.</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Repeat Infringer Policy</h2>
              <p className="text-steel-300 mb-4">
                FANZ maintains a three-strike policy for copyright infringement:
              </p>
              <div className="space-y-3 text-steel-300">
                <div>
                  <p className="text-white font-display mb-1">First Strike</p>
                  <p>Content removed + warning issued + educational resources provided</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Second Strike</p>
                  <p>Content removed + 30-day upload restriction + mandatory compliance training</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Third Strike</p>
                  <p>Permanent account termination + all content removed + potential legal action</p>
                </div>
              </div>
              <p className="text-steel-300 mt-4 text-sm italic">
                Note: Strikes for blatant or willful infringement may result in immediate termination without warning.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">False DMCA Claims</h2>
              <p className="text-steel-300 mb-4">
                Filing a false or fraudulent DMCA claim is perjury under U.S. law and may result in:
              </p>
              <ul className="space-y-2 text-steel-300">
                <li>• Account termination</li>
                <li>• Civil liability for damages</li>
                <li>• Attorney's fees</li>
                <li>• Criminal penalties</li>
              </ul>
              <p className="text-steel-300 mt-4">
                Only file DMCA notices if you genuinely believe content infringes your copyright. Do not abuse the process to censor content, harass creators, or gain competitive advantage.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Content Outside FANZ Platform</h2>
              <p className="text-steel-300 mb-4">
                If your FANZ content appears on external sites without permission:
              </p>
              <div className="space-y-3 text-steel-300">
                <div>
                  <p className="text-white font-display mb-1">Creator Pro/Elite Members</p>
                  <p>Content Defense automatically files takedowns on your behalf across 100+ monitored platforms</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Free Tier Creators</p>
                  <p>You must file DMCA notices directly with the hosting platform. We provide guidance and templates.</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Legal Assistance</p>
                  <p>Creator Elite members receive legal support for persistent copyright violations requiring court action.</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Fair Use Considerations</h2>
              <p className="text-steel-300 mb-4">
                Not all unauthorized use is copyright infringement. Fair use may apply to:
              </p>
              <ul className="space-y-2 text-steel-300">
                <li>• Commentary, criticism, or parody</li>
                <li>• News reporting or journalism</li>
                <li>• Educational use in limited contexts</li>
                <li>• Transformative works</li>
              </ul>
              <p className="text-steel-300 mt-4">
                Fair use is determined case-by-case. If you believe your use qualifies as fair use, include that explanation in your counter-notice.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30">
              <h2 className="font-display text-3xl text-white mb-4">DMCA Contact Information</h2>
              <p className="text-steel-300 mb-4">
                For all copyright-related inquiries, takedown notices, or counter-notices:
              </p>
              <div className="space-y-2">
                <p className="text-white font-display">DMCA Designated Agent</p>
                <p className="text-steel-300 font-mono text-sm">FANZ Unlimited Network (FUN) L.L.C.™</p>
                <p className="text-steel-300 font-mono text-sm">Attn: DMCA Agent / Copyright Compliance</p>
                <a
                  href="mailto:dmca@fanzunlimited.com"
                  className="text-neon-pink font-mono hover:text-glow transition block"
                >
                  dmca@fanzunlimited.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
