import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Lock,
  CheckCircle,
  Award,
  FileText,
  Users,
  Globe,
  Heart,
  ShieldCheck,
  Scale,
  CreditCard,
  Key,
  AlertCircle,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Verified,
  BadgeCheck,
  ShieldAlert,
  FileCheck,
  UserCheck,
  LockKeyhole,
  Copyright
} from "lucide-react";
import { Link } from "wouter";

export function TrustBadges() {
  return (
    <div className="bg-gray-800 border-t border-gray-700 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Your Safety & Trust is Our Priority</h3>
          <p className="text-gray-400">Industry-leading compliance and protection standards</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* DMCA Protected */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center">
                  <Copyright className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white">DMCA</p>
              <p className="text-xs text-gray-400">Protected</p>
            </CardContent>
          </Card>

          {/* SSL Secured */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white">SSL</p>
              <p className="text-xs text-gray-400">Encrypted</p>
            </CardContent>
          </Card>

          {/* Age Verified */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white">18+</p>
              <p className="text-xs text-gray-400">Age Verified</p>
            </CardContent>
          </Card>

          {/* GDPR Compliant */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-indigo-900 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white">GDPR</p>
              <p className="text-xs text-gray-400">Compliant</p>
            </CardContent>
          </Card>

          {/* CCPA Compliant */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-yellow-900 rounded-full flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white">CCPA</p>
              <p className="text-xs text-gray-400">Compliant</p>
            </CardContent>
          </Card>

          {/* Fraud Protection */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-red-900 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <p className="text-xs font-semibold text-white">Fraud</p>
              <p className="text-xs text-gray-400">Protection</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PaymentTrust() {
  const paymentMethods = [
    { name: "CCBill", logo: "💳", trusted: true },
    { name: "NowPayments", logo: "🔐", trusted: true },
    { name: "Triple-A", logo: "⚡", trusted: true },
    { name: "Bankful", logo: "🏦", trusted: true },
    { name: "Authorize.net", logo: "✅", trusted: true },
    { name: "Crypto", logo: "₿", trusted: true }
  ];

  return (
    <div className="bg-gray-900 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-400 mb-2">Secure Payment Methods</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {paymentMethods.map((method) => (
            <div key={method.name} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-2xl">{method.logo}</span>
              <div>
                <p className="text-xs font-semibold text-white">{method.name}</p>
                {method.trusted && (
                  <p className="text-xs text-green-400 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      {/* Trust Badges Section */}
      <TrustBadges />
      
      {/* Payment Methods */}
      <PaymentTrust />

      <Separator className="bg-gray-800" />

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">FanzLab</h3>
            <p className="text-sm text-gray-400 mb-4">
              The premium platform for content creators and their fanz. Built with safety, privacy, and trust at its core.
            </p>
            <div className="flex flex-col gap-2">
              <Badge className="bg-green-900 text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified Platform
              </Badge>
              <Link href="/legal-vault">
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white w-full">
                  <Lock className="w-3 h-3 mr-1" />
                  Access Legal Vault
                </Button>
              </Link>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal & Compliance</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dmca" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Copyright className="w-3 h-3 mr-2" />
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <FileText className="w-3 h-3 mr-2" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Shield className="w-3 h-3 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Key className="w-3 h-3 mr-2" />
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <CreditCard className="w-3 h-3 mr-2" />
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Scale className="w-3 h-3 mr-2" />
                  Compliance Guidelines
                </Link>
              </li>
              <li>
                <Link href="/transparency" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <FileCheck className="w-3 h-3 mr-2" />
                  Transparency Reports
                </Link>
              </li>
              <li>
                <Link href="/legal-library" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <FileText className="w-3 h-3 mr-2" />
                  Legal Library
                </Link>
              </li>
              <li>
                <Link href="/legal-vault" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Lock className="w-3 h-3 mr-2" />
                  My Legal Vault
                </Link>
              </li>
              <li>
                <Link href="/compliance-dashboard" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Shield className="w-3 h-3 mr-2" />
                  Compliance Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Creator Resources */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Creator Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/creator-safety" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-2" />
                  Creator Safety Guide
                </Link>
              </li>
              <li>
                <Link href="/health-resources" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Heart className="w-3 h-3 mr-2" />
                  Health & Wellness
                </Link>
              </li>
              <li>
                <Link href="/consent-education" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Users className="w-3 h-3 mr-2" />
                  Consent Education
                </Link>
              </li>
              <li>
                <Link href="/crisis-support" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Phone className="w-3 h-3 mr-2" />
                  Crisis Support
                </Link>
              </li>
              <li>
                <Link href="/tax-center" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <FileText className="w-3 h-3 mr-2" />
                  Tax Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <HelpCircle className="w-3 h-3 mr-2" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <Mail className="w-3 h-3 mr-2" />
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/report" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <AlertCircle className="w-3 h-3 mr-2" />
                  Report Content
                </Link>
              </li>
              <li>
                <Link href="/complaints" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <MessageCircle className="w-3 h-3 mr-2" />
                  Complaints Portal
                </Link>
              </li>
              <li>
                <Link href="/verification" className="text-sm text-gray-400 hover:text-white flex items-center">
                  <BadgeCheck className="w-3 h-3 mr-2" />
                  Verification Help
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Recognition */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Trust & Recognition</h4>
            <div className="space-y-3">
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">As Featured In</p>
                <div className="flex gap-2 text-xs text-white">
                  <span>TechCrunch</span>
                  <span>•</span>
                  <span>Forbes</span>
                  <span>•</span>
                  <span>Wired</span>
                </div>
              </div>
              
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Platform Stats</p>
                <div className="text-xs text-white">
                  <p>• 10M+ Active Users</p>
                  <p>• 500K+ Verified Creators</p>
                  <p>• $100M+ Paid to Creators</p>
                </div>
              </div>

              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">24/7 Support</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs border-gray-700">
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-gray-700">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800 my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              © 2024 FanzLab. All rights reserved.
            </p>
            <span className="text-gray-600">•</span>
            <p className="text-xs text-gray-400">
              Platform ID: FL-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-gray-800 text-gray-400">
              <Globe className="w-3 h-3 mr-1" />
              Available Worldwide
            </Badge>
            <Badge className="bg-gray-800 text-gray-400">
              <Lock className="w-3 h-3 mr-1" />
              Bank-Level Security
            </Badge>
            <Badge className="bg-gray-800 text-gray-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              100% Creator Revenue
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}