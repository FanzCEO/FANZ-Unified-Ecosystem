import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Legal Agreement</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Terms of Service
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Revised: November 5, 2025 | Effective: December 5, 2024
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Definitions */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Definitions</h2>
              <ul className="space-y-3 text-steel-300">
                <li>• <span className="text-white font-display">"FANZ," "Company," or "we"</span> means FANZ Group Holdings LLC and its affiliates, subsidiaries, parent entities, related companies, successors and assigns (collectively "FANZ Entities").</li>
                <li>• <span className="text-white font-display">"You" or "User"</span> means any individual or entity that accesses or uses any FANZ service, including but not limited to visitors, registered account holders, creators, employees, contractors, vendors, investors, and affiliates.</li>
                <li>• <span className="text-white font-display">"Platforms"</span> means FanzUnlimited.com, BoyFanz, GirlFanz, PupFanz, any FANZ mobile apps, stores, media services, and all associated online/offline offerings.</li>
                <li>• <span className="text-white font-display">"Content"</span> means all material uploaded, posted, published, transmitted, or otherwise provided to FANZ or through FANZ platforms.</li>
              </ul>
            </div>

            {/* Section 1 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1. Acceptance; Binding Effect</h2>
              <p className="text-steel-300">
                By accessing or using any FANZ Platforms or services you accept and agree to be bound by this TOS and all referenced policies. This TOS constitutes a valid and binding contract between you and FANZ. If you do not agree, do not access or use FANZ Platforms.
              </p>
            </div>

            {/* Section 2 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2. Scope; Parties Covered</h2>
              <p className="text-steel-300">
                This TOS applies to all Users and covers acts or omissions by Users, creators, employees, contractors, vendors, affiliates, partners, officers, directors, investors, and any person or entity acting on behalf of a User or with User authorization (each a "Covered Person"). All Covered Persons are bound by and benefit from the protections, indemnities, releases, and limitations provided herein.
              </p>
            </div>

            {/* Section 3 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3. Eligibility; Representations & Warranties</h2>
              <p className="text-steel-300 mb-3">
                By using FANZ Platforms you represent and warrant that you:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>(a) are at least 18 years old (or the age of majority in your jurisdiction);</li>
                <li>(b) have full authority to enter into this TOS;</li>
                <li>(c) will comply with all applicable laws and this TOS; and</li>
                <li>(d) if you are an investor or third-party partner, you represent you have received all required disclosures, are sophisticated or represented by counsel, and are not relying on any FANZ oral statements.</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4. User Accounts; Security; Authority</h2>
              <p className="text-steel-300">
                You are responsible for all account activity. You will maintain accurate information and will not allow unauthorized access. If you provide services to FANZ (including employees/contractors), you warrant you are legally authorized to do so and will comply with additional agreements FANZ may require.
              </p>
            </div>

            {/* Section 5 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5. Content Ownership; Limited License</h2>
              <p className="text-steel-300">
                Creators retain ownership of their Content. By providing Content you grant FANZ a perpetual, irrevocable, worldwide, transferable, sublicensable, royalty-free license to use, reproduce, display, perform, distribute, host, and promote the Content across any medium for any purpose (including marketing and commercial exploitation) and to enforce FANZ rights related to such Content.
              </p>
            </div>

            {/* Section 6 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6. Compliance; Age Verification; 2257</h2>
              <p className="text-steel-300">
                All Content must comply with applicable law (including 18 U.S.C. §2257) and FANZ policies. You agree to comply with FANZ's age-verification and recordkeeping procedures and to provide accurate proof of age/identity when required.
              </p>
            </div>

            {/* Section 7 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">7. Prohibited Conduct & Enforcement</h2>
              <p className="text-steel-300">
                FANZ may monitor, moderate, remove, or disable access to Content or accounts at its sole discretion. FANZ may take any action (including terminating services, pursuing injunctive relief, notifying authorities) necessary to protect FANZ, its Users, or third parties.
              </p>
            </div>

            {/* Section 8 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">8. Fees, Payment, Chargebacks</h2>
              <p className="text-steel-300">
                Payment terms are governed by FANZ's billing policies. You agree that FANZ and its processors may charge your payment method, that subscriptions auto-renew, and that FANZ may pursue chargebacks, collection costs, and damages for payment disputes. All fees are non-refundable to the fullest extent permitted by law.
              </p>
            </div>

            {/* Section 9 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">9. Intellectual Property; Enforcement</h2>
              <p className="text-steel-300">
                FANZ IP (trademarks, logos, trade dress) is owned by FANZ and protected. FANZ has sole authority to enforce its IP rights. You will not contest FANZ's ownership or rights.
              </p>
            </div>

            {/* Section 10 - Disclaimer */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">10. DISCLAIMER OF WARRANTIES — BROAD</h2>
              <p className="text-steel-300 uppercase text-sm">
                EXCEPT WHERE NOT PERMITTED BY APPLICABLE LAW, FANZ PROVIDES THE PLATFORMS AND SERVICES "AS IS," "AS AVAILABLE," AND WITHOUT ANY WARRANTY OR CONDITION, EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, OR THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE. FANZ MAKES NO REPRESENTATIONS OR WARRANTIES REGARDING THIRD-PARTY SERVICES, ADVERTISERS, OR USERS.
              </p>
            </div>

            {/* Section 11 - Limitation of Liability */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">11. LIMITATION OF LIABILITY — MAXIMUM PROTECTION</h2>
              <p className="text-steel-300 uppercase text-sm mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT WILL ANY FANZ ENTITY OR ANY RELATED PERSON OR AFFILIATE (INCLUDING OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, INVESTORS, CONTRACTORS, LICENSEES, SUCCESSORS, OR ASSIGNS) BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES, LOSS OF PROFITS, LOSS OF GOODWILL, LOSS OF DATA, LOSS OF USE, OR BUSINESS INTERRUPTION ARISING OUT OF OR IN CONNECTION WITH THE SERVICES, CONTENT, OR THIS TOS, REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, NEGLIGENCE) AND EVEN IF FANZ HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>
              <p className="text-steel-300 uppercase text-sm">
                THE AGGREGATE LIABILITY OF FANZ ENTITIES FOR ANY AND ALL CLAIMS, WHETHER IN CONTRACT, TORT, WARRANTY, OR OTHERWISE, SHALL NOT EXCEED THE GREATER OF (A) ONE THOUSAND U.S. DOLLARS (US$1,000), OR (B) THE TOTAL AMOUNT PAID BY YOU TO FANZ IN THE SIX (6) MONTHS PRECEDING THE CLAIM. This cap applies to all Covered Persons and claims.
              </p>
            </div>

            {/* Section 12 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">12. EXPRESS RELEASE; WAIVER; ASSUMPTION OF RISK</h2>
              <p className="text-steel-300">
                To the maximum extent permitted by law, you, on behalf of yourself and your agents, affiliates, heirs, successors and assigns, hereby release, waive, and forever discharge FANZ Entities from any and all claims, demands, damages, liabilities, losses, costs, and expenses (including attorneys' fees) of any kind or nature, whether known or unknown, arising out of or in any way connected with your access to, use of, or inability to use FANZ Platforms or any Content. You expressly assume all risk related to use of the services.
              </p>
            </div>

            {/* Section 13 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">13. INDEMNIFICATION — BROADEST POSSIBLE</h2>
              <p className="text-steel-300 mb-4">
                You will indemnify, defend and hold harmless FANZ Entities from and against any and all claims, losses, liabilities, damages, costs and expenses (including reasonable attorneys' fees and court costs) arising out of or relating to (a) your Content; (b) your violation of this TOS; (c) your violation of law or third-party rights; (d) your use of third-party services; and (e) any representations or warranties you made.
              </p>
              <p className="text-steel-300 mb-4">
                Investors, officers, directors, and any entity affiliated with a User agree to indemnify FANZ to the same extent as above for any claims arising from their status, investment activities, or communications related to FANZ.
              </p>
              <p className="text-steel-300">
                FANZ may assume control of its defense at its option. You will cooperate with FANZ's defense and may not settle any claim without FANZ's written consent.
              </p>
            </div>

            {/* Section 14 - Arbitration */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">14. NO CLASS ACTION; ARBITRATION; NO JURY TRIAL; VENUE</h2>
              <div className="space-y-4 text-steel-300">
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Arbitration Agreement — Mandatory, Individual, Binding</h3>
                  <p>Except for the limited exceptions below, you and FANZ agree that any dispute, claim, or controversy arising out of or relating to this TOS, the relationship between you and FANZ, or your use of FANZ services will be resolved exclusively by final and binding arbitration under the Federal Arbitration Act.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">No Class/Representative Actions</h3>
                  <p>You and FANZ expressly waive any right to participate in a class action, private attorney general, or representative capacity. Arbitration must be on an individual basis only.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Arbitration Provider & Rules</h3>
                  <p>Arbitration will be conducted by JAMS (or another mutually agreed provider) under its comprehensive arbitration rules. Arbitration will be held in Sheridan, Wyoming (or a location selected by FANZ if permitted by law). If any portion of this arbitration clause is found unenforceable, the remaining provisions remain in effect to the greatest extent permitted by law.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Relief & Remedies</h3>
                  <p>The arbitrator may award any relief permitted by applicable law, subject to the limitations and caps in this TOS.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Small Claims Exception</h3>
                  <p>Either party may elect to pursue a claim in small claims court for disputes within the small claims jurisdictional limit; such claim must be brought in Sheridan County, Wyoming.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">Court Carve-Out for Equitable Relief</h3>
                  <p>Notwithstanding the above, FANZ may seek injunctive, equitable, or provisional relief in any court of competent jurisdiction to protect FANZ IP rights, to prevent unauthorized access to systems, or for emergency relief; any other dispute remains subject to arbitration.</p>
                </div>
                <div>
                  <h3 className="text-white font-display text-xl mb-2">No Jury Trial</h3>
                  <p>To the extent a court has jurisdiction, you and FANZ waive any right to a jury trial.</p>
                </div>
                <p className="text-sm italic mt-4">
                  If you wish to opt out of the arbitration and class-action waiver, you must send a written notice to FANZ within 30 days of your first use of the Platforms; otherwise you waive the right to opt out. (Legal counsel is recommended.)
                </p>
              </div>
            </div>

            {/* Section 15 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">15. INVESTOR & THIRD-PARTY ACKNOWLEDGMENTS</h2>
              <ul className="space-y-2 text-steel-300">
                <li>• Investors and counterparties acknowledge they have obtained all material information and are not relying on FANZ statements outside of the written agreements executed by FANZ.</li>
                <li>• Investors agree that no oral statements, emails, or marketing materials constitute representations or warranties, and agree to indemnify FANZ for claims stemming from investor communications, solicitations, or representations.</li>
              </ul>
            </div>

            {/* Section 16 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">16. EMPLOYEES, CONTRACTORS & INTERNAL PARTIES</h2>
              <p className="text-steel-300">
                Employees, officers, contractors, consultants, and directors must execute separate confidentiality, IP assignment, non-compete (where lawful), and arbitration agreements as required by FANZ. Any internal agreement's dispute resolution provisions shall control only as expressly set forth; otherwise this TOS governs.
              </p>
            </div>

            {/* Section 17 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">17. CONFIDENTIALITY, TRADE SECRETS, AND NON-DISCLOSURE</h2>
              <p className="text-steel-300">
                Users and Covered Persons must not disclose FANZ confidential information or trade secrets. FANZ may seek injunctive relief and monetary damages for breaches. Confidentiality obligations survive termination of accounts and this TOS.
              </p>
            </div>

            {/* Section 18 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">18. TAXES; REPORTING; 1099 / REGULATORY</h2>
              <p className="text-steel-300">
                Users are responsible for taxes and reporting obligations. Creators and sellers are responsible for filing and compliance with all tax and regulatory requirements. FANZ may report payments to tax authorities and provide information returns as required.
              </p>
            </div>

            {/* Section 19 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">19. INSURANCE</h2>
              <p className="text-steel-300">
                For creators, vendors, contractors, affiliates, and investors performing services for FANZ, FANZ may require evidence of insurance (commercial general liability, cyber liability, and/or professional liability) as a condition to onboarding. Failure to maintain insurance may result in suspension or termination.
              </p>
            </div>

            {/* Section 20 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">20. TERM; TERMINATION</h2>
              <p className="text-steel-300">
                FANZ may suspend or terminate any account or access at any time for any reason including suspected fraud or legal non-compliance. Termination does not waive FANZ's rights to pursue damages, injunctive relief, or enforcement actions.
              </p>
            </div>

            {/* Section 21 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">21. SURVIVAL</h2>
              <p className="text-steel-300">
                Provisions that by their nature survive termination (including sections on Fees, IP, Disclaimer, Limitation of Liability, Indemnification, Arbitration, Confidentiality, and Survival) will survive termination or expiration of this TOS.
              </p>
            </div>

            {/* Section 22 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">22. SEVERABILITY; INTERPRETATION</h2>
              <p className="text-steel-300">
                If any provision is found invalid or unenforceable by a court or arbitrator, the remainder will remain in force and FANZ will seek to reform any invalid provision to the maximum extent permitted to effect the original intent.
              </p>
            </div>

            {/* Section 23 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">23. ENTIRE AGREEMENT; NO ORAL MODIFICATIONS</h2>
              <p className="text-steel-300">
                This TOS (plus any separate written agreements executed by FANZ) constitutes the entire agreement between you and FANZ. No oral statements or representations modify this TOS unless signed by an authorized FANZ officer.
              </p>
            </div>

            {/* Section 24 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">24. ATTORNEYS' FEES; PREVAILING PARTY</h2>
              <p className="text-steel-300">
                If FANZ prevails in any action to enforce this TOS, FANZ is entitled to recover reasonable attorneys' fees, costs, and expenses from the non-prevailing party.
              </p>
            </div>

            {/* Section 25 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">25. NOTICE</h2>
              <p className="text-steel-300 mb-4">
                All notices shall be in writing. Notices to FANZ should be sent to: support@fanzunlimited.com and to the physical address below. FANZ may provide notice to users via email, account messages, or public posting.
              </p>
              <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                <p className="text-white font-display mb-2">FANZ Group Holdings LLC</p>
                <p className="text-steel-300 font-mono text-sm">30 N Gould Street, Suite #45302</p>
                <p className="text-steel-300 font-mono text-sm">Sheridan, WY 82801</p>
                <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                  support@fanzunlimited.com
                </a>
              </div>
            </div>

            {/* Section 26 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">26. CHANGES</h2>
              <p className="text-steel-300">
                FANZ may modify this TOS at any time by posting changes; substantial changes will be posted with notice. Continued use after posting constitutes acceptance.
              </p>
            </div>

            {/* Section 27 */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">27. GOVERNING LAW</h2>
              <p className="text-steel-300">
                This TOS is governed by the laws of Wyoming, U.S.A., excluding conflict of law rules.
              </p>
            </div>

            {/* Final Protective Language */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/50 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Final Protective Language</h2>
              <p className="text-steel-300 font-bold">
                YOU UNDERSTAND AND AGREE THAT THIS TOS IS INTENDED TO BE INTERPRETED TO PROVIDE FANZ THE BROADEST POSSIBLE PROTECTION UNDER APPLICABLE LAW. YOU VOLUNTARILY CONSENT TO THE TERMS INCLUDING THE WAIVERS, RELEASES, LIMITATIONS, INDEMNITIES, AND MANDATORY ARBITRATION. IF ANY COURT OR ARBITRATOR DETERMINES ANY PORTION OF THIS TOS TO BE INVALID OR UNENFORCEABLE, SUCH PORTION SHALL BE LIMITED OR SEVERED TO THE MINIMUM EXTENT NECESSARY, AND THE REMAINING PROVISIONS SHALL CONTINUE IN FULL FORCE.
              </p>
            </div>

            {/* Contact Information */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">Contact Information</h2>
              <div className="space-y-2">
                <p className="text-white font-display">FANZ Group Holdings LLC</p>
                <p className="text-steel-300 font-mono text-sm">30 N Gould Street, Suite #45302</p>
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
      </section>

      <Footer />
    </main>
  );
}
