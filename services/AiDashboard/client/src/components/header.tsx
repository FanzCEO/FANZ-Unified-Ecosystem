import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Bot, Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 creative-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 gradient-creator rounded-2xl flex items-center justify-center transform rotate-12 hover:rotate-0 hover:scale-110 transition-all duration-300 pulse-glow">
              <Bot className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold font-poppins bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 cursor-pointer">MagicAI</h1>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`font-medium transition-colors ${location === '/' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
              Home
            </Link>
            <Link href="/automation" className={`font-medium transition-colors ${location === '/automation' ? 'text-primary' : 'text-gray-600 hover:text-primary'}`}>
              Automation
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:flex" data-testid="button-signin">
              Sign In
            </Button>
            <Link href="/dashboard">
              <Button className="gradient-creator text-white hover:scale-105 hover:rotate-1 transition-all duration-300 font-semibold px-6 rounded-2xl group relative overflow-hidden" data-testid="button-get-started">
                <span className="relative z-10">Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
