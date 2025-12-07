import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function UserAgreement() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Binding Contract</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              User Agreement
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective Date: February 6, 2025 | Last Updated: February 6, 2025
            </p>
            <p className="text-steel-300 mt-4 max-w-3xl mx-auto">
              Fanz™ Unlimited Network (FUN) L.L.C. — Content Star & Co-Star Agreement
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Introduction */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Binding Contract</h2>
              <p className="text-steel-300 mb-4">
                This legally binding contract ("Agreement") is entered into between:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">Fanz™ Unlimited Network (FUN) L.L.C.</span>, referred to as "FUN," "we," or "the Company."</li>
                <li>• <span className="text-white font-display">The User (Content Star or Co-Star)</span>, referred to as "you" or "the User."</li>
              </ul>

              <div className="mt-6 p-4 rounded-lg bg-ink-800 border border-neon-cyan/30">
                <p className="text-white font-display mb-2">By signing this Agreement, you acknowledge that:</p>
                <ul className="space-y-2 text-steel-300 text-sm">
                  <li>✓ You have read, understood, and agreed to the terms outlined in this Agreement.</li>
                  <li>✓ You accept that all disputes must be resolved through arbitration.</li>
                  <li>✓ You waive your right to participate in any class-action lawsuit against FUN.</li>
                  <li>✓ You accept that electronic signatures are legally binding under this Agreement.</li>
                </ul>
              </div>

              <p className="text-steel-300 mt-4">
                This Agreement governs your use of the platforms operated by Fanz™ Unlimited Network (FUN) L.L.C.
              </p>
            </div>

            {/* Section 1: Scope */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1. Scope of Agreement</h2>
              <p className="text-steel-300 mb-4">
                This Agreement applies to all content creators, subscribers, and users who engage with any of FUN's platforms. It outlines your rights and responsibilities, the Company's obligations, and the legal framework for dispute resolution.
              </p>
              <p className="text-steel-300">
                This Agreement is legally binding and enforceable under the laws of the <span className="text-white">State of Wyoming, United States</span>. If any provision of this Agreement conflicts with state, federal, or international law, the applicable law shall govern, but all remaining terms will remain in full effect.
              </p>
            </div>

            {/* Section 2: User Rights & Responsibilities */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2. User Rights and Responsibilities</h2>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">2.1 Permitted Activities</h3>
              <p className="text-steel-300 mb-3">Users of FUN's platforms are allowed to:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Upload, publish, and distribute content that complies with platform policies.</li>
                <li>• Set pricing for subscription-based content and receive payments.</li>
                <li>• Engage with other users in accordance with platform guidelines.</li>
                <li>• Report violations of their rights or FUN's terms of service.</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">2.2 Prohibited Activities and Content</h3>
              <p className="text-steel-300 mb-4">
                Users may not engage in the following activities or upload, distribute, or promote the following types of content:
              </p>

              <div className="p-6 rounded-lg bg-ink-800 border border-neon-pink/50 mb-6">
                <h4 className="font-display text-xl text-white mb-3">2.2.1 Illegal Content (Zero Tolerance)</h4>
                <p className="text-steel-300 mb-4 font-bold">
                  Uploading, sharing, or distributing any of the following is strictly prohibited and will result in immediate account termination and legal action where applicable:
                </p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-neon-pink">Child Sexual Abuse Material (CSAM)</span> – Any content depicting minors (persons under 18) in sexual situations, including nude or suggestive images.</li>
                  <li>• <span className="text-neon-pink">Bestiality</span> – Any content involving sexual acts with animals, real or simulated.</li>
                  <li>• <span className="text-neon-pink">Non-Consensual Sexual Content (Revenge Porn)</span> – Any media uploaded without the explicit consent of all parties involved.</li>
                  <li>• <span className="text-neon-pink">Human Trafficking, Exploitation, or Forced Content</span> – Any content depicting coercion, trafficking, or forced participation.</li>
                  <li>• <span className="text-neon-pink">Incest and Necrophilia</span> – Any content portraying sexual acts with family members or deceased persons, real or simulated.</li>
                  <li>• <span className="text-neon-pink">Weapons or Drug Trafficking</span> – Content that promotes or facilitates the illegal sale of weapons or controlled substances.</li>
                  <li>• <span className="text-neon-pink">Hate Speech and Terrorist Content</span> – Any media promoting violence, discrimination, or extremist ideologies.</li>
                </ul>
              </div>

              <div className="p-6 rounded-lg bg-ink-800 border border-white/10 mb-6">
                <h4 className="font-display text-xl text-white mb-3">2.2.2 Violations of Intellectual Property Rights</h4>
                <p className="text-steel-300 mb-3">
                  Users may not upload or share content that violates copyright, trademarks, or other intellectual property rights. This includes but is not limited to:
                </p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Pirated content from movies, TV shows, or other creators.</li>
                  <li>• Music, images, or videos used without proper authorization.</li>
                  <li>• Impersonation of other individuals or brands.</li>
                </ul>
                <p className="text-steel-300 mt-4">
                  If FUN receives a Digital Millennium Copyright Act (DMCA) takedown notice, the content will be removed immediately, and repeat offenders may have their accounts permanently suspended.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-ink-800 border border-white/10">
                <h4 className="font-display text-xl text-white mb-3">2.2.3 Fraud, Scams, and Misuse of the Platform</h4>
                <p className="text-steel-300 mb-3">Users may not engage in:</p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Chargeback fraud or subscription manipulation.</li>
                  <li>• Running scams, pyramid schemes, or financial fraud.</li>
                  <li>• Artificial engagement, including bot activity to inflate views, likes, or interactions.</li>
                  <li>• Money laundering or illegal financial transactions.</li>
                </ul>
                <p className="text-steel-300 mt-4">
                  Violators may have their accounts terminated, earnings frozen, and legal authorities notified.
                </p>
              </div>
            </div>

            {/* Section 3: Complaints & Dispute Resolution */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3. Complaints and Dispute Resolution</h2>

              <h3 className="font-display text-2xl text-white mb-3">3.1 How to File a Complaint</h3>
              <p className="text-steel-300 mb-3">Users may submit complaints via the following official channels:</p>
              <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                <p className="text-steel-300"><span className="text-white font-display">Email:</span> <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition">support@fanzunlimited.com</a></p>
                <p className="text-steel-300 mt-2"><span className="text-white font-display">Mail:</span> Fanz™ Unlimited Network (FUN) L.L.C.™, 30 N Gould Street #45302, Sheridan, WY 82801</p>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">3.2 Resolution Timeline</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Complaints will be acknowledged within <span className="text-white">two business days</span>.</li>
                <li>• FUN will complete an investigation within <span className="text-white">seven business days</span> from the date of receipt.</li>
                <li>• Users may appeal a decision within <span className="text-white">thirty days</span> of receiving a resolution.</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">3.3 Finality of Decisions</h3>
              <p className="text-steel-300">
                All resolutions provided by FUN are final, except in cases where new material evidence arises that significantly impacts the original complaint outcome.
              </p>
            </div>

            {/* Section 4: Mandatory Arbitration */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4. Mandatory Arbitration and Class Action Waiver</h2>
              <p className="text-steel-300 mb-4">
                By signing this Agreement, you agree that all disputes arising from this contract or your use of FUN's platforms will be resolved through final and binding arbitration rather than in court.
              </p>
              <ul className="space-y-3 text-steel-300 ml-4">
                <li>• Arbitration shall be administered by the <span className="text-white font-display">American Arbitration Association (AAA)</span> under its Consumer Arbitration Rules.</li>
                <li>• The arbitration hearing will take place in <span className="text-white font-display">Sheridan, Wyoming, USA</span>, unless both parties agree to virtual arbitration.</li>
                <li>• You waive the right to participate in any class-action lawsuit against FUN.</li>
              </ul>
            </div>

            {/* Section 5: Indemnification */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5. Indemnification and Limitation of Liability</h2>

              <h3 className="font-display text-2xl text-white mb-3">5.1 Indemnification Clause</h3>
              <p className="text-steel-300 mb-3">
                You agree to defend, indemnify, and hold harmless FUN and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, or liabilities arising from:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Your content, transactions, and activities on FUN's platforms.</li>
                <li>• Any third-party claims related to copyright, trademark, defamation, or privacy violations.</li>
                <li>• Any fraudulent or unauthorized use of your account.</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">5.2 Limitation of Liability</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• FUN shall not be liable for indirect, incidental, special, consequential, or punitive damages.</li>
                <li>• The maximum liability FUN assumes in any dispute shall be limited to the total earnings of the user over the last six months.</li>
              </ul>
            </div>

            {/* Section 6: Electronic Signature */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6. Electronic Signature and Legal Effect</h2>
              <p className="text-steel-300">By signing this Agreement, you agree that:</p>
              <ul className="space-y-2 text-steel-300 ml-4 mt-3">
                <li>• Your electronic signature carries the same legal effect as a physical signature.</li>
                <li>• This Agreement is legally binding upon submission.</li>
              </ul>
            </div>

            {/* Section 7: Acknowledgment */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">7. Acknowledgment and Signatures</h2>

              <div className="p-6 rounded-lg bg-ink-800 border border-white/10 mb-6">
                <h3 className="font-display text-xl text-white mb-3">User Signature (Content Star / Co-Star)</h3>
                <div className="space-y-3 text-steel-300 font-mono text-sm">
                  <p>Signature: ___________________________</p>
                  <p>Printed Name: ___________________________</p>
                  <p>Stage Name (if applicable): ___________________________</p>
                  <p>Date: ____ / ____ / ______</p>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-ink-800 border border-white/10">
                <h3 className="font-display text-xl text-white mb-3">Admin Approval (Fanz™ Unlimited Network (FUN) L.L.C. Representative)</h3>
                <div className="space-y-3 text-steel-300 font-mono text-sm">
                  <p>Admin Name: ___________________________</p>
                  <p>Admin Signature: ___________________________</p>
                  <p>Date: ____ / ____ / ______</p>
                </div>
              </div>

              <p className="text-steel-300 mt-6 text-center font-bold">
                This agreement is governed by the laws of the State of Wyoming and shall be enforced accordingly.
              </p>
            </div>

            {/* Footer */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <p className="text-center text-steel-300 font-mono text-sm">
                All Rights Reserved Fanz™ Unlimited Network (FUN) L.L.C. 2025
              </p>
              <div className="mt-4 text-center">
                <p className="text-white font-display mb-2">Contact Information</p>
                <p className="text-steel-300 font-mono text-sm">Fanz™ Unlimited Network (FUN) L.L.C.™</p>
                <p className="text-steel-300 font-mono text-sm">30 N Gould Street #45302, Sheridan, WY 82801</p>
                <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                  support@fanzunlimited.com
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
