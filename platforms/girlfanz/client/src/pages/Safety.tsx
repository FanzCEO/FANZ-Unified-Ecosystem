import { Footer } from "@/components/layout/Footer";
import { Shield, Lock, Eye, AlertTriangle, Ban, CheckCircle } from "lucide-react";

export default function Safety() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Safety Center</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">Your safety and security are our top priorities</p>
        
        <div className="space-y-12">
          <section className="grid md:grid-cols-3 gap-8">
            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Shield className="w-12 h-12 text-gf-pink mb-4" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Content Protection</h3>
              <p className="text-gf-smoke">Advanced watermarking, DRM, and anti-piracy measures protect your content.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Lock className="w-12 h-12 text-gf-violet mb-4" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Data Security</h3>
              <p className="text-gf-smoke">Bank-level encryption and security protocols keep your information safe.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Eye className="w-12 h-12 text-gf-cyan mb-4" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Privacy Controls</h3>
              <p className="text-gf-smoke">Granular privacy settings let you control who sees your content.</p>
            </div>
          </section>

          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-3xl font-semibold text-gf-snow mb-6">Safety Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-gf-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Age Verification</h3>
                  <p className="text-gf-smoke">Mandatory verification for all users and creators using government ID and facial recognition.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-gf-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Content Moderation</h3>
                  <p className="text-gf-smoke">AI-powered screening plus human review ensures policy compliance.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-gf-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Deepfake Detection</h3>
                  <p className="text-gf-smoke">Advanced AI detects and prevents unauthorized deepfake content.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-gf-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Two-Factor Authentication</h3>
                  <p className="text-gf-smoke">Optional 2FA adds an extra layer of account security.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-gf-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">Secure Payments</h3>
                  <p className="text-gf-smoke">PCI-compliant payment processing with fraud prevention.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-gf-pink flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gf-snow mb-2">24/7 Support</h3>
                  <p className="text-gf-smoke">Round-the-clock safety and security support team.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-gf-snow mb-6">Report Content</h2>
            <div className="bg-gf-graphite border border-gf-pink/20 p-6 rounded-lg">
              <div className="flex gap-4 mb-4">
                <AlertTriangle className="w-8 h-8 text-gf-pink flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-gf-snow mb-2">See Something? Say Something.</h3>
                  <p className="text-gf-smoke mb-4">
                    If you encounter content that violates our guidelines or applicable laws, please report it immediately.
                  </p>
                  <ul className="space-y-2 text-gf-smoke">
                    <li className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-gf-pink" />
                      Non-consensual content
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-gf-pink" />
                      Content involving minors
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-gf-pink" />
                      Harassment or threats
                    </li>
                    <li className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-gf-pink" />
                      Intellectual property violations
                    </li>
                  </ul>
                  <a 
                    href="/help/contact" 
                    className="inline-block mt-6 px-6 py-3 bg-gf-pink text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                    data-testid="link-report-content"
                  >
                    Report Content
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-gf-snow mb-6">Safety Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <a href="/guidelines" className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors" data-testid="link-community-guidelines">
                <h3 className="text-xl font-semibold text-gf-pink mb-2">Community Guidelines</h3>
                <p className="text-gf-smoke">Learn about our content policies and community standards.</p>
              </a>

              <a href="/privacy" className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors" data-testid="link-privacy-policy">
                <h3 className="text-xl font-semibold text-gf-pink mb-2">Privacy Policy</h3>
                <p className="text-gf-smoke">Understand how we protect and use your data.</p>
              </a>

              <a href="/compliance" className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors" data-testid="link-2257-compliance">
                <h3 className="text-xl font-semibold text-gf-pink mb-2">2257 Compliance</h3>
                <p className="text-gf-smoke">Our record-keeping and age verification processes.</p>
              </a>

              <a href="/help" className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors" data-testid="link-help-center">
                <h3 className="text-xl font-semibold text-gf-pink mb-2">Help Center</h3>
                <p className="text-gf-smoke">Find answers to safety and security questions.</p>
              </a>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
