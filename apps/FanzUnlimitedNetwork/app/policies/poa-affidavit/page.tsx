import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function POAAffidavit() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Legal Document</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Affidavit of Attorney-In-Fact
            </h1>
            <p className="text-steel-300 max-w-3xl mx-auto">
              Fanz™ Unlimited Network (FUN) L.L.C. — Power of Attorney Form
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Important Notice */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">IMPORTANT</h2>
              <p className="text-steel-300 font-bold">
                A Power of Attorney document must be attached to this form. Please review all pages carefully before submission.
              </p>
            </div>

            {/* Section A */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Section A: Principal Information (Account Owner)</h2>
              <p className="text-steel-300 mb-6 text-sm">
                This section is required when an Agent (Attorney-In-Fact) is opening or managing the account on behalf of the Principal.
              </p>

              <div className="space-y-4 text-steel-300 font-mono">
                <div>
                  <p className="text-white text-sm mb-1">Principal Name (First, Middle, Last):</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Stage Name (If applicable):</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white text-sm mb-1">Principal Date of Birth (MM/DD/YYYY):</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                  <div>
                    <p className="text-white text-sm mb-1">Principal Social Security Number (SSN):</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Principal Current Home Address (No P.O. Boxes):</p>
                  <p className="text-xs text-steel-300 mb-1">(Include Street, City, State, and Zip Code)</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Principal Mailing Address (If different from above):</p>
                  <p className="text-xs text-steel-300 mb-1">(Include Street, City, State, and Zip Code)</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white text-sm mb-1">Principal Phone Number:</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                  <div>
                    <p className="text-white text-sm mb-1">Other Contact Number:</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Principal Email Address:</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Profile Information (Brief Description of Account Holder's Role on FUN Platform):</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
              </div>
            </div>

            {/* Section B */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Section B: Attorney-In-Fact Information (Authorized Representative)</h2>
              <p className="text-steel-300 mb-6 text-sm">
                This section is required to verify the identity of the Attorney-In-Fact when taking action on behalf of the Principal.
              </p>

              <div className="space-y-4 text-steel-300 font-mono">
                <div>
                  <p className="text-white text-sm mb-1">Attorney-In-Fact Name (First, Middle, Last):</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white text-sm mb-1">Attorney-In-Fact Date of Birth (MM/DD/YYYY):</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                  <div>
                    <p className="text-white text-sm mb-1">Attorney-In-Fact Social Security Number (SSN):</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Attorney-In-Fact Current Home Address (No P.O. Boxes):</p>
                  <p className="text-xs text-steel-300 mb-1">(Include Street, City, State, and Zip Code)</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Attorney-In-Fact Mailing Address (If different from above):</p>
                  <p className="text-xs text-steel-300 mb-1">(Include Street, City, State, and Zip Code)</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white text-sm mb-1">Attorney-In-Fact Phone Number:</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                  <div>
                    <p className="text-white text-sm mb-1">Other Contact Number:</p>
                    <p className="border-b border-white/20 pb-1">_______________</p>
                  </div>
                </div>
                <div>
                  <p className="text-white text-sm mb-1">Attorney-In-Fact Email Address:</p>
                  <p className="border-b border-white/20 pb-1">________________________________________</p>
                </div>
              </div>
            </div>

            {/* Section C */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Section C: Purpose of Power of Attorney & Scope of Work</h2>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">Please select the reason(s) for granting Power of Attorney:</h3>
              <div className="space-y-2 text-steel-300 ml-4">
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">☐</span>
                  <p>Managing financial transactions on behalf of the Principal.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">☐</span>
                  <p>Handling legal matters and compliance with FUN policies.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">☐</span>
                  <p>Representing a Content Star in business operations.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">☐</span>
                  <p>Managing account settings, funds, and disputes.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">☐</span>
                  <p>Handling posthumous account management and estate-related matters.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">☐</span>
                  <div>
                    <p>Other (Please specify):</p>
                    <p className="border-b border-white/20 pb-1 mt-1 font-mono">________________________________________</p>
                  </div>
                </div>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">Scope of Authority (Check All That Apply):</h3>

              <div className="p-6 rounded-lg bg-ink-800 border border-acid-lime/30 mb-6">
                <h4 className="font-display text-xl text-white mb-3">✅ Permitted Actions:</h4>
                <div className="space-y-2 text-steel-300 ml-4">
                  <div className="flex items-start gap-3">
                    <span className="text-acid-lime">☐</span>
                    <p>Accessing and managing funds related to the Principal's account.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-acid-lime">☐</span>
                    <p>Negotiating contracts, agreements, and partnerships related to FUN activities.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-acid-lime">☐</span>
                    <p>Adjusting account settings, including subscription rates and content visibility.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-acid-lime">☐</span>
                    <p>Initiating and resolving disputes on behalf of the Principal.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-acid-lime">☐</span>
                    <p>Representing the Principal in compliance and legal matters related to FUN.</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-lg bg-ink-800 border border-neon-pink/50">
                <h4 className="font-display text-xl text-white mb-3">🚫 Restricted/Off-Limits Actions:</h4>
                <div className="space-y-2 text-steel-300 ml-4">
                  <div className="flex items-start gap-3">
                    <span className="text-neon-pink">❌</span>
                    <p>Transferring ownership of the Principal's account.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-pink">❌</span>
                    <p>Posting, modifying, or deleting content without explicit consent.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-pink">❌</span>
                    <p>Changing account credentials or locking the Principal out of their account.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-pink">❌</span>
                    <p>Authorizing any activities outside of the FUN platform.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-neon-pink">❌</span>
                    <p>Violating any terms of service or engaging in fraudulent activity.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section D */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Section D: Certification and Acknowledgment</h2>
              <p className="text-steel-300 mb-6">
                I, the undersigned, acting as Attorney-In-Fact under a Power of Attorney, certify under penalty of perjury that:
              </p>

              <div className="space-y-3 text-steel-300 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">1.</span>
                  <p>The attached Power of Attorney document is in full force and effect and, to the best of my knowledge, has not been revoked, terminated, or rendered invalid by the Principal's death, incapacity, or otherwise.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">2.</span>
                  <p>To the best of my knowledge, the Principal was competent and not under undue influence when executing the Power of Attorney.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">3.</span>
                  <p>My authority has not been suspended by any legal proceedings, including incapacity or guardianship appointments.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">4.</span>
                  <p>If I am a successor agent, the conditions required for me to act as the Attorney-In-Fact have occurred as stated in the Power of Attorney.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">5.</span>
                  <p>I meet all legal requirements for serving as an agent under applicable state law.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">6.</span>
                  <p>I am acting in good faith and within the scope of my authority under the Power of Attorney.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-acid-lime">7.</span>
                  <p>I, individually and as Attorney-In-Fact, release, discharge, indemnify, and hold Fanz™ Unlimited Network (FUN) L.L.C. harmless from any claims, lawsuits, damages, expenses, or liabilities arising from transactions or actions taken on behalf of the Principal.</p>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-lg bg-ink-800 border border-white/10">
                <p className="text-steel-300 mb-6">
                  By signing below, I certify that the information provided is accurate and truthful. I agree to Fanz™ Unlimited Network (FUN) L.L.C.'s Terms of Service, Privacy Policy, and Financial Handling Policies. I authorize FUN to verify the information provided.
                </p>

                <div className="space-y-6 text-steel-300 font-mono">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-white text-sm mb-1">Attorney-In-Fact Signature:</p>
                      <p className="border-b border-white/20 pb-1">___________________________</p>
                    </div>
                    <div>
                      <p className="text-white text-sm mb-1">Date:</p>
                      <p className="border-b border-white/20 pb-1">_______________</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-white font-display text-lg mb-4">Notary Section</h4>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-white text-sm mb-1">Notary Signature:</p>
                        <p className="border-b border-white/20 pb-1">___________________________</p>
                      </div>
                      <div>
                        <p className="text-white text-sm mb-1">Date:</p>
                        <p className="border-b border-white/20 pb-1">_______________</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-white text-sm mb-1">Notary Seal:</p>
                        <p className="border-b border-white/20 pb-1">_______________</p>
                      </div>
                      <div>
                        <p className="text-white text-sm mb-1">Notary Commission Expiration:</p>
                        <p className="border-b border-white/20 pb-1">_______________</p>
                      </div>
                      <div>
                        <p className="text-white text-sm mb-1">Notary Jurisdiction:</p>
                        <p className="border-b border-white/20 pb-1">_______________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Instructions */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">Submission Instructions</h2>
              <p className="text-steel-300 mb-6 font-bold">
                This form will not be processed unless all sections are completed, and the Power of Attorney document is attached.
              </p>

              <h3 className="font-display text-2xl text-white mb-3">How to Submit:</h3>
              <div className="space-y-4 text-steel-300">
                <div>
                  <p className="text-white font-display mb-2">Secure Message:</p>
                  <p>Log in to your Fanz Unlimited Network (FUN) account and submit the completed form via secure message.</p>
                </div>
                <div>
                  <p className="text-white font-display mb-2">By Mail:</p>
                  <p className="mb-2">Send the completed and notarized form, along with the Power of Attorney document, to:</p>
                  <div className="p-4 rounded-lg bg-ink-800 border border-white/5 font-mono text-sm">
                    <p>Fanz™ Unlimited Network (FUN) L.L.C.</p>
                    <p>30 N Gould Street #45302</p>
                    <p>Sheridan, WY 82801</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-lg bg-ink-800 border border-neon-pink/30">
                <h4 className="text-white font-display text-lg mb-3">For Questions or Assistance:</h4>
                <div className="space-y-2 text-steel-300 font-mono text-sm">
                  <p>📞 (945) 998-9033</p>
                  <p>📧 <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition">support@fanzunlimited.com</a></p>
                  <p>🌐 <a href="https://www.fanzunlimited.com" className="text-neon-cyan hover:text-glow transition">www.fanzunlimited.com</a></p>
                </div>
              </div>

              <p className="text-steel-300 font-mono text-xs text-center mt-8">
                © 2025 Fanz™ Unlimited Network (FUN) L.L.C. All Rights Reserved. Member Privacy & Compliance Policies Apply
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
