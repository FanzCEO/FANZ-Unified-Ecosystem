import { Footer } from "@/components/layout/Footer";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gf-pink" data-testid="text-page-title">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gf-smoke">
          <p className="text-sm text-gf-smoke/70">Last Updated: October 2025</p>
          
          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device when you visit websites. They help us provide a better user experience by remembering your preferences and improving platform functionality.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Types of Cookies We Use</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gf-snow mb-2">Essential Cookies</h3>
                <p>Required for platform functionality. These enable core features like authentication, security, and session management. Cannot be disabled.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gf-snow mb-2">Performance Cookies</h3>
                <p>Collect anonymous usage data to help us understand how users interact with GirlFanz and identify areas for improvement.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gf-snow mb-2">Functionality Cookies</h3>
                <p>Remember your preferences, settings, and customizations to provide a personalized experience across sessions.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gf-snow mb-2">Analytics Cookies</h3>
                <p>Help us analyze platform performance, user behavior, and content engagement to optimize creator and fan experiences.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Managing Cookies</h2>
            <p>You can control cookies through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your browser settings (block, delete, or receive notifications)</li>
              <li>Our cookie preference center in account settings</li>
              <li>Third-party opt-out tools for advertising cookies</li>
            </ul>
            <p className="mt-4">Note: Disabling essential cookies may limit platform functionality.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Third-Party Cookies</h2>
            <p>We use select third-party services that may set their own cookies:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment processors for transaction security</li>
              <li>Analytics providers for usage insights</li>
              <li>CDN providers for content delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Cookie Duration</h2>
            <p>Session cookies expire when you close your browser. Persistent cookies remain until expiration or manual deletion, typically ranging from 30 days to 1 year.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Updates to This Policy</h2>
            <p>We may update this Cookie Policy periodically. Changes will be posted on this page with an updated "Last Updated" date.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Contact Us</h2>
            <p>Questions about our cookie practices?</p>
            <p className="text-gf-pink">privacy@girlfanz.com</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
