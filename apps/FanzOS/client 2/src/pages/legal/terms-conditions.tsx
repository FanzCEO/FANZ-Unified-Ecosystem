export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Terms & Conditions
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <div className="bg-purple-900/30 p-6 rounded-lg border border-purple-500/30 mb-6">
              <p className="text-center text-lg">
                <strong>Revised on February 13th, 2025</strong>
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Table of Contents – Terms & Conditions</h2>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acceptance of Terms</li>
                <li>Eligibility</li>
                <li>Account Registration and Responsibilities</li>
                <li>Content Guidelines</li>
                <li>Prohibited Conduct</li>
                <li>Fees and Payment Terms</li>
                <li>Intellectual Property</li>
                <li>Privacy and Data Collection</li>
                <li>Disclaimers</li>
                <li>Limitation of Liability</li>
                <li>Indemnification</li>
                <li>Governing Law and Dispute Resolution</li>
                <li>Changes to Terms</li>
                <li>Contact Information</li>
              </ol>
            </section>

            <section>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-lg border border-purple-500/30">
                <h2 className="text-2xl font-bold text-white mb-4">Complete Terms & Conditions</h2>
                <p>
                  For all the comprehensive details, please visit our knowledge base:
                </p>
                <a 
                  href="https://fanz.foundation/knowledge-base/article/terms-of-service" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  View Complete Terms of Service →
                </a>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Key Points Summary</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>All users must be at least 18 years of age</li>
                <li>Account holders are responsible for all activity under their account</li>
                <li>Content must comply with platform guidelines and applicable laws</li>
                <li>Prohibited conduct includes harassment, illegal content, and policy violations</li>
                <li>Payment terms are governed by platform policies and payment processors</li>
                <li>Intellectual property rights are protected under applicable laws</li>
                <li>Privacy and data collection follows our comprehensive privacy policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
              <p>
                If you have any questions regarding this TOS or our services, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p>
                  <strong>Fanz™ Unlimited Network (FUN) L.L.C</strong><br />
                  30 N Gould Street #45302<br />
                  Sheridan, WY 82801<br />
                  Email: support@fanzunlimited.com<br />
                  Phone: (307) 216-3828
                </p>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Revised on February 13th, 2025.<br />
                Fanz™ Unlimited Network (FUN). ALL RIGHTS RESERVED © 2025
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}