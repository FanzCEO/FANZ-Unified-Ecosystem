import { Footer } from "@/components/layout/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gf-pink" data-testid="text-page-title">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gf-smoke">
          <p className="text-sm text-gf-smoke/70">Last Updated: October 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">1. Information We Collect</h2>
            <p>GirlFanz collects information you provide directly when creating an account, uploading content, and interacting with the platform.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (email, username, password)</li>
              <li>Profile information (bio, avatar, banner, social links)</li>
              <li>Payment and payout information for creators</li>
              <li>Content you upload (photos, videos, streams)</li>
              <li>Communications and messages</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain the platform</li>
              <li>Process transactions and payments</li>
              <li>Enforce our Terms of Service and Community Guidelines</li>
              <li>Send you service-related communications</li>
              <li>Improve platform features and user experience</li>
              <li>Comply with legal obligations including 18 U.S.C. §2257</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With service providers who assist in platform operations</li>
              <li>When required by law or to protect rights and safety</li>
              <li>With your consent or at your direction</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">6. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to enhance user experience, analyze usage, and provide personalized content. See our Cookie Policy for details.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">7. Age Requirements</h2>
            <p>GirlFanz is an adult platform. You must be at least 18 years old to use our services. We maintain strict age verification procedures for all users and creators.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">8. Contact Us</h2>
            <p>For privacy-related questions or requests, contact us at:</p>
            <p className="text-gf-pink">privacy@girlfanz.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
