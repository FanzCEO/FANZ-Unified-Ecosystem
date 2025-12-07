import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function AgeVerificationPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Legal Compliance</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Age Verification Protocols
            </h1>
            <p className="text-steel-300 font-mono text-sm mb-2">
              Effective Date: January 11, 2025 | Last Updated: November 5, 2025
            </p>
            <p className="text-steel-300 max-w-3xl mx-auto">
              Content/Data Management & 18 U.S.C. § 2257 Compliance
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Covered Entities */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Covered Entities</h2>
              <p className="text-steel-300 mb-4">
                This policy applies to FANZ™ Group Holdings LLC and affiliates, including Fanz™ Unlimited Network LLC ("FANZ," "we," "our," "us"), operating FanzUnlimited.com, BoyFanz, GirlFanz, PupFanz, the adult toy store, media/production services, and associated apps (the "Platforms").
              </p>
              <div className="p-4 rounded-lg bg-ink-800 border border-neon-cyan/30 mt-4">
                <p className="text-white font-display mb-2">Purpose</p>
                <p className="text-steel-300 text-sm">
                  Keep the Platforms lawful, 18+ only, and safe. Aligns with 18 U.S.C. § 2257, state-level age laws (incl. age-gating states), and international privacy laws.
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1) Who Must Verify Age</h2>
              <p className="text-steel-300 mb-4">Age verification is mandatory for:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• All users signing up on any FANZ Platform</li>
                <li>• Users subscribing, purchasing, tipping, or unlocking content</li>
                <li>• Users applying to become a Content Star (creator/performer)</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2) Age Verification Requirements</h2>

              <div className="mb-6">
                <h3 className="font-display text-2xl text-white mb-3">2.1 U.S. Users (General)</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white font-display">Photo ID Verification:</span> Valid government photo ID at sign-up or before any paid action</li>
                  <li>• <span className="text-white font-display">Phone Validation:</span> Verified mobile number (one-time + risk-based rechecks)</li>
                </ul>
              </div>

              <div className="mb-6 p-6 rounded-lg bg-ink-800 border border-neon-pink/30">
                <h3 className="font-display text-2xl text-white mb-3">2.2 U.S. Users in Age-Restricted States</h3>
                <p className="text-steel-300 mb-3 text-sm font-bold">
                  (Alabama, Arkansas, Florida, Georgia, Idaho, Indiana, Kansas, Kentucky, Louisiana, Mississippi, Montana, Nebraska, North Carolina, Oklahoma, South Carolina, Tennessee, Texas, Utah, Virginia)
                </p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Photo ID + Phone Validation required at sign-up</li>
                  <li>• If ID not supplied at sign-up, it is required before purchase or subscription</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-display text-2xl text-white mb-3">2.3 Canada & Other Countries</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Photo ID Verification required</li>
                  <li>• Phone Validation may be required based on local rules and risk signals</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                <p className="text-white font-display mb-2">Provider</p>
                <p className="text-steel-300 text-sm">
                  FANZ uses VerifyMy for real-time authentication, liveness, and fraud signals. Flagged cases get manual compliance review.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3) Becoming a Content Star (Creator Verification)</h2>
              <p className="text-steel-300 mb-4">To apply, an applicant must:</p>
              <ul className="space-y-3 text-steel-300 ml-4">
                <li>• Complete the Creator application</li>
                <li>• Upload government-issued photo ID</li>
                <li>• Complete real-time selfie liveness + facial match</li>
                <li>• Signature verification inside the VerifyMy UI</li>
                <li>• U.S. tax forms (W-9) or non-U.S. equivalents (e.g., W-8BEN)</li>
              </ul>
              <p className="text-steel-300 mt-4 font-bold">
                If verification fails: access to creator features is blocked until resolved. Periodic reverification occurs (event-based or time-based).
              </p>
            </div>

            {/* Section 4 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4) Enforcement & Messaging</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Users who fail verification are blocked from restricted features</li>
                <li>• Rejected submissions receive clear UI reasons + how to fix</li>
                <li>• Repeat or willful evasion ⇒ suspension or permanent ban and, if applicable, law-enforcement referral</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5) End-User Gatekeeping & Parental Controls</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• DOB collection at sign-up</li>
                <li>• Automated checks via VerifyMy; manual ID may be required if flagged</li>
                <li>• Optional credit-card authorization for additional anti-fraud/age signal</li>
                <li>• Under-18 access is blocked; parental controls and 18+ warnings are present across the Platforms</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6) Content Moderation (Pre- and Post-Upload)</h2>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">6.1 Pre-Upload Screening</h3>
              <p className="text-steel-300 mb-3">Automated + human review target and block:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• CSAM or any depiction of minors, including "appearing to be minor" cues</li>
                <li>• Non-consensual content (incl. "revenge porn") and coercion/trafficking indicators</li>
                <li>• Illicit/violent criminal acts and prohibited services</li>
                <li>• Copyright violative material</li>
                <li>• 2257 gaps (missing consent/ID/records)</li>
              </ul>
              <p className="text-steel-300 mt-4 text-sm">
                Certain categories (BDSM, role-play, fetish) require enhanced verification (e.g., consent attestation, safe-word/aftercare notes).
              </p>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">6.2 Post-Upload Monitoring & Reporting</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Community reporting with an under-24h review SLA; CSAM/NCII expedited</li>
                <li>• Routine rescans (AI + human audits) for late-emerging risk</li>
                <li>• Confirmed violations ⇒ immediate removal, account sanctions per §9</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">6.3 Live Streams & Chat</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Real-time AI monitors streams, chat, and interactive features for harassment, illegal solicitations, age-gate evasion, and prohibited acts</li>
                <li>• Moderators can freeze chat/streams, remove content, and escalate to T&S immediately</li>
              </ul>
            </div>

            {/* Section 7 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">7) Data Protection & Privacy (Verification + Safety)</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <p className="text-white font-display mb-2">2257 Recordkeeping</p>
                  <p>We maintain secure, encrypted, access-controlled records for performer IDs, consent forms, and custodian details as required by 18 U.S.C. § 2257.</p>
                </div>
                <div>
                  <p className="text-white font-display mb-2">Biometric Notice</p>
                  <p>Facial recognition/liveness data is used only for age/ID verification and anti-fraud; retained minimally (see Data Management Policy) and deleted or de-identified unless a longer legal obligation applies.</p>
                </div>
                <div>
                  <p className="text-white font-display mb-2">Processors</p>
                  <p>Age verification data flows through VerifyMy; payment data is handled by payment processors (e.g., PayPal). FANZ may store verification outcomes, timestamps, model releases, and compliance metadata necessary for 2257, audits, and defense.</p>
                </div>
              </div>
            </div>

            {/* Section 8 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">8) Non-Consensual Content (NCII) & DMCA</h2>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">NCII fast-track:</span> Immediate removal upon verified request, hash-blocking at re-upload, referral to mirrors where feasible</li>
                <li>• <span className="text-white font-display">DMCA:</span> We honor valid notices/counter-notices and maintain a repeat-infringer policy (see §9)</li>
              </ul>
            </div>

            {/* Section 9 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">9) Enforcement Framework</h2>
              <div className="space-y-3 text-steel-300">
                <div>
                  <p className="text-white font-display mb-1">Content Removal</p>
                  <p>Immediate on verification of violation</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Account Sanctions</p>
                  <ul className="ml-4 space-y-1 text-sm">
                    <li>• First violation: warning or temporary suspension</li>
                    <li>• Repeated/egregious: permanent termination</li>
                    <li>• Repeat-Infringer: Users who repeatedly infringe IP or safety rules will be terminated per policy</li>
                  </ul>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Law Enforcement</p>
                  <p>Mandatory reporting of suspected CSAM to NCMEC and cooperation with lawful requests</p>
                </div>
              </div>
            </div>

            {/* Section 10 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">10) Policy Updates & Contact</h2>
              <p className="text-steel-300 mb-4">
                We may update this Policy; material changes appear in the KB and/or via in-product notices. Continued use = acceptance.
              </p>
              <div className="space-y-3">
                <div>
                  <p className="text-white font-display mb-1">Compliance & Legal</p>
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
