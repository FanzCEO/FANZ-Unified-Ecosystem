import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-df-brick border-t border-df-steel mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="text-xl mb-4">
              <span className="neon-heading">Daddy</span><span className="glow-text-gold">Fanz</span>
            </div>
            <p className="text-df-fog text-sm">Premium adult content platform for creators and fans.</p>
            <div className="flex items-center space-x-2 mt-4 text-df-steel text-xs">
              <span className="text-df-fog">Powered by:</span>
              <span>CCBill</span>
              <span>•</span>
              <span>Segpay</span>
              <span>•</span>
              <span>Paxum</span>
            </div>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="text-df-snow font-semibold mb-4">Compliance</h4>
            <ul className="space-y-2 text-df-fog text-sm">
              <li>
                <Link 
                  href="/legal/2257" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-2257"
                >
                  18 U.S.C. § 2257
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/gdpr" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-gdpr"
                >
                  GDPR Compliance
                </Link>
              </li>
              <li>
                <Link 
                  href="/verification" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-age-verification"
                >
                  Age Verification
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/kyc" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-kyc"
                >
                  KYC/AML Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-df-snow font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-df-fog text-sm">
              <li>
                <Link 
                  href="/help" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-help"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/creator-guide" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-creator-guide"
                >
                  Creator Guide
                </Link>
              </li>
              <li>
                <Link 
                  href="/payment-help" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-payment-help"
                >
                  Payment Help
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-contact"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-df-snow font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-df-fog text-sm">
              <li>
                <Link 
                  href="/legal/terms" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-terms"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/privacy" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-privacy"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/dmca" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-dmca"
                >
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/acceptable-use" 
                  className="hover:text-df-cyan transition-colors"
                  data-testid="link-acceptable-use"
                >
                  Acceptable Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="chain-divider my-8"></div>

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-df-fog text-sm">
            © 2025 DaddyFanz. All rights reserved. Adult content platform 18+
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-df-fog text-sm">Secure & Compliant</span>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full pulse-glow" title="Systems Operational"></div>
              <span className="text-df-fog text-xs">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
