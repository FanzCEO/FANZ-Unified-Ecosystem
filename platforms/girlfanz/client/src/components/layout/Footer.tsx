import { Link } from "wouter";
import logoUrl from "@/assets/logo.jpg";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: "For Creators", href: "/creators" },
      { name: "For Fans", href: "/fans" },
      { name: "Pricing", href: "/pricing" },
      { name: "Features", href: "/features" },
    ],
    support: [
      { name: "Help Center", href: "/help" },
      { name: "Safety Center", href: "/safety" },
      { name: "Community Guidelines", href: "/guidelines" },
      { name: "Contact Us", href: "/contact" },
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Blog", href: "/blog" },
    ],
    legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "2257 Compliance", href: "/compliance" },
    ],
  };

  const socialLinks = [
    { name: "Twitter", icon: "𝕏", href: "https://twitter.com/girlfanz" },
    { name: "Instagram", icon: "📷", href: "https://instagram.com/girlfanz" },
    { name: "TikTok", icon: "🎵", href: "https://tiktok.com/@girlfanz" },
    { name: "Discord", icon: "💬", href: "https://discord.gg/girlfanz" },
  ];

  return (
    <footer className="bg-gf-graphite border-t border-gf-smoke/20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-gf-ink via-gf-graphite to-transparent opacity-50" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main footer content */}
        <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-1 sm:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <img 
                src={logoUrl} 
                alt="GirlFanz" 
                className="h-36 w-auto" 
                data-testid="img-footer-logo"
              />
            </Link>
            <p className="text-gf-smoke text-sm leading-relaxed mb-6">
              The premier platform where fierce female creators connect with devoted fans. 
              Join the cyber-glam revolution and build your empire.
            </p>
            
            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gf-ink rounded-lg flex items-center justify-center text-gf-smoke hover:text-gf-pink hover:bg-gf-pink/10 transition-colors"
                  data-testid={`link-social-${social.name.toLowerCase()}`}
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="font-display font-semibold text-gf-snow mb-4 neon-cyan">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gf-smoke hover:text-gf-cyan transition-colors text-sm"
                    data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-display font-semibold text-gf-snow mb-4 neon-violet">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gf-smoke hover:text-gf-violet transition-colors text-sm"
                    data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-display font-semibold text-gf-snow mb-4 neon-pink">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gf-smoke hover:text-gf-pink transition-colors text-sm"
                    data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="font-display font-semibold text-gf-snow mb-4 neon-snow">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gf-smoke hover:text-gf-snow transition-colors text-sm"
                    data-testid={`link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-gf-smoke/20 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <p className="text-gf-smoke text-sm">
              © {currentYear} GirlFanz. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gf-smoke">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
                Platform Status: Operational
              </span>
              <span>18+ Only</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gf-smoke">
            <span>Built with 💜 in the cyber-verse</span>
            <Link 
              href="/compliance" 
              className="hover:text-gf-pink transition-colors"
              data-testid="link-compliance-notice"
            >
              Age Verification Required
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}