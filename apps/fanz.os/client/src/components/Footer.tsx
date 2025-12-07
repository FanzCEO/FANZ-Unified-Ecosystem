import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const legalLinks = [
    { name: "Terms & Conditions", path: "/legal/terms-conditions" },
    { name: "Privacy & Age Verification", path: "/legal/privacy" },
    { name: "About Us", path: "/legal/about" },
    { name: "Content Management Policy and Data Governance Procedures", path: "/legal/content-data" },
    { name: "Cookies Policy", path: "/legal/cookies" },
    { name: "Legal Library & Ethics Policy", path: "/legal/legal-compliance" },
    { name: "Complaint Policy", path: "/legal/complaint" },
    { name: "Cancellation Policy", path: "/legal/cancellation-policy" },
    { name: "Adult Star Model Release: 2257 and Agreement with Fanz™ Unlimited Network LLC", path: "/legal/model-release-2257" },
    { name: "Adult Co-Star Model Release: 2257 and Agreement with Fanz™ Unlimited Network LLC", path: "/legal/co-star-2257" },
    { name: "Transaction/Chargeback Policy", path: "/legal/transaction-chargeback" },
    { name: "Tech Support", path: "/tech-support" },
    { name: "Want to Request a New Feature?", path: "/feature-request" },
    { name: "Become a VIP", path: "/vip" },
    { name: "Contact us", path: "/contact" },
    { name: "Blog", path: "/blog" }
  ];

  return (
    <footer className="bg-slate-900/95 border-t border-slate-700/50 text-gray-300 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <p className="text-sm">
            © {currentYear} Fanz, All rights reserved.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Fanz™ Unlimited Network (FUN) L.L.C. - Address: 30 N Gould Street #45302 Sheridan, WY 82801
          </p>
          <p className="text-sm text-gray-400">
            Email: support@fanzunlimited.com | Phone: (307) 216-3828
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {legalLinks.map((link, index) => (
            <span key={link.path}>
              <Link 
                href={link.path}
                className="text-purple-400 hover:text-purple-300 transition-colors"
                data-testid={`footer-link-${link.path.replace('/legal/', '').replace('/', '')}`}
              >
                {link.name}
              </Link>
              {index < legalLinks.length - 1 && <span className="text-gray-500 ml-4">|</span>}
            </span>
          ))}
        </div>

        <div className="text-center mt-6">
          <div className="flex justify-center items-center space-x-4">
            <select className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm">
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
            <button className="text-purple-400 hover:text-purple-300 text-sm">
              Install Web App
            </button>
          </div>
        </div>

        <div className="flex justify-center mt-6 space-x-4">
          <img 
            src="https://images.dmca.com/Badges/DMCA_logo-200w.png" 
            alt="DMCA Protection Status" 
            className="h-8"
          />
          <img 
            src="https://www.dmca.com/img/dmca-compliant-grayscale.png" 
            alt="DMCA Compliant" 
            className="h-8"
          />
        </div>
      </div>
    </footer>
  );
}