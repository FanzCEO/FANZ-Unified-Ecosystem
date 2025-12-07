import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-3xl font-bold text-gradient-purple-gold">
              CougarFanz
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-gray-700 hover:text-purple-900 font-medium transition-colors">
              Home
            </a>
            <a href="#creators" className="text-gray-700 hover:text-purple-900 font-medium transition-colors">
              For Creators
            </a>
            <a href="#fans" className="text-gray-700 hover:text-purple-900 font-medium transition-colors">
              For Fans
            </a>
            <a href="#about" className="text-gray-700 hover:text-purple-900 font-medium transition-colors">
              About
            </a>
            <Button variant="outline" className="!bg-transparent !hover:bg-transparent border-purple-900 text-purple-900 hover:bg-purple-50">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white">
              Join Now
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-6 space-y-4">
            <a href="#home" className="block text-gray-700 hover:text-purple-900 font-medium transition-colors py-2">
              Home
            </a>
            <a href="#creators" className="block text-gray-700 hover:text-purple-900 font-medium transition-colors py-2">
              For Creators
            </a>
            <a href="#fans" className="block text-gray-700 hover:text-purple-900 font-medium transition-colors py-2">
              For Fans
            </a>
            <a href="#about" className="block text-gray-700 hover:text-purple-900 font-medium transition-colors py-2">
              About
            </a>
            <div className="flex flex-col space-y-3 pt-4">
              <Button variant="outline" className="!bg-transparent !hover:bg-transparent border-purple-900 text-purple-900 w-full">
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-purple-900 to-purple-700 text-white w-full">
                Join Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}