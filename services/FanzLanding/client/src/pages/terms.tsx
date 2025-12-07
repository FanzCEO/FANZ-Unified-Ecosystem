import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Scale, FileText, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function TermsOfService() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              <Scale className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              Terms of Service
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Fanz Unlimited Network (FANZ) - Legal Terms and Conditions
            </p>
            <p className="text-sm text-yellow-400">
              Effective Date: January 1, 2024 | Last Updated: September 5, 2025
            </p>
          </CardHeader>
        </Card>

        {/* Introduction */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FileText className="w-5 h-5 mr-2" />
              1. Introduction and Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Welcome to Fanz Unlimited Network ("FANZ," "we," "us," or "our"),
              operated by Fanz Unlimited LLC. These Terms of Service ("Terms")
              govern your access to and use of our platform, including our
              websites, mobile applications, and related services (collectively,
              the "Platform").
            </p>
            <p className="font-semibold text-yellow-400">
              BY ACCESSING OR USING OUR PLATFORM, YOU AGREE TO BE BOUND BY THESE
              TERMS AND ALL APPLICABLE LAWS. IF YOU DO NOT AGREE, DO NOT USE OUR
              PLATFORM.
            </p>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Age Verification Required
              </h4>
              <p>
                You must be at least 18 years old to access this Platform. All
                users must provide valid government-issued identification for
                age verification as required by USC 2257 regulations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* USC 2257 Compliance */}
        <Card className="border-2 border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-red-400">
              <Shield className="w-5 h-5 mr-2" />
              2. USC 2257 Compliance and Record-Keeping Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p className="font-semibold">
              This Platform complies with all USC 2257 record-keeping
              requirements for adult content.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-red-300">
                2.1 Content Creator Requirements
              </h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>All content creators must be at least 18 years of age</li>
                <li>
                  Valid government-issued photo identification must be provided
                  and verified
                </li>
                <li>
                  Records are maintained in compliance with 18 U.S.C. § 2257 and
                  28 C.F.R. § 75
                </li>
                <li>
                  All records are kept at our corporate headquarters for
                  inspection by authorized officials
                </li>
                <li>
                  Failure to provide required documentation will result in
                  immediate account suspension
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-red-300">
                2.2 Record Custodian Information
              </h4>
              <div className="bg-background/50 rounded-lg p-4 border">
                <p>
                  <strong>Custodian of Records:</strong> Compliance Officer,
                  Fanz Unlimited LLC
                </p>
                <p>
                  <strong>Address:</strong> [Corporate Headquarters Address]
                </p>
                <p>
                  <strong>Inspection Hours:</strong> Monday-Friday, 9:00 AM -
                  5:00 PM PST
                </p>
                <p>
                  <strong>Contact:</strong> compliance@fanzunlimited.com
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-red-300">
                2.3 Content Labeling
              </h4>
              <p>
                All content on this Platform contains sexually explicit
                material. The Platform maintains records required by 18 U.S.C. §
                2257 and 28 C.F.R. Part 75 for all content creators appearing in
                sexually explicit material.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Roles and Responsibilities */}
        <Card className="border-2 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              3. User Roles and Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-300">3.1 FANZ (Fans)</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Must be 18+ with verified age</li>
                  <li>Responsible for all account activity</li>
                  <li>Must not redistribute, record, or share content</li>
                  <li>
                    Must respect creator boundaries and platform guidelines
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-300">
                  3.2 STAR (Content Creators)
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Must complete comprehensive identity verification (KYC)
                  </li>
                  <li>Must provide USC 2257 compliant documentation</li>
                  <li>Must digitally sign consent forms for all content</li>
                  <li>
                    Responsible for ensuring all co-performers meet age and
                    documentation requirements
                  </li>
                  <li>Must maintain accurate tax information (W-9/W-8BEN)</li>
                  <li>
                    Subject to content review and platform compliance standards
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-300">
                  3.3 Moderators and Administrators
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Must undergo background verification</li>
                  <li>Subject to additional confidentiality agreements</li>
                  <li>
                    Responsible for platform safety and compliance enforcement
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Guidelines */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              4. Content Guidelines and Prohibited Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-300">
                  4.1 Permitted Content
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Consensual adult content with proper documentation</li>
                  <li>Content created by verified users 18+ years of age</li>
                  <li>
                    Original content with proper intellectual property rights
                  </li>
                  <li>
                    Content that complies with all applicable laws and
                    regulations
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-300">
                  4.2 Strictly Prohibited Content
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Content involving individuals under 18 years of age</li>
                  <li>
                    Non-consensual content or content obtained without proper
                    consent
                  </li>
                  <li>Content depicting illegal activities</li>
                  <li>Content that violates intellectual property rights</li>
                  <li>Content promoting violence, hatred, or discrimination</li>
                  <li>
                    Content that violates privacy rights or contains personal
                    information
                  </li>
                  <li>Revenge porn or non-consensual intimate imagery</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment and Financial Terms */}
        <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              5. Payment Terms and Revenue Sharing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-yellow-300">
                  5.1 Creator Revenue
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Revenue sharing percentages as specified in Creator
                    Agreements
                  </li>
                  <li>Payments processed according to payment schedule</li>
                  <li>Tax reporting obligations as required by law</li>
                  <li>
                    Chargebacks and disputes handled according to platform
                    policy
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-300">
                  5.2 Fan Payments
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All payments are final unless otherwise specified</li>
                  <li>
                    Refund policies apply as outlined in platform guidelines
                  </li>
                  <li>
                    Payment information is processed securely with encryption
                  </li>
                  <li>
                    Compliance with payment processor terms (MasterCard, Visa,
                    etc.)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy and Data Protection */}
        <Card className="border-2 border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              6. Privacy and Data Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-3">
              <p>
                Your privacy is protected by our comprehensive Privacy Policy.
                Key protections include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>AES-256 encryption for all sensitive data at rest</li>
                <li>TLS 1.2+ encryption for all data in transit</li>
                <li>Immutable audit trails for all platform activities</li>
                <li>SHA-256 file hashing for document integrity</li>
                <li>
                  Forensic tracking capabilities for compliance and security
                </li>
                <li>Secure document storage in FanzHubVault infrastructure</li>
                <li>Limited data retention and automatic purging policies</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Platform Security */}
        <Card className="border-2 border-cyan-500/20 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              7. Platform Security and Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-cyan-300">
                  7.1 Security Measures
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Enterprise-grade security infrastructure</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>
                    Multi-factor authentication for enhanced account security
                  </li>
                  <li>Real-time monitoring and threat detection</li>
                  <li>Secure API endpoints with rate limiting</li>
                  <li>Regular backup and disaster recovery procedures</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">
                  7.2 Compliance Monitoring
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Continuous monitoring for regulatory compliance</li>
                  <li>Automated content scanning for prohibited material</li>
                  <li>Regular compliance audits and reporting</li>
                  <li>
                    Cooperation with law enforcement when legally required
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Termination */}
        <Card className="border-2 border-red-500/20 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              8. Account Suspension and Termination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-300">
                  8.1 Grounds for Termination
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Violation of these Terms of Service</li>
                  <li>
                    Failure to provide required age verification documentation
                  </li>
                  <li>Upload of prohibited or illegal content</li>
                  <li>Fraudulent activity or payment disputes</li>
                  <li>Harassment or abuse of other users</li>
                  <li>Violation of applicable laws or regulations</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-red-300">
                  8.2 Termination Process
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Notice of termination will be provided when possible</li>
                  <li>Opportunity to appeal termination decisions</li>
                  <li>Data retention according to legal requirements</li>
                  <li>
                    Account reactivation possible for correctable violations
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Terms */}
        <Card className="border-2 border-gray-500/20 bg-gray-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              9. Legal Terms and Disclaimers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">9.1 Limitation of Liability</h4>
                <p>
                  FANZ provides the platform "as is" without warranties. We are
                  not liable for indirect, incidental, or consequential damages
                  arising from platform use.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">9.2 Governing Law</h4>
                <p>
                  These Terms are governed by the laws of [Jurisdiction].
                  Disputes will be resolved through binding arbitration where
                  permitted by law.
                </p>
              </div>

              <div>
                <h4 className="font-semibold">9.3 Changes to Terms</h4>
                <p>
                  We may update these Terms periodically. Continued use of the
                  Platform constitutes acceptance of updated Terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-xl">10. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-green-300">
                  Legal Inquiries
                </h4>
                <p>legal@fanzunlimited.com</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-300">Compliance</h4>
                <p>compliance@fanzunlimited.com</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-300">Support</h4>
                <p>support@fanzunlimited.com</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-300">Business</h4>
                <p>business@fanzunlimited.com</p>
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
