import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Privacy & Compliance</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Privacy & Age Verification Policy
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective Date: October 2, 2024 | Last Updated: November 5, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Entities Covered */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Entities Covered</h2>
              <p className="text-steel-300 mb-4">
                This Policy applies to FANZ™ Group Holdings LLC and its affiliates, including Fanz™ Unlimited Network LLC ("FANZ," "we," "us," "our"), operating: FanzUnlimited.com, BoyFanz, GirlFanz, PupFanz, our adult toy store, media services, and associated apps/sites (collectively, the "Platforms").
              </p>
              <div className="p-4 rounded-lg bg-ink-800 border border-white/5 mt-4">
                <p className="text-white font-display mb-2">Contact (Compliance & Privacy):</p>
                <p className="text-steel-300 font-mono text-sm">Fanz™ Unlimited Network LLC</p>
                <p className="text-steel-300 font-mono text-sm">30 N Gould Street #45302, Sheridan, WY 82801</p>
                <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                  support@fanzunlimited.com
                </a>
              </div>
              <p className="text-steel-300 mt-4 text-sm">
                <span className="text-white font-display">Designated Custodian of Records (18 U.S.C. §2257):</span> FANZ will designate and publish the Custodian's contact details on the Platforms as required by law. Records are maintained in secure, access-restricted systems.
              </p>
            </div>

            {/* PART I - AGE VERIFICATION PROTOCOLS */}
            <div className="mb-12">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 border border-neon-pink/30 mb-8">
                <h2 className="font-display text-4xl text-white text-center">I. Age Verification Protocols</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <p className="text-steel-300 mb-6">
                  We maintain strict, multi-factor age verification for performers (content stars) and end-users (viewers/subscribers). We use AgeChecker.Net for real-time verification and fraud prevention.
                </p>

                <h3 className="font-display text-2xl text-white mb-4">1. Performers (Content Stars)</h3>

                <div className="mb-6">
                  <h4 className="text-white font-display text-xl mb-2">Minimum Age</h4>
                  <p className="text-steel-300">All performers must be 18+ at account registration; every individual depicted in content must have been 18+ at time of recording.</p>
                </div>

                <div className="mb-6">
                  <h4 className="text-white font-display text-xl mb-3">Verification Flow (must be completed before activation):</h4>
                  <ol className="space-y-3 text-steel-300">
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">1.</span>
                      <div>
                        <span className="text-white font-display">Government-Issued ID.</span> Current, valid photo ID with name, DOB, and photo.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">2.</span>
                      <div>
                        <span className="text-white font-display">Live Biometric Match.</span> Live selfie required; facial recognition compares selfie to ID to confirm liveness and identity.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">3.</span>
                      <div>
                        <span className="text-white font-display">U.S. Tax Forms.</span> W-9 (U.S. persons) and any forms required for non-U.S. persons (e.g., W-8BEN).
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">4.</span>
                      <div>
                        <span className="text-white font-display">Real-Time Authentication.</span> AgeChecker.Net authenticates ID; flagged cases undergo manual review.
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">5.</span>
                      <div>
                        <span className="text-white font-display">Approval & Re-verification.</span> Accounts remain inactive until approved; periodic and event-based re-verification may be required.
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="mb-6">
                  <h4 className="text-white font-display text-xl mb-2">Ongoing Monitoring</h4>
                  <ul className="space-y-2 text-steel-300 ml-4">
                    <li>• Routine audits of IDs, consent forms, and published content.</li>
                    <li>• Any suspected fraud, identity mismatch, or age risk triggers immediate suspension pending investigation.</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h4 className="text-white font-display text-xl mb-2">Recordkeeping (18 U.S.C. §2257)</h4>
                  <ul className="space-y-2 text-steel-300 ml-4">
                    <li>• We securely maintain performer records, IDs, and consent documentation in encrypted systems with role-based access.</li>
                    <li>• We will promptly cooperate with lawful inspections and subpoenas consistent with applicable law.</li>
                  </ul>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">2. End-Users (Viewers & Subscribers)</h3>

                <div className="mb-6">
                  <h4 className="text-white font-display text-xl mb-3">Gatekeeping & Checks</h4>
                  <ol className="space-y-2 text-steel-300">
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">1.</span>
                      <span>DOB collection on signup.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">2.</span>
                      <span>Automated check via AgeChecker.Net; if flagged, government ID may be required.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">3.</span>
                      <span>Credit card authorization (optional) as an added anti-fraud/age signal.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-acid-lime font-display">4.</span>
                      <span>Activation only after successful verification; suspicious accounts are suspended.</span>
                    </li>
                  </ol>
                </div>

                <div>
                  <h4 className="text-white font-display text-xl mb-2">Parental Controls</h4>
                  <ul className="space-y-2 text-steel-300 ml-4">
                    <li>• Clear 18+ warnings and access blocks for underage users.</li>
                    <li>• Industry initiatives to reduce underage access are supported across our stack.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PART II - CONTENT MODERATION */}
            <div className="mb-12">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-cyan/20 to-acid-lime/20 border border-neon-cyan/30 mb-8">
                <h2 className="font-display text-4xl text-white text-center">II. Content Moderation & Enforcement</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">3. Pre-Upload Review</h3>
                <p className="text-steel-300 mb-3">Automated + Manual review identifies and blocks:</p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• CSAM; non-consensual/"revenge porn"; trafficking; coercion; illicit/violent acts.</li>
                  <li>• Copyright-infringing material.</li>
                  <li>• §2257 compliance failures.</li>
                </ul>
                <p className="text-steel-300 mt-4">Sensitive categories (e.g., BDSM, roleplay) may require additional consent verification.</p>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">4. Post-Upload Monitoring & Reporting</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Community reporting tool (anonymous option). Reviewed within 24 hours; violative content removed.</li>
                  <li>• Routine rescans + audits to catch late-detected violations.</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">5. Live Streams & Chat</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Real-time AI monitoring for harassment, illegal activity, age-gate evasion, and prohibited solicitations.</li>
                  <li>• Moderators review flags; immediate takedowns/bans; law enforcement referrals where required.</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">6. Violations & Escalation</h3>
                <ul className="space-y-3 text-steel-300 ml-4">
                  <li>• <span className="text-white font-display">Content Removal</span> (immediate).</li>
                  <li>• <span className="text-white font-display">Account Sanctions:</span> warning/suspension; repeat or egregious = permanent ban.</li>
                  <li>• <span className="text-white font-display">Law Enforcement:</span> Mandatory reports of suspected CSAM to NCMEC and appropriate authorities.</li>
                  <li>• <span className="text-white font-display">Civil Action:</span> We reserve all rights to pursue injunctive relief and damages.</li>
                </ul>
              </div>
            </div>

            {/* PART III - COMPLIANCE & SECURITY */}
            <div className="mb-12">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-acid-lime/20 to-neon-pink/20 border border-acid-lime/30 mb-8">
                <h2 className="font-display text-4xl text-white text-center">III. Compliance, Security & Data Protection</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">7. Secure Handling & Retention</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Encrypted storage for IDs, consent forms, and verification artifacts.</li>
                  <li>• Access limited to vetted compliance personnel under confidentiality.</li>
                  <li>• Retention only as needed for legal obligations, dispute defense, fraud prevention, and auditability; biometric templates (facial vectors) retained only for verification windows and then deleted or irreversibly de-identified unless a longer legal obligation applies.</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">8. Legal Frameworks & Audits</h3>
                <p className="text-steel-300 mb-3">We adhere to:</p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">18 U.S.C. §2257</span> (Recordkeeping for adult content).</li>
                  <li>• <span className="text-white">DMCA</span> (takedown/notice-and-takedown procedures).</li>
                  <li>• <span className="text-white">U.S. & international anti-trafficking laws.</span></li>
                  <li>• <span className="text-white">Global privacy regimes</span> (GDPR/UK-GDPR/CPRA, etc.) as detailed in the Privacy Policy below.</li>
                  <li>• Quarterly internal compliance audits; periodic third-party reviews as needed.</li>
                </ul>
              </div>
            </div>

            {/* PART IV - UPDATES & CONTACT */}
            <div className="mb-12">
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">9. Policy Updates</h3>
                <p className="text-steel-300">We may revise this Policy; major updates will be announced on the Platforms. Continued use indicates acceptance.</p>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">10. Contact (Violations & Questions)</h3>
                <ul className="space-y-2 text-steel-300">
                  <li>• In-platform reporting tool</li>
                  <li>• <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono">support@fanzunlimited.com</a></li>
                  <li>• Fanz™ Unlimited Network LLC, 30 N Gould Street #45302, Sheridan, WY 82801</li>
                </ul>
              </div>
            </div>

            {/* PRIVACY POLICY SECTION */}
            <div className="my-16 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent"></div>

            <div className="mb-12">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-pink/30 to-neon-cyan/30 border border-neon-pink/50 mb-8">
                <h2 className="font-display text-5xl text-white text-center mb-2">Privacy Policy</h2>
                <p className="text-center text-steel-300 font-mono text-sm">
                  Effective Date: October 2, 2024 | Last Updated: November 5, 2025
                </p>
              </div>

              <p className="text-steel-300 mb-8 text-center">
                This Privacy Policy explains how FANZ collects, uses, shares, and protects personal information across our Platforms.
              </p>

              {/* A. Scope & Roles */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">A. Scope & Roles</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white font-display">Controller:</span> FANZ for most platform operations.</li>
                  <li>• <span className="text-white font-display">Processors/Sub-processors:</span> e.g., AgeChecker.Net (ID/age checks), payment processors (e.g., PayPal), analytics vendors (e.g., Google Analytics).</li>
                  <li>• <span className="text-white font-display">Joint Controllers:</span> Where required by law (we will disclose when applicable).</li>
                </ul>
              </div>

              {/* B. Categories of Data */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">B. Categories of Data We Collect</h3>
                <ol className="space-y-3 text-steel-300">
                  <li className="flex items-start gap-3">
                    <span className="text-acid-lime font-display">1.</span>
                    <div>
                      <span className="text-white font-display">Account & Contact Data:</span> name, handle, email, username, phone (optional).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-acid-lime font-display">2.</span>
                    <div>
                      <span className="text-white font-display">Government ID & Verification Data (Performers / as needed Users):</span> ID images, DOB, ID number metadata, live selfie and facial embeddings (biometric) used strictly for identity/age verification and anti-fraud.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-acid-lime font-display">3.</span>
                    <div>
                      <span className="text-white font-display">Financial & Transaction Data:</span> payment method tokens (held by processor), transaction IDs, payout history, tax forms (W-9/W-8).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-acid-lime font-display">4.</span>
                    <div>
                      <span className="text-white font-display">Content & Communications:</span> uploads, captions, messages, support requests.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-acid-lime font-display">5.</span>
                    <div>
                      <span className="text-white font-display">Device/Usage ("Device Information"):</span> IP, user agent, time zone, cookies, page interactions, referral paths, approximate location (derived from IP), server logs.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-acid-lime font-display">6.</span>
                    <div>
                      <span className="text-white font-display">Risk & Safety Signals:</span> fraud scores, moderation flags, trust & safety notes.
                    </div>
                  </li>
                </ol>
                <p className="text-steel-300 mt-4 p-4 rounded-lg bg-ink-800 border border-neon-cyan/30">
                  <span className="text-white font-display">Biometric Notice:</span> Where required by law, we obtain consent for facial recognition/biometric matching, use it solely for lawful age/ID verification, liveness detection, and fraud prevention, and apply minimal retention (see "Retention").
                </p>
              </div>

              {/* C. Sources */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">C. Sources</h3>
                <p className="text-steel-300">
                  Directly from you; automatically via cookies/logs; from verification providers, payment processors, and analytics partners as part of services you use.
                </p>
              </div>

              {/* D. Purposes & Legal Bases */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">D. Purposes & Legal Bases</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Provide services & support (contract necessity).</li>
                  <li>• Payments & payouts (contract necessity; legal obligation).</li>
                  <li>• Age/ID verification & fraud prevention (legal obligation; substantial public interest where applicable; legitimate interests).</li>
                  <li>• Moderation & safety (legal obligation; legitimate interests).</li>
                  <li>• Analytics & product improvement (legitimate interests; consent where required).</li>
                  <li>• Marketing (your preferences respected) (consent/legitimate interests).</li>
                  <li>• Legal compliance, audits, and enforcement (legal obligation; legitimate interests).</li>
                </ul>
                <p className="text-steel-300 mt-4 text-sm">
                  Where consent is the legal basis (e.g., certain biometrics or cookies in the EU/UK), you can withdraw consent at any time; withdrawal does not retroactively invalidate processing already performed.
                </p>
              </div>

              {/* E. Sharing */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">E. Sharing (No Sale of Personal Information)</h3>
                <p className="text-steel-300 mb-4 font-bold">We do not sell personal data. We may share with:</p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white font-display">Processors/Sub-processors:</span> AgeChecker.Net; payment processors (e.g., PayPal); hosting/CDN; analytics; anti-fraud; customer support.</li>
                  <li>• <span className="text-white font-display">Creators/Users:</span> when you publish or DM, information you choose to make public or send is visible to the intended recipients.</li>
                  <li>• <span className="text-white font-display">Law Enforcement/Legal:</span> to comply with law, protect safety, prevent fraud/abuse, respond to valid legal requests.</li>
                  <li>• <span className="text-white font-display">Corporate Transactions:</span> merger, acquisition, financing, or sale; data transfers subject to this Policy or successor policies with notice.</li>
                </ul>
              </div>

              {/* F. International Transfers */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">F. International Transfers</h3>
                <p className="text-steel-300">
                  Where data moves outside your country (e.g., to the U.S.), we use recognized transfer mechanisms (e.g., EU SCCs/UK IDTA) and additional safeguards as needed.
                </p>
              </div>

              {/* G. Retention */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">G. Retention</h3>
                <p className="text-steel-300 mb-4">
                  We retain data only as long as necessary for the purposes above and to comply with law, resolve disputes, and enforce agreements. Illustrative windows:
                </p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">Verification Images/Biometrics:</span> minimal period to complete verification + defined safety window; then delete or de-identify unless we must retain to meet legal obligations or to defend legal claims.</li>
                  <li>• <span className="text-white">Tax/Transaction Records:</span> per statutory requirements (often 3–7+ years).</li>
                  <li>• <span className="text-white">Moderation/Audit Logs:</span> risk-based periods to prevent repeated abuse and support law enforcement where warranted.</li>
                </ul>
              </div>

              {/* H. Security */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">H. Security</h3>
                <p className="text-steel-300">
                  We use administrative, technical, and physical safeguards (encryption in transit/at rest; access controls; segmented environments; monitoring). No system is 100% secure; report suspected issues to support@fanzunlimited.com.
                </p>
              </div>

              {/* I. Cookies */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">I. Cookies & Similar Tech</h3>
                <p className="text-steel-300">
                  We use cookies and SDKs for core functionality, analytics, security, and (where permitted) marketing. Manage settings in your browser and (where available) our cookie banner/preferences.
                </p>
              </div>

              {/* J. Your Rights */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">J. Your Rights</h3>
                <p className="text-steel-300 mb-4">
                  <span className="text-white font-display">U.S. (incl. CA/VA/CO/CT/UT) & Global:</span> Depending on your region, you may have rights to:
                </p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Access, correct, delete personal data.</li>
                  <li>• Portability (copy of your data).</li>
                  <li>• Restrict or object to certain processing.</li>
                  <li>• Opt-out of "sale"/"sharing" (CPRA) and targeted advertising. We do not sell data, but you may still exercise opt-out rights.</li>
                  <li>• Limit use of Sensitive Personal Information (CPRA).</li>
                  <li>• Withdraw consent (where applicable).</li>
                  <li>• Appeal a decision on your request (where required).</li>
                </ul>
                <p className="text-steel-300 mt-4 mb-4">
                  <span className="text-white font-display">EU/UK:</span> You also have the right to lodge a complaint with your local supervisory authority.
                </p>
                <p className="text-steel-300 mt-4">
                  <span className="text-white font-display">How to exercise:</span> Email support@fanzunlimited.com with your request. We will authenticate your identity (and, if applicable, your authorized agent) and respond within statutory timelines. We will not discriminate for exercising rights.
                </p>
              </div>

              {/* K. Children */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">K. Children</h3>
                <p className="text-steel-300">
                  Our Platforms are 18+ only. Attempts by minors to access will be blocked and can result in permanent IP/device bans. We do not knowingly collect data from children.
                </p>
              </div>

              {/* L. Automated Decisions */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">L. Automated Decisions & Profiling</h3>
                <p className="text-steel-300">
                  We use automated signals (e.g., fraud scores, moderation heuristics) to protect our community. You may request human review of decisions that produce legal or similarly significant effects where applicable law provides that right.
                </p>
              </div>

              {/* M. DMCA & NCII */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">M. DMCA & Non-Consensual Content</h3>
                <p className="text-steel-300">
                  We act on valid DMCA notices and on reports of non-consensual intimate imagery (NCII). Use the in-platform tool or email support@fanzunlimited.com. Expedite by including URLs, timestamps, and proof of ownership/identity.
                </p>
              </div>

              {/* N. Do Not Track */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">N. Do Not Track</h3>
                <p className="text-steel-300">
                  Our services currently do not respond to browser DNT signals. Use available privacy controls (cookie settings, analytics opt-outs) and platform settings.
                </p>
              </div>

              {/* O. Changes */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">O. Changes</h3>
                <p className="text-steel-300">
                  We may update this Policy. Material changes will be posted on the Platforms with an updated "Last Updated" date. Continued use constitutes acceptance.
                </p>
              </div>

              {/* P. Contact */}
              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30">
                <h3 className="font-display text-2xl text-white mb-4">P. Contact</h3>
                <div className="space-y-2">
                  <p className="text-white font-display">Fanz™ Unlimited Network LLC</p>
                  <p className="text-steel-300 font-mono text-sm">30 N Gould Street #45302</p>
                  <p className="text-steel-300 font-mono text-sm">Sheridan, WY 82801</p>
                  <a
                    href="mailto:support@fanzunlimited.com"
                    className="text-neon-pink font-mono hover:text-glow transition block mt-3"
                  >
                    support@fanzunlimited.com
                  </a>
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
