import { Footer } from "@/components/layout/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gf-pink" data-testid="text-page-title">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gf-smoke">
          <p className="text-sm text-gf-smoke/70">Last Updated: October 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using GirlFanz, you agree to be bound by these Terms of Service. If you do not agree, do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">2. Age Requirements</h2>
            <p>You must be at least 18 years old to use GirlFanz. All content creators must verify their age and identity in compliance with 18 U.S.C. §2257 record-keeping requirements.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">3. Account Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring all information provided is accurate and current</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">4. Content Guidelines</h2>
            <p>Prohibited content includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Content involving minors (zero tolerance policy)</li>
              <li>Non-consensual content or imagery</li>
              <li>Content that violates intellectual property rights</li>
              <li>Hate speech, harassment, or threats</li>
              <li>Spam, scams, or fraudulent activity</li>
              <li>Content violating applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">5. Creator Terms</h2>
            <p>Content creators agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Complete mandatory age and identity verification</li>
              <li>Maintain 2257 compliance documentation</li>
              <li>Own or have rights to all uploaded content</li>
              <li>Pay applicable platform fees and transaction costs</li>
              <li>Comply with all community guidelines and policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">6. Payment Terms</h2>
            <p>Platform fees: 20% of all creator earnings. Payments are processed through our FanzTrust™ financial ecosystem. Creators must complete payout verification before receiving funds.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">7. Intellectual Property</h2>
            <p>Creators retain ownership of their content but grant GirlFanz a license to host, display, and distribute content as necessary to operate the platform. Users may not download, copy, or redistribute creator content without permission.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">8. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. Users may close their accounts at any time through account settings.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">9. Limitation of Liability</h2>
            <p>GirlFanz is provided "as is" without warranties. We are not liable for indirect, incidental, or consequential damages arising from platform use.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">10. Contact</h2>
            <p>For questions about these terms:</p>
            <p className="text-gf-pink">legal@girlfanz.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
