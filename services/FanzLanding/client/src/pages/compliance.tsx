import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Shield,
  FileText,
  Camera,
  Users,
  Building,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";

export default function ComplianceStatement() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-cyan-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-red-500/20 bg-red-500/5">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              <Shield className="w-8 h-8 mx-auto mb-2 text-red-400" />
              USC 2257 Compliance Statement
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Record-Keeping Requirements for Adult Content
            </p>
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-300 font-semibold">
                18 U.S.C. § 2257 Record-Keeping Requirements Compliance
                Statement
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Legal Notice */}
        <Card className="border-2 border-orange-500/20 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-orange-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Legal Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <p className="font-semibold text-orange-300 mb-2">
                All models, actors, actresses and other persons that appear in
                any visual depiction of actual sexually explicit conduct
                appearing or otherwise contained in or at this website were over
                the age of eighteen years at the time of the creation of such
                depictions.
              </p>
            </div>

            <p>
              The records required by 18 U.S.C. § 2257 and 28 C.F.R. Part 75 are
              kept by the Custodian of Records at the address listed below. This
              statement applies to all content on the Fanz Unlimited Network
              platform, including all subdomains and associated properties.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <Camera className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <h4 className="font-semibold">Photo Content</h4>
                <p className="text-xs text-muted-foreground">
                  All models 18+ verified
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <FileText className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                <h4 className="font-semibold">Video Content</h4>
                <p className="text-xs text-muted-foreground">
                  All performers 18+ verified
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <Users className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <h4 className="font-semibold">Live Content</h4>
                <p className="text-xs text-muted-foreground">
                  All creators 18+ verified
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custodian Information */}
        <Card className="border-2 border-blue-500/20 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Building className="w-5 h-5 mr-2" />
              Custodian of Records Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-300 mb-3">
                    Primary Custodian
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <strong>Name:</strong> Compliance Officer
                    </p>
                    <p>
                      <strong>Company:</strong> Fanz Unlimited LLC
                    </p>
                    <p>
                      <strong>Title:</strong> Chief Compliance Officer
                    </p>
                    <p>
                      <strong>Email:</strong> custodian@fanzunlimited.com
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-300 mb-3">
                    Record Location
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <strong>Address:</strong>
                    </p>
                    <div className="ml-4">
                      <p>Fanz Unlimited LLC</p>
                      <p>2257 Compliance Department</p>
                      <p>[Corporate Headquarters]</p>
                      <p>[City, State ZIP]</p>
                      <p>United States</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-blue-500/20">
                <h4 className="font-semibold text-blue-300 mb-3">
                  Inspection Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Inspection Hours:</strong>
                    </p>
                    <p>Monday - Friday: 9:00 AM - 5:00 PM PST</p>
                    <p>By appointment only</p>
                  </div>
                  <div>
                    <p>
                      <strong>Contact for Inspections:</strong>
                    </p>
                    <p>Phone: [Corporate Number]</p>
                    <p>Email: inspection@fanzunlimited.com</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Record Keeping Details */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              Record-Keeping Requirements Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-300">
                  Records Maintained Include:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Legal name and any aliases used by each performer</li>
                  <li>
                    Date of birth verification through government-issued
                    identification
                  </li>
                  <li>Digital copies of valid identification documents</li>
                  <li>Consent forms and agreements signed by all performers</li>
                  <li>Date and location of content creation</li>
                  <li>Contact information for all performers</li>
                  <li>Any stage names or professional names used</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-300">
                  Verification Process:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    Multi-step identity verification using government-issued
                    photo ID
                  </li>
                  <li>Liveness detection to prevent fraudulent submissions</li>
                  <li>Cross-reference with multiple verification databases</li>
                  <li>Manual review by trained compliance specialists</li>
                  <li>Ongoing monitoring and periodic re-verification</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-300">
                  Record Security:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>AES-256 encryption for all stored records</li>
                  <li>Secure, climate-controlled physical storage</li>
                  <li>Limited access on a need-to-know basis</li>
                  <li>Regular backup and disaster recovery procedures</li>
                  <li>Immutable audit trails for all record access</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Compliance */}
        <Card className="border-2 border-purple-500/20 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              Platform Compliance Measures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-purple-300">
                  Automated Compliance Systems:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Real-time age verification before content upload</li>
                  <li>Automatic scanning for compliance documentation</li>
                  <li>Facial recognition matching against verified IDs</li>
                  <li>Content flagging for manual review when required</li>
                  <li>Automated record generation and maintenance</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-300">
                  Creator Verification Requirements:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Complete KYC (Know Your Customer) verification</li>
                  <li>Government-issued photo ID verification</li>
                  <li>Biometric liveness verification</li>
                  <li>Address verification documentation</li>
                  <li>Tax form completion (W-9 or W-8BEN)</li>
                  <li>Digital signature on all consent agreements</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-purple-300">
                  Ongoing Compliance Monitoring:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Regular compliance audits and reviews</li>
                  <li>Periodic re-verification of creator documents</li>
                  <li>Content monitoring for compliance violations</li>
                  <li>Training programs for staff and creators</li>
                  <li>Legal updates and policy adjustments</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Disclaimer */}
        <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              Legal Disclaimer and Enforcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-yellow-300">
                  Enforcement Actions:
                </h4>
                <p>
                  Fanz Unlimited LLC takes compliance seriously. Violations of
                  2257 requirements result in immediate content removal and
                  potential account termination. We cooperate fully with law
                  enforcement agencies and regulatory bodies.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-300">
                  Reporting Violations:
                </h4>
                <p>
                  If you believe content on our platform violates 2257
                  requirements or features underage individuals, report it
                  immediately to:
                </p>
                <div className="mt-2 p-3 bg-background/50 rounded border">
                  <p>
                    <strong>Email:</strong> compliance@fanzunlimited.com
                  </p>
                  <p>
                    <strong>Subject:</strong> 2257 Compliance Violation Report
                  </p>
                  <p>
                    <strong>Phone:</strong> [24/7 Compliance Hotline]
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-yellow-300">
                  Zero Tolerance Policy:
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>No individuals under 18 years of age in any content</li>
                  <li>No content created without proper documentation</li>
                  <li>
                    No content featuring individuals who cannot be age-verified
                  </li>
                  <li>
                    Immediate removal of any flagged content pending
                    verification
                  </li>
                  <li>
                    Permanent ban for users who attempt to upload underage
                    content
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2 border-cyan-500/20 bg-cyan-500/5">
          <CardHeader>
            <CardTitle className="text-xl">
              2257 Compliance Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-cyan-300">
                  General Compliance
                </h4>
                <div className="space-y-1">
                  <p>Email: compliance@fanzunlimited.com</p>
                  <p>Phone: [Compliance Hotline]</p>
                  <p>Response Time: 24 hours</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">
                  Record Inspections
                </h4>
                <div className="space-y-1">
                  <p>Email: inspection@fanzunlimited.com</p>
                  <p>Phone: [Corporate Number]</p>
                  <p>Schedule: By appointment only</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">
                  Legal Department
                </h4>
                <div className="space-y-1">
                  <p>Email: legal@fanzunlimited.com</p>
                  <p>Phone: [Legal Department]</p>
                  <p>For official inquiries only</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">
                  Emergency Reporting
                </h4>
                <div className="space-y-1">
                  <p>Email: emergency@fanzunlimited.com</p>
                  <p>Phone: [24/7 Emergency Line]</p>
                  <p>Available: 24 hours, 7 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="border-2 border-gray-500/20 bg-gray-500/5">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This compliance statement is effective as of September 5, 2025,
              and is subject to updates as required by law. For the most current
              version, please visit this page regularly.
            </p>

            <p className="text-xs text-gray-400 mb-4">
              Document Reference: FANZ-2257-COMPLIANCE-2025-001
            </p>

            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
            >
              Return to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
