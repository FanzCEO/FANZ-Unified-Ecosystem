import { Footer } from "@/components/layout/Footer";
import { Mail, MessageSquare, Shield, HelpCircle } from "lucide-react";
import { Link } from "wouter";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Contact Us</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">We're here to help. Choose the best way to reach us.</p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/help" className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg hover:border-gf-pink/50 transition-colors cursor-pointer" data-testid="link-help-center">
            <HelpCircle className="w-12 h-12 text-gf-pink mb-4" />
            <h2 className="text-2xl font-semibold text-gf-snow mb-2">Help Center</h2>
            <p className="text-gf-smoke">Browse articles, guides, and FAQs for quick answers.</p>
          </Link>

          <Link href="/help/contact" className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg hover:border-gf-pink/50 transition-colors cursor-pointer" data-testid="link-support-ticket">
            <MessageSquare className="w-12 h-12 text-gf-violet mb-4" />
            <h2 className="text-2xl font-semibold text-gf-snow mb-2">Submit a Ticket</h2>
            <p className="text-gf-smoke">Get personalized support from our team.</p>
          </Link>
        </div>

        <div className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold text-gf-snow mb-6">Email Support</h2>
          <div className="space-y-4 text-gf-smoke">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-gf-pink" />
                <h3 className="font-semibold text-gf-snow">General Inquiries</h3>
              </div>
              <a href="mailto:support@girlfanz.com" className="text-gf-pink hover:text-gf-violet transition-colors">support@girlfanz.com</a>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-gf-pink" />
                <h3 className="font-semibold text-gf-snow">Safety & Abuse Reports</h3>
              </div>
              <a href="mailto:abuse@girlfanz.com" className="text-gf-pink hover:text-gf-violet transition-colors">abuse@girlfanz.com</a>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-gf-pink" />
                <h3 className="font-semibold text-gf-snow">Legal & Compliance</h3>
              </div>
              <a href="mailto:legal@girlfanz.com" className="text-gf-pink hover:text-gf-violet transition-colors">legal@girlfanz.com</a>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-gf-pink" />
                <h3 className="font-semibold text-gf-snow">Creator Support</h3>
              </div>
              <a href="mailto:creators@girlfanz.com" className="text-gf-pink hover:text-gf-violet transition-colors">creators@girlfanz.com</a>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-5 h-5 text-gf-pink" />
                <h3 className="font-semibold text-gf-snow">Business & Partnerships</h3>
              </div>
              <a href="mailto:business@girlfanz.com" className="text-gf-pink hover:text-gf-violet transition-colors">business@girlfanz.com</a>
            </div>
          </div>
        </div>

        <div className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-gf-snow mb-4">Office Location</h2>
          <p className="text-gf-smoke">
            GirlFanz, Inc.<br />
            123 Tech Boulevard, Suite 400<br />
            San Francisco, CA 94105<br />
            United States
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
