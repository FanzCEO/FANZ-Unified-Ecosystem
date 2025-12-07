import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h2 className="text-3xl font-bold text-gradient-purple-gold mb-4">
              CougarFanz
            </h2>
            <p className="text-gray-400 mb-6 max-w-md">
              The premier platform celebrating and empowering mature women content creators. Experience, confidence, and authenticity valued here.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-purple-900 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-purple-900 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-purple-900 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5 text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-purple-900 hover:bg-purple-700 rounded-full flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* For Creators */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">For Creators</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Getting Started</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Pricing & Commission</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Creator Resources</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Success Stories</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Community</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-yellow-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-yellow-400 transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © {currentYear} CougarFanz. All rights reserved. Celebrating mature women creators worldwide.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">18+ Only</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">DMCA</a>
              <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors">2257 Compliance</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}