import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Database, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              <Shield className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              Privacy Policy
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              How FANZ Protects Your Personal Information and Privacy
            </p>
            <p className="text-sm text-yellow-400">
              Effective Date: January 1, 2024 | Last Updated: September 5, 2025
            </p>
          </CardHeader>
        </Card>

        {/* Introduction */}
        <Card className="border-2 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Eye className="w-5 h-5 mr-2" />
              1. Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Fanz Unlimited LLC ("FANZ," "we," "us," or "our") is committed to
              protecting your privacy. This Privacy Policy explains how we
              collect, use, store, and protect your personal information.
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-300">
                  1.1 Personal Information
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Identity Verification:</strong> Full legal name,
                    date of birth, government-issued ID
                  </li>
                  <li>
                    <strong>Contact Information:</strong> Email address, phone
                    number, mailing address
                  </li>
                  <li>
                    <strong>Financial Information:</strong> Payment methods, tax
                    identification numbers, banking details
                  </li>
                  <li>
                    <strong>Account Information:</strong> Username, password
                    hash, profile settings
                  </li>
                  <li>
                    <strong>Biometric Data:</strong> Facial recognition data for
                    liveness verification
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-300">
                  1.2 Technical Information
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Device Information:</strong> IP address, device
                    fingerprint, browser type
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Platform activity, content
                    interactions, session duration
                  </li>
                  <li>
                    <strong>Geolocation:</strong> General location data (with
                    consent)
                  </li>
                  <li>
                    <strong>Cookies and Tracking:</strong> Authentication
                    tokens, preference settings
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-300">
                  1.3 Content and Communications
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>User-Generated Content:</strong> Photos, videos,
                    messages, comments
                  </li>
                  <li>
                    <strong>Communication Records:</strong> Support inquiries,
                    platform notifications
                  </li>
                  <li>
                    <strong>Transaction History:</strong> Purchase records,
                    revenue sharing data
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              2. How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-300">
                  2.1 Legal Compliance
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    USC 2257 record-keeping requirements for adult content
                  </li>
                  <li>Age verification and identity confirmation</li>
                  <li>
                    Anti-money laundering (AML) and Know Your Customer (KYC)
                    compliance
                  </li>
                  <li>Tax reporting and financial regulations</li>
                  <li>Response to legal requests and law enforcement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-300">
                  2.2 Platform Operations
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Account creation and authentication</li>
                  <li>Content moderation and safety measures</li>
                  <li>Payment processing and revenue distribution</li>
                  <li>Customer support and technical assistance</li>
                  <li>Platform security and fraud prevention</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-300">
                  2.3 Service Improvement
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Analytics and usage pattern analysis</li>
                  <li>Feature development and enhancement</li>
                  <li>Personalized content recommendations</li>
                  <li>Marketing communications (with consent)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="border-2 border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-red-400">
              <Lock className="w-5 h-5 mr-2" />
              3. Data Security and Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-red-300 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Enterprise-Grade Security
              </h4>
              <p>
                FANZ implements military-grade security measures to protect your
                sensitive information and maintain the highest standards of data
                protection.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-300">
                  3.1 Encryption Standards
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Data at Rest:</strong> AES-256 encryption for all
                    stored data
                  </li>
                  <li>
                    <strong>Data in Transit:</strong> TLS 1.2+ encryption for
                    all communications
                  </li>
                  <li>
                    <strong>Database Encryption:</strong> End-to-end encryption
                    for sensitive fields
                  </li>
                  <li>
                    <strong>File Integrity:</strong> SHA-256 hashing for
                    document verification
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-300">
                  3.2 Access Controls
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Multi-Factor Authentication:</strong> Required for
                    all administrative access
                  </li>
                  <li>
                    <strong>Role-Based Permissions:</strong> Least privilege
                    access principles
                  </li>
                  <li>
                    <strong>Regular Access Reviews:</strong> Quarterly
                    permission audits
                  </li>
                  <li>
                    <strong>Secure APIs:</strong> Rate limiting and
                    authentication requirements
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-300">
                  3.3 Infrastructure Security
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>FanzHubVault:</strong> Secure document storage with
                    immutable audit trails
                  </li>
                  <li>
                    <strong>Penetration Testing:</strong> Regular security
                    assessments
                  </li>
                  <li>
                    <strong>Vulnerability Management:</strong> Continuous
                    monitoring and patching
                  </li>
                  <li>
                    <strong>Incident Response:</strong> 24/7 security operations
                    center
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              4. Information Sharing and Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-yellow-300">
                  4.1 Limited Sharing
                </h4>
                <p>
                  We do not sell, rent, or trade your personal information.
                  Information is only shared in these circumstances:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Legal Requirements:</strong> When required by law,
                    court order, or legal process
                  </li>
                  <li>
                    <strong>Safety and Security:</strong> To protect users and
                    prevent illegal activities
                  </li>
                  <li>
                    <strong>Service Providers:</strong> With trusted partners
                    under strict confidentiality agreements
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In case of merger,
                    acquisition, or asset sale
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-300">
                  4.2 Third-Party Services
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Payment Processors:</strong> Secure payment handling
                    with PCI DSS compliance
                  </li>
                  <li>
                    <strong>Identity Verification:</strong> Age verification and
                    KYC service providers
                  </li>
                  <li>
                    <strong>Cloud Infrastructure:</strong> Secure cloud storage
                    and computing services
                  </li>
                  <li>
                    <strong>Analytics:</strong> Privacy-compliant usage
                    analytics (anonymized data only)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="border-2 border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Database className="w-5 h-5 mr-2" />
              5. Data Retention and Disposal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-purple-300">
                  5.1 Retention Periods
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>USC 2257 Records:</strong> Maintained for the life
                    of the content plus 7 years
                  </li>
                  <li>
                    <strong>Financial Records:</strong> 7 years for tax and
                    audit purposes
                  </li>
                  <li>
                    <strong>Account Information:</strong> 30 days after account
                    deletion (unless legally required)
                  </li>
                  <li>
                    <strong>Usage Logs:</strong> 90 days for security and
                    operational purposes
                  </li>
                  <li>
                    <strong>Support Communications:</strong> 3 years for quality
                    assurance
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-300">
                  5.2 Secure Disposal
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Cryptographic erasure of encrypted data</li>
                  <li>Secure deletion protocols for all storage media</li>
                  <li>Certificate of destruction for physical documents</li>
                  <li>Audit trails for all data disposal activities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Rights */}
        <Card className="border-2 border-cyan-500/20 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="text-xl">6. Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-cyan-300">
                  6.1 Access and Control
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    information
                  </li>
                  <li>
                    <strong>Correction:</strong> Update or correct inaccurate
                    information
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your data
                    (subject to legal requirements)
                  </li>
                  <li>
                    <strong>Portability:</strong> Obtain your data in a
                    machine-readable format
                  </li>
                  <li>
                    <strong>Opt-Out:</strong> Unsubscribe from marketing
                    communications
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">
                  6.2 Legal Limitations
                </h4>
                <p>
                  Some information cannot be deleted due to legal requirements,
                  including USC 2257 record-keeping obligations, tax
                  regulations, and ongoing legal proceedings.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">
                  6.3 How to Exercise Rights
                </h4>
                <p>
                  Contact our Privacy Officer at privacy@fanzunlimited.com to
                  exercise your privacy rights. We will respond within 30 days
                  and may require identity verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookies and Tracking */}
        <Card className="border-2 border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              7. Cookies and Tracking Technologies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-orange-300">
                  7.1 Essential Cookies
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Authentication and session management</li>
                  <li>Security and fraud prevention</li>
                  <li>Platform functionality and preferences</li>
                  <li>Age verification compliance</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-orange-300">
                  7.2 Analytics and Performance
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Usage analytics (anonymized)</li>
                  <li>Performance monitoring</li>
                  <li>Error tracking and debugging</li>
                  <li>A/B testing for feature improvements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-orange-300">
                  7.3 Managing Cookies
                </h4>
                <p>
                  You can control cookies through your browser settings, but
                  disabling essential cookies may limit platform functionality
                  and compliance features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* International Transfers */}
        <Card className="border-2 border-pink-500/20 bg-pink-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              8. International Data Transfers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-3">
              <p>
                FANZ operates globally and may transfer your information to
                countries outside your residence. We ensure adequate protection
                through:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Standard Contractual Clauses (SCCs) for EU data transfers
                </li>
                <li>Privacy Shield frameworks where applicable</li>
                <li>
                  Local data residency requirements for sensitive information
                </li>
                <li>Encryption for all international data transfers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Changes and Contact */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              9. Policy Updates and Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-300">
                  9.1 Policy Changes
                </h4>
                <p>
                  We may update this Privacy Policy periodically. Material
                  changes will be communicated through platform notifications
                  and email. Continued use constitutes acceptance of updates.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-green-300">
                  9.2 Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h5 className="font-semibold">Privacy Officer</h5>
                    <p>privacy@fanzunlimited.com</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Data Protection Officer</h5>
                    <p>dpo@fanzunlimited.com</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Compliance Team</h5>
                    <p>compliance@fanzunlimited.com</p>
                  </div>
                  <div>
                    <h5 className="font-semibold">Security Team</h5>
                    <p>security@fanzunlimited.com</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
          >
            Return to Platform
          </Button>
        </div>
      </div>
    </div>
  );
}
