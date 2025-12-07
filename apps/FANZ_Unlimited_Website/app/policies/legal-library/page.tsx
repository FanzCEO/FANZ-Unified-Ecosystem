import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function LegalLibrary() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Comprehensive Legal Framework</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Legal Library
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective Date: October 24, 2024 | Last Updated: February 7, 2025
            </p>
            <p className="text-steel-300 mt-4 max-w-4xl mx-auto">
              Official Legal & Compliance Handbook for Fanz™ Unlimited Network (FUN) L.L.C.™
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Introduction */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-12">
              <h2 className="font-display text-3xl text-white mb-4">Document Purpose</h2>
              <p className="text-steel-300 mb-4">
                This document serves as the comprehensive legal framework for Fanz™ Unlimited Network (FUN) L.L.C.™, covering user agreements, content moderation, copyright compliance, data retention, and administrative policies.
              </p>
              <p className="text-steel-300">
                It ensures full compliance with U.S., EU, and international laws, while providing detailed enforcement guidelines for administrators and users.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 border border-neon-cyan/30 mb-12">
              <h2 className="font-display text-4xl text-white mb-6 text-center">Table of Contents</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-ink-900/70">
                  <h3 className="text-white font-display text-lg mb-2">1. User Agreements & Contracts</h3>
                  <ul className="text-steel-300 text-sm space-y-1">
                    <li>• User Agreement</li>
                    <li>• Admin Guide & Compliance Tracking</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-ink-900/70">
                  <h3 className="text-white font-display text-lg mb-2">2. Content Moderation & Enforcement</h3>
                  <ul className="text-steel-300 text-sm space-y-1">
                    <li>• Prohibited Content Policy</li>
                    <li>• DMCA Copyright Takedown Policy</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-ink-900/70">
                  <h3 className="text-white font-display text-lg mb-2">3. Data Retention & Security</h3>
                  <ul className="text-steel-300 text-sm space-y-1">
                    <li>• Data Retention & Deletion Policy</li>
                    <li>• Legal Hold & Investigation Protocol</li>
                    <li>• Retention & Deletion Notifications</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-ink-900/70">
                  <h3 className="text-white font-display text-lg mb-2">4. Admin Compliance & Training</h3>
                  <ul className="text-steel-300 text-sm space-y-1">
                    <li>• Admin Quick Reference Sheet</li>
                    <li>• Training Presentation Outline</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-ink-900/70 md:col-span-2">
                  <h3 className="text-white font-display text-lg mb-2">5. Legal Compliance & References</h3>
                  <ul className="text-steel-300 text-sm space-y-1">
                    <li>• U.S. Laws & Regulations</li>
                    <li>• European Union Laws</li>
                    <li>• International Copyright & Data Protection Treaties</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* SECTION 1 */}
            <div className="mb-16">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-pink/30 to-neon-cyan/30 border border-neon-pink/50 mb-8">
                <h2 className="font-display text-4xl text-white text-center">SECTION 1: USER AGREEMENTS & CONTRACTS</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">1.1 Legal Basis for the User Agreement</h3>
                <p className="text-steel-300 mb-4">
                  The User Agreement is a legally binding contract governed by:
                </p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">Contract Law of the State of Wyoming, United States</span></li>
                  <li>• <span className="text-white">Electronic Signatures in Global and National Commerce Act (E-SIGN Act)</span> (15 U.S.C. Chapter 96)</li>
                  <li>• <span className="text-white">Uniform Electronic Transactions Act (UETA)</span></li>
                  <li>• <span className="text-white">GDPR – Article 6(1)(b)</span> (Contract fulfillment)</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">1.2 Admin Escalation Process</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="pb-3 text-white font-display">Severity</th>
                        <th className="pb-3 text-white font-display">Action Required</th>
                        <th className="pb-3 text-white font-display">Escalation Level</th>
                      </tr>
                    </thead>
                    <tbody className="text-steel-300">
                      <tr className="border-b border-white/5">
                        <td className="py-3">Minor Violation</td>
                        <td className="py-3">Warning issued</td>
                        <td className="py-3">Admin Review</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Major Violation</td>
                        <td className="py-3">Content removal, suspension</td>
                        <td className="py-3">Senior Admin Review</td>
                      </tr>
                      <tr>
                        <td className="py-3">Severe Violation</td>
                        <td className="py-3">Permanent ban, law enforcement referral</td>
                        <td className="py-3">Legal Department</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION 2 */}
            <div className="mb-16">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-cyan/30 to-acid-lime/30 border border-neon-cyan/50 mb-8">
                <h2 className="font-display text-4xl text-white text-center">SECTION 2: CONTENT MODERATION & ENFORCEMENT</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">2.1 Prohibited Content Categories</h3>
                <p className="text-steel-300 mb-4 font-bold">
                  The following content is strictly prohibited and subject to immediate removal and legal action:
                </p>
                <div className="space-y-3 text-steel-300 ml-4">
                  <div>
                    <p className="text-neon-pink font-display">A. Child Sexual Abuse Material (CSAM)</p>
                    <p className="text-sm">Violation of 18 U.S.C. § 2252A (Federal Law). Mandatory reporting to NCMEC under 18 U.S.C. § 2258A.</p>
                  </div>
                  <div>
                    <p className="text-neon-pink font-display">B. Bestiality & Animal Cruelty</p>
                    <p className="text-sm">Criminalized under U.S. Animal Crush Video Prohibition Act (18 U.S.C. § 48).</p>
                  </div>
                  <div>
                    <p className="text-neon-pink font-display">C. Non-Consensual Intimate Media (Revenge Porn)</p>
                    <p className="text-sm">Illegal under state revenge porn laws and GDPR Article 9. Removed within 24 hours.</p>
                  </div>
                  <div>
                    <p className="text-neon-pink font-display">D. Human Trafficking & Sexual Exploitation</p>
                    <p className="text-sm">Criminal under Trafficking Victims Protection Act (22 U.S.C. § 7102).</p>
                  </div>
                  <div>
                    <p className="text-neon-pink font-display">E. Hate Speech, Terrorist Content, Violent Extremism</p>
                    <p className="text-sm">Content removal within 24 hours under EU Digital Services Act (DSA) 2022/2065.</p>
                  </div>
                  <div>
                    <p className="text-neon-pink font-display">F. Copyright Infringement</p>
                    <p className="text-sm">Covered under Digital Millennium Copyright Act (DMCA) (17 U.S.C. § 512).</p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">2.2 DMCA Takedown Process</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">Step 1: Receipt of Complaint</p>
                    <p className="text-steel-300 text-sm">Must include signature, copyrighted work identification, location of infringing material, and legal statement.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">Step 2: Content Removal</p>
                    <p className="text-steel-300 text-sm">Admins must disable access within 24 hours of valid claim.</p>
                  </div>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">Step 3: User Notification</p>
                    <p className="text-steel-300 text-sm">Users have 10 business days to respond with counter-notice.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">Repeat Infringer Policy</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="pb-3 text-white font-display">Offense</th>
                        <th className="pb-3 text-white font-display">Action Taken</th>
                      </tr>
                    </thead>
                    <tbody className="text-steel-300">
                      <tr className="border-b border-white/5">
                        <td className="py-3">1st Offense</td>
                        <td className="py-3">Warning & content removal</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">2nd Offense</td>
                        <td className="py-3">Temporary account suspension</td>
                      </tr>
                      <tr>
                        <td className="py-3">3rd Offense</td>
                        <td className="py-3 text-neon-pink font-display">Permanent account termination</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION 3 */}
            <div className="mb-16">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-acid-lime/30 to-neon-pink/30 border border-acid-lime/50 mb-8">
                <h2 className="font-display text-4xl text-white text-center">SECTION 3: DATA RETENTION, DELETION & SECURITY</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">3.1 Data Retention Schedules</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="pb-3 text-white font-display">Data Type</th>
                        <th className="pb-3 text-white font-display">Retention Period</th>
                        <th className="pb-3 text-white font-display">Legal Reference</th>
                      </tr>
                    </thead>
                    <tbody className="text-steel-300">
                      <tr className="border-b border-white/5">
                        <td className="py-3">User Agreements</td>
                        <td className="py-3">5 years after termination</td>
                        <td className="py-3">GDPR, CCPA</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Billing Records</td>
                        <td className="py-3">7 years</td>
                        <td className="py-3">IRS Tax Compliance</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">Content Uploads</td>
                        <td className="py-3">Until account deletion</td>
                        <td className="py-3">Platform Policy</td>
                      </tr>
                      <tr>
                        <td className="py-3">Forensic Records</td>
                        <td className="py-3">10 years</td>
                        <td className="py-3">Law Enforcement</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">3.2 User Data Deletion Rights</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-display text-lg mb-2">GDPR Article 17 – Right to Erasure</h4>
                    <p className="text-steel-300">Users in the European Economic Area (EEA) can request deletion of their personal data when their account is no longer needed, data was collected unlawfully, or they withdraw consent.</p>
                  </div>
                  <div>
                    <h4 className="text-white font-display text-lg mb-2">CCPA Section 1798.105 – Right to Request Deletion</h4>
                    <p className="text-steel-300">California users can request data deletion, except where data is needed for tax/fraud prevention, contract enforcement, or legal retention.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">3.3 Legal Hold & Investigation Protocol</h3>
                <p className="text-steel-300 mb-4">
                  A <span className="text-white font-display">Legal Hold</span> is when FUN must preserve certain user data for an active investigation, lawsuit, or regulatory request.
                </p>
                <p className="text-steel-300 mb-4 font-bold">
                  Legal holds override normal deletion policies until the hold is lifted.
                </p>
                <div className="p-4 rounded-lg bg-ink-800 border border-neon-pink/30">
                  <p className="text-white font-display mb-2">When Legal Holds Are Required:</p>
                  <ul className="space-y-2 text-steel-300 text-sm ml-4">
                    <li>✓ Government or law enforcement requests data preservation</li>
                    <li>✓ User files lawsuit against FUN or another user</li>
                    <li>✓ Copyright holder disputes DMCA counter-notification</li>
                    <li>✓ Security breach investigation requires forensic analysis</li>
                  </ul>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">Secure Data Deletion Protocol</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">DoD 5220.22-M Standard</span> for digital erasure</li>
                  <li>• <span className="text-white">NIST 800-88 Guidelines</span> for Secure Data Sanitization for forensic deletions</li>
                </ul>
              </div>
            </div>

            {/* SECTION 4 */}
            <div className="mb-16">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-pink/30 to-acid-lime/30 border border-neon-pink/50 mb-8">
                <h2 className="font-display text-4xl text-white text-center">SECTION 4: ADMIN COMPLIANCE & TRAINING</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">4.1 Admin Quick Reference</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th className="pb-3 text-white font-display">Task</th>
                        <th className="pb-3 text-white font-display">Deadline</th>
                        <th className="pb-3 text-white font-display">Responsible Department</th>
                      </tr>
                    </thead>
                    <tbody className="text-steel-300">
                      <tr className="border-b border-white/5">
                        <td className="py-3">DMCA Complaint Processing</td>
                        <td className="py-3">24 Hours</td>
                        <td className="py-3">Legal Team</td>
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="py-3">User Suspension for Violations</td>
                        <td className="py-3">Immediately</td>
                        <td className="py-3">Moderation Team</td>
                      </tr>
                      <tr>
                        <td className="py-3">Retention Review</td>
                        <td className="py-3">Annually</td>
                        <td className="py-3">Data Compliance Team</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">4.2 Required Compliance Logs</h3>
                <ul className="space-y-3 text-steel-300 ml-4">
                  <li>• <span className="text-white font-display">User Agreement Compliance Log</span> (5 years retention)</li>
                  <li>• <span className="text-white font-display">Content Moderation Log</span> (3 years retention)</li>
                  <li>• <span className="text-white font-display">Complaint Resolution Log</span> (3 years retention)</li>
                  <li>• <span className="text-white font-display">DMCA Compliance Log</span> (3 years retention)</li>
                  <li>• <span className="text-white font-display">Legal Hold Registry</span> (Until hold is lifted)</li>
                </ul>
              </div>
            </div>

            {/* SECTION 5 */}
            <div className="mb-16">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-neon-cyan/30 to-neon-pink/30 border border-neon-cyan/50 mb-8">
                <h2 className="font-display text-4xl text-white text-center">SECTION 5: LEGAL COMPLIANCE & REFERENCES</h2>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">5.1 U.S. Laws & Regulations</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">Digital Millennium Copyright Act (DMCA)</span>, 17 U.S.C. § 512</li>
                  <li>• <span className="text-white">Communications Decency Act (CDA) – Section 230</span>, 47 U.S.C. § 230</li>
                  <li>• <span className="text-white">California Consumer Privacy Act (CCPA)</span>, Cal. Civ. Code § 1798.100</li>
                  <li>• <span className="text-white">Children's Online Privacy Protection Act (COPPA)</span>, 15 U.S.C. §§ 6501–6506</li>
                  <li>• <span className="text-white">18 U.S.C. § 2252A</span> (CSAM Federal Law)</li>
                  <li>• <span className="text-white">18 U.S.C. § 48</span> (Animal Crush Video Prohibition)</li>
                  <li>• <span className="text-white">22 U.S.C. § 7102</span> (Trafficking Victims Protection Act)</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">5.2 European Union Laws</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">General Data Protection Regulation (GDPR)</span>, EU Regulation 2016/679</li>
                  <li>• <span className="text-white">EU Digital Services Act (DSA)</span>, Regulation 2022/2065</li>
                  <li>• <span className="text-white">EU Copyright Directive</span>, 2019/790</li>
                  <li>• <span className="text-white">ePrivacy Directive</span> (Cookie Law)</li>
                  <li>• <span className="text-white">EU Terrorist Content Regulation</span>, 2021/784</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">5.3 International Treaties & Standards</h3>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• <span className="text-white">Berne Convention</span> for the Protection of Literary and Artistic Works</li>
                  <li>• <span className="text-white">WIPO Copyright Treaty (WCT)</span></li>
                  <li>• <span className="text-white">ISO 27001</span> Information Security Management Standard</li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
                <h3 className="font-display text-2xl text-white mb-4">Legal Consequences for Non-Compliance</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">DMCA Violations</p>
                    <p className="text-steel-300 text-sm">Statutory Damages: Up to $150,000 per instance of willful infringement (17 U.S.C. § 504)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">GDPR Violations</p>
                    <p className="text-steel-300 text-sm">Fines: Up to €20 million or 4% of annual global revenue (whichever is higher)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">CCPA Violations</p>
                    <p className="text-steel-300 text-sm">Fines: Up to $7,500 per intentional violation</p>
                  </div>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                    <p className="text-white font-display mb-2">EU Digital Services Act</p>
                    <p className="text-steel-300 text-sm">Fines: Up to 6% of global revenue</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Statement */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 border border-neon-pink/50">
              <h2 className="font-display text-3xl text-white mb-4 text-center">Final Legal Statement</h2>
              <p className="text-steel-300 mb-4 text-center">
                This document establishes the official legal framework for FUN administrators and users, ensuring compliance with all applicable U.S., EU, and international laws.
              </p>
              <p className="text-steel-300 mb-6 text-center font-bold">
                Failure to comply with these policies may result in legal consequences, including platform bans, lawsuits, or regulatory action.
              </p>
              <div className="text-center">
                <p className="text-white font-display mb-2">Joshua B Stone</p>
                <p className="text-steel-300 font-mono text-sm mb-4">President & CEO, Fanz™ Unlimited Network LLC</p>
                <p className="text-steel-300 font-mono text-sm">Last Revised on February 7, 2025</p>
                <p className="text-steel-300 font-mono text-sm mt-4">© 2025 Fanz™ Unlimited Network LLC. All Rights Reserved.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
