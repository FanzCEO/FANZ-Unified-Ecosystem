import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function ComplianceGuide() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Creator Resources</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Compliance Guide for Starz & Fanz
            </h1>
            <p className="text-steel-300 font-mono text-sm mb-2">
              Effective Date: January 30, 2025
            </p>
            <p className="text-steel-300 max-w-3xl mx-auto">
              Your roadmap to staying compliant, protecting yourself legally, and building a sustainable creator business on FANZ platforms.
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Welcome */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Welcome, Content Stars!</h2>
              <p className="text-steel-300 mb-4">
                This guide is specifically for Content Stars (creators/performers) and Co-Stars (collaborators) on FANZ platforms. Whether you're just starting or are an established creator, this resource will help you understand legal requirements, avoid common pitfalls, and protect your business.
              </p>
              <div className="p-4 rounded-lg bg-ink-800 border border-neon-cyan/30 mt-4">
                <p className="text-white font-display mb-2">Who Should Read This?</p>
                <ul className="space-y-1 text-steel-300 text-sm ml-4">
                  <li>• Solo creators and performers</li>
                  <li>• Collaborative creators working with co-stars</li>
                  <li>• Agencies and management companies representing creators</li>
                  <li>• Anyone monetizing content on FanzUnlimited, BoyFanz, GirlFanz, PupFanz, or related platforms</li>
                </ul>
              </div>
            </div>

            {/* Getting Started */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1. Getting Started: Account Setup & Verification</h2>

              <h3 className="font-display text-2xl text-white mb-3">1.1 Creator Application Checklist</h3>
              <p className="text-steel-300 mb-4">Before you can monetize, you must complete:</p>
              <ul className="space-y-3 text-steel-300 ml-4">
                <li>
                  <span className="text-white font-display">✅ Government ID Verification</span>
                  <p className="text-sm mt-1">Valid passport, driver's license, or state ID. Must show your face, date of birth, and full legal name. You'll complete a real-time selfie + liveness check through VerifyMy.</p>
                </li>
                <li>
                  <span className="text-white font-display">✅ Tax Form Submission</span>
                  <p className="text-sm mt-1">U.S. creators: W-9. International creators: W-8BEN or equivalent. Required for all payouts. See Section 2 for tax details.</p>
                </li>
                <li>
                  <span className="text-white font-display">✅ Banking Information</span>
                  <p className="text-sm mt-1">ACH direct deposit (U.S.), wire transfer, PayPal, or cryptocurrency wallet. Must match the name on your ID.</p>
                </li>
                <li>
                  <span className="text-white font-display">✅ Phone & Email Verification</span>
                  <p className="text-sm mt-1">One-time code sent to your phone and email. Required for account security and two-factor authentication.</p>
                </li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">1.2 Periodic Reverification</h3>
              <p className="text-steel-300 mb-4">
                You may be asked to reverify your identity if:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Your ID is expiring or has expired</li>
                <li>• Fraud or account-sharing is suspected</li>
                <li>• You change your payout method or banking information</li>
                <li>• You've been inactive for 12+ months and return to the platform</li>
              </ul>

              <div className="p-4 rounded-lg bg-ink-800 border border-neon-pink/30 mt-4">
                <p className="text-white font-display mb-2">🚨 No Sharing Accounts</p>
                <p className="text-steel-300 text-sm">
                  Each creator account must belong to ONE verified individual. Account sharing, even with romantic/business partners, is prohibited and will result in immediate suspension.
                </p>
              </div>
            </div>

            {/* Tax Compliance */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2. Tax Compliance for Creators</h2>

              <h3 className="font-display text-2xl text-white mb-3">2.1 Understanding Your Tax Obligations</h3>
              <p className="text-steel-300 mb-4">
                You are an <span className="text-white font-display">independent contractor</span>, not an employee. This means:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• FANZ does <span className="text-neon-pink">NOT</span> withhold income taxes from your earnings</li>
                <li>• You are responsible for paying federal, state, and local taxes on your earnings</li>
                <li>• You must file quarterly estimated taxes if you expect to owe $1,000+ annually</li>
                <li>• You can deduct business expenses (equipment, props, internet, etc.) on Schedule C</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">2.2 What FANZ Reports to the IRS</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left mt-4">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Creator Type</th>
                      <th className="pb-3 text-white font-display">Earnings Threshold</th>
                      <th className="pb-3 text-white font-display">Form Issued</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">U.S. Creators</td>
                      <td className="py-3">$600+ per year</td>
                      <td className="py-3">1099-NEC (by January 31)</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">International Creators</td>
                      <td className="py-3">Varies by treaty</td>
                      <td className="py-3">1042-S or equivalent</td>
                    </tr>
                    <tr>
                      <td className="py-3">Payment Processors (PayPal, etc.)</td>
                      <td className="py-3">$20,000+ and 200+ transactions</td>
                      <td className="py-3">1099-K</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">2.3 Quarterly Estimated Tax Deadlines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Q1: April 15</p>
                  <p className="text-steel-300 text-sm">Earnings: Jan 1 - Mar 31</p>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Q2: June 15</p>
                  <p className="text-steel-300 text-sm">Earnings: Apr 1 - May 31</p>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Q3: September 15</p>
                  <p className="text-steel-300 text-sm">Earnings: Jun 1 - Aug 31</p>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Q4: January 15 (next year)</p>
                  <p className="text-steel-300 text-sm">Earnings: Sep 1 - Dec 31</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-ink-800 border border-neon-cyan/30 mt-6">
                <p className="text-white font-display mb-2">💡 Tax Pro Tip</p>
                <p className="text-steel-300 text-sm">
                  Set aside 25-30% of each payout for taxes. Consider working with a CPA familiar with adult content/creator businesses. FANZ does not provide tax advice.
                </p>
              </div>
            </div>

            {/* Content Requirements */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3. Content Requirements & 2257 Compliance</h2>

              <h3 className="font-display text-2xl text-white mb-3">3.1 Age Verification for Co-Stars</h3>
              <p className="text-steel-300 mb-4">
                If you collaborate with anyone in your content (co-stars, models, performers), you <span className="text-neon-pink font-display">MUST</span> verify they are 18+ and maintain records:
              </p>
              <ul className="space-y-3 text-steel-300 ml-4">
                <li>
                  <span className="text-white font-display">Government ID Copy</span>
                  <p className="text-sm mt-1">Photocopy or scanned image showing full name, date of birth, and photo. Keep securely for 7 years.</p>
                </li>
                <li>
                  <span className="text-white font-display">Model Release Form</span>
                  <p className="text-sm mt-1">Signed consent from each co-star permitting use of their likeness. Download template from your creator dashboard.</p>
                </li>
                <li>
                  <span className="text-white font-display">Content Records</span>
                  <p className="text-sm mt-1">Keep a list of which content features which co-stars. FANZ maintains platform-level 2257 records, but you should keep backup records.</p>
                </li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">3.2 Consent & Safe Words</h3>
              <p className="text-steel-300 mb-4">
                For BDSM, fetish, or role-play content involving simulated non-consent:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Document pre-scene consent conversations (video/written)</li>
                <li>• Establish and use safe words/signals</li>
                <li>• Include aftercare and check-ins for intense scenes</li>
                <li>• Never upload content where consent was withdrawn or safe word was used</li>
              </ul>

              <div className="p-4 rounded-lg bg-ink-800 border border-neon-pink/50 mt-4">
                <p className="text-white font-display mb-2">🚨 Zero Tolerance Content</p>
                <p className="text-steel-300 text-sm mb-2">
                  The following content will result in immediate permanent ban:
                </p>
                <ul className="space-y-1 text-steel-300 text-sm ml-4">
                  <li>• Minors (anyone under 18) in any context</li>
                  <li>• Bestiality or animal abuse</li>
                  <li>• Non-consensual "revenge porn" or leaked content</li>
                  <li>• Content depicting actual violence, gore, or death</li>
                  <li>• Human trafficking or coerced participation</li>
                </ul>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4. Intellectual Property & DMCA</h2>

              <h3 className="font-display text-2xl text-white mb-3">4.1 Protecting Your Content</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• You own your content. FANZ only receives a license to host/distribute it.</li>
                <li>• Watermark your photos and videos with your creator name or platform logo</li>
                <li>• Register your most valuable content with the U.S. Copyright Office ($65 per work or $85 per group)</li>
                <li>• Use FANZ's DMCA takedown service to remove pirated content from other sites (free for creators)</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">4.2 Respecting Others' IP</h3>
              <p className="text-steel-300 mb-4">Do NOT upload content that:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Contains copyrighted music without a license (use royalty-free music instead)</li>
                <li>• Features trademarked characters or brands without permission</li>
                <li>• Includes clips from movies, TV shows, or other creators' content</li>
                <li>• Uses someone else's photos/videos without their consent</li>
              </ul>

              <div className="p-4 rounded-lg bg-ink-800 border border-white/5 mt-4">
                <p className="text-white font-display mb-2">DMCA Strike Policy</p>
                <ul className="space-y-1 text-steel-300 text-sm ml-4">
                  <li>• 1st strike: Content removed, warning issued</li>
                  <li>• 2nd strike: 7-day suspension</li>
                  <li>• 3rd strike: Permanent account termination</li>
                </ul>
              </div>
            </div>

            {/* Payouts & Finances */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5. Payouts & Financial Management</h2>

              <h3 className="font-display text-2xl text-white mb-3">5.1 Understanding Your Earnings</h3>
              <div className="p-6 rounded-lg bg-ink-800 border border-neon-cyan/30 mb-6">
                <p className="text-white font-display mb-3">Revenue Share Breakdown</p>
                <div className="space-y-2 text-steel-300 text-sm">
                  <div className="flex justify-between">
                    <span>Subscriber pays:</span>
                    <span className="text-white">$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform fee (20%):</span>
                    <span className="text-neon-pink">-$2.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment processing (2.9% + $0.30):</span>
                    <span className="text-neon-pink">-$0.59</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span className="text-white font-display">You receive:</span>
                    <span className="text-acid-lime font-display">$7.41</span>
                  </div>
                </div>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">5.2 Payout Schedule & Minimums</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Weekly payouts: Every Monday (minimum $20 via ACH)</li>
                <li>• Monthly payouts: 1st of the month (minimum $20 via ACH)</li>
                <li>• Processing time: 3-5 business days after payout initiation</li>
                <li>• New creators: First 30 days of earnings held for chargeback protection</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">5.3 Avoiding Payout Delays</h3>
              <p className="text-steel-300 mb-4">Common reasons for payout holds:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Incomplete tax forms (W-9/W-8BEN missing or expired)</li>
                <li>• High chargeback rate ({'>'}1% of transactions)</li>
                <li>• Pending policy violation investigation</li>
                <li>• Banking information doesn't match verified ID name</li>
              </ul>
            </div>

            {/* Community Guidelines */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6. Community Guidelines & Best Practices</h2>

              <h3 className="font-display text-2xl text-white mb-3">6.1 Building a Sustainable Business</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Set realistic subscription prices ($5-$50/month is typical)</li>
                <li>• Post consistently (3-5 times per week minimum)</li>
                <li>• Engage with subscribers via DMs and comments</li>
                <li>• Offer exclusive PPV content for top spenders</li>
                <li>• Promote your FANZ page on social media (Twitter, Reddit, Instagram)</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">6.2 Ethical Subscriber Interactions</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Deliver promised content in a timely manner</li>
                <li>• Don't make false promises to extract tips or subscriptions</li>
                <li>• Disclose if content is pre-recorded vs. custom/personalized</li>
                <li>• Respect subscriber privacy (don't leak DMs or payment info)</li>
                <li>• Block/report abusive or harassing subscribers</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">6.3 Mental Health & Burnout Prevention</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Set boundaries on availability and response times</li>
                <li>• Take breaks when needed (announce hiatuses to subscribers)</li>
                <li>• Access FANZ's <a href="/policies/healthcare-resources" className="text-neon-cyan hover:text-glow transition">Healthcare Resources</a> for mental health support</li>
                <li>• Join creator communities (CreatorFanz Discord, subreddit, etc.) for peer support</li>
              </ul>
            </div>

            {/* Reporting & Safety */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">7. Reporting, Safety & Enforcement</h2>

              <h3 className="font-display text-2xl text-white mb-3">7.1 When to Report Issues</h3>
              <p className="text-steel-300 mb-4">Report immediately if you encounter:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Subscribers requesting illegal content (minors, bestiality, etc.)</li>
                <li>• Threats, doxxing, or harassment</li>
                <li>• Someone impersonating you or stealing your content</li>
                <li>• Payment fraud or chargeback abuse</li>
                <li>• Evidence of human trafficking or coercion</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">7.2 How to Report</h3>
              <div className="space-y-3 text-steel-300">
                <div>
                  <p className="text-white font-display mb-1">In-Platform Reporting</p>
                  <p className="text-sm">Click "Report" on any message, comment, or profile. Select violation type and provide details.</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Email Support</p>
                  <p className="text-sm">
                    <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono">support@fanzunlimited.com</a> for general issues<br/>
                    <a href="mailto:compliance@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono">compliance@fanzunlimited.com</a> for urgent safety/legal issues
                  </p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Emergency</p>
                  <p className="text-sm">If you are in immediate physical danger, call 911 first, then report to FANZ.</p>
                </div>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">7.3 What Happens After You Report</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Acknowledgment within 24 hours</li>
                <li>• Investigation completed within 7 business days (urgent cases within 24 hours)</li>
                <li>• You receive outcome notification (action taken or case closed)</li>
                <li>• No retaliation against good-faith reporters</li>
              </ul>
            </div>

            {/* Quick Reference */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">Quick Reference: Key Contacts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Creator Support</p>
                  <a href="mailto:creators@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    creators@fanzunlimited.com
                  </a>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Payouts & Billing</p>
                  <a href="mailto:payouts@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    payouts@fanzunlimited.com
                  </a>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Tax Questions</p>
                  <a href="mailto:tax@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    tax@fanzunlimited.com
                  </a>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">DMCA / Copyright</p>
                  <a href="mailto:dmca@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    dmca@fanzunlimited.com
                  </a>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Compliance & Legal</p>
                  <a href="mailto:compliance@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    compliance@fanzunlimited.com
                  </a>
                </div>
                <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                  <p className="text-white font-display mb-1">Crisis Support</p>
                  <a href="/policies/healthcare-resources" className="text-neon-cyan hover:text-glow transition font-mono text-sm">
                    Healthcare Resources
                  </a>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-ink-800 border border-neon-cyan/30">
                <p className="text-white font-display mb-2">📚 Additional Resources</p>
                <ul className="space-y-1 text-steel-300 text-sm ml-4">
                  <li>• <a href="/policies/user-agreement" className="text-neon-pink hover:text-glow transition">User Agreement (Creator Contract)</a></li>
                  <li>• <a href="/policies/legal-library" className="text-neon-pink hover:text-glow transition">Legal Library (Detailed Compliance Framework)</a></li>
                  <li>• <a href="/policies/age-verification" className="text-neon-pink hover:text-glow transition">Age Verification Protocols</a></li>
                  <li>• <a href="/policies/transaction-chargeback" className="text-neon-pink hover:text-glow transition">Transaction & Chargeback Policy</a></li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
