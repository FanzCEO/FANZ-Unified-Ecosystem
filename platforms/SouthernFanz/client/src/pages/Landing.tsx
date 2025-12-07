import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, Star, LogIn, GraduationCap, MessageSquare, Zap, Upload, Shield, DollarSign, TrendingUp, Bolt } from "lucide-react";
import AIChatBot from "@/components/AIChatBot";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/auth/login");
  };

  const handleFanzSignup = () => {
    setLocation("/auth/fanz-signup");
  };

  const handleStarzSignup = () => {
    setLocation("/auth/starz-signup");
  };

  return (
    <div className="min-h-screen bg-background text-foreground homepage-bg" data-testid="landing-page">
      {/* ACCESSIBILITY: Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Hero Section */}
      <main id="main-content" className="relative overflow-hidden" role="main" aria-label="SouthernFanz platform introduction">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/10"></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-12">
              <img 
                src="/southernfanz-logo.png" 
                alt="SouthernFanz - Every Man's Playground logo" 
                className="h-48 md:h-64 w-auto glow-effect rounded-lg transform hover:scale-105 transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 0, 0, 0.4)) drop-shadow(0 0 40px rgba(255, 0, 0, 0.2))',
                  boxShadow: '0 0 30px rgba(255, 0, 0, 0.3), 0 0 60px rgba(255, 0, 0, 0.1)'
                }}
                role="img"
                data-testid="southernfanz-logo-enhanced"
              />
            </div>
            <p className="text-2xl mb-8 max-w-2xl mx-auto">
              <span className="text-5xl font-display font-black seedy-neon-golden block mb-3 tracking-wide uppercase">Raise Hell. Ride Free.</span>
              <span className="font-body seedy-neon-white">The badass platform for Southern rebels who don't play by the rules.
              Where bad boys and girls run wild, make bank, and own their empire.</span>
            </p>
            {/* Dual Sign-Up Sections */}
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-8">
              {/* Fan Sign Up - Blood Red */}
              <div className="text-center p-6 rounded-lg bg-card/40 border border-red-500/30 glow-effect hover:bg-card/60 transition-all duration-300">
                <Users className="h-8 w-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-xl font-display seedy-neon-red mb-2">JOIN THE REBELLION</h3>
                <p className="text-sm seedy-neon-white mb-4 max-w-xs">
                  Roll with the wildest creators in the South. Exclusive content from rebels who don't hold back.
                </p>
                <Button
                  onClick={handleFanzSignup}
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold neon-button"
                  data-testid="fan-signup-button"
                >
                  Ride With Us
                </Button>
              </div>

              {/* Star Sign Up - Gold */}
              <div className="text-center p-6 rounded-lg bg-card/40 border border-yellow-500/30 hover:bg-card/60 transition-all duration-300" style={{
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.2)'
              }}>
                <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-xl font-display seedy-neon-golden mb-2">BECOME A LEGEND</h3>
                <p className="text-sm seedy-neon-white mb-4 max-w-xs">
                  Own your hustle. Keep 100% of your earnings. Built for outlaws who play to win.
                </p>
                <Button
                  onClick={handleStarzSignup}
                  size="lg"
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black font-semibold gold-button"
                  data-testid="star-signup-button"
                >
                  Start Your Empire
                </Button>
              </div>
            </div>

            {/* Dedicated Login Area */}
            <div className="flex justify-center">
              <Button 
                onClick={handleLogin}
                variant="outline"
                size="lg"
                className="border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-semibold px-8 py-3 transition-all duration-300"
                data-testid="login-button"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Already Have An Account? Login
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-card/30 club-glow" aria-label="Platform features" role="region">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-heading mb-4 tracking-tight seedy-neon-red">
              BUILT FOR OUTLAWS
            </h2>
            <p className="text-2xl font-body seedy-neon-white">
              Badass tools for rebels who don't settle for less
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="seedy-neon-red">Fort Knox Security</CardTitle>
                <CardDescription className="seedy-neon-white">
                  Your content locked down tighter than a moonshine still. Military-grade encryption keeps your goods safe.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="text-secondary h-6 w-6" />
                </div>
                <CardTitle className="seedy-neon-blue">Bulletproof Compliance</CardTitle>
                <CardDescription className="seedy-neon-white">
                  We handle the legal BS so you can focus on creating. Fully compliant, zero drama.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="text-accent h-6 w-6" />
                </div>
                <CardTitle className="seedy-neon-golden">Get Paid Fast</CardTitle>
                <CardDescription className="seedy-neon-white">
                  Money hits your account faster than a muscle car off the line. Multiple payout options, your choice.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <CardTitle className="seedy-neon-red">Rally Your Crew</CardTitle>
                <CardDescription className="seedy-neon-white">
                  Build your ride-or-die fanbase. Tools to connect, engage, and keep 'em coming back for more.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="text-secondary h-6 w-6" />
                </div>
                <CardTitle className="seedy-neon-blue">Know Your Numbers</CardTitle>
                <CardDescription className="seedy-neon-white">
                  Track every dollar, every view, every win. Analytics that show you exactly how to dominate.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Bolt className="text-accent h-6 w-6" />
                </div>
                <CardTitle className="seedy-neon-golden">Lightning Fast</CardTitle>
                <CardDescription className="seedy-neon-white">
                  Real-time everything. Notifications, updates, earnings - the moment it happens, you know.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Assisted Tutorials Section */}
      <section className="py-24 bg-gradient-to-br from-red-900/10 via-black/50 to-yellow-900/10" aria-label="AI tutorials and help" role="region">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold font-display mb-4 tracking-tight seedy-neon-red">
              YOUR AI SIDEKICK
            </h2>
            <p className="text-2xl font-body seedy-neon-white mb-8">
              Got questions? Our AI's got answers. 24/7, no BS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/40 border-red-500/30 hover:bg-card/60 transition-all duration-300 glow-effect">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <MessageSquare className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="seedy-neon-red text-lg">INSTANT BACKUP</CardTitle>
                <CardDescription className="seedy-neon-white text-sm">
                  Stuck? Our AI jumps in with answers faster than a getaway driver.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/40 border-yellow-500/30 hover:bg-card/60 transition-all duration-300" style={{
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)'
            }}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <GraduationCap className="h-8 w-8 text-yellow-500" />
                </div>
                <CardTitle className="seedy-neon-golden text-lg">HUSTLE SCHOOL</CardTitle>
                <CardDescription className="seedy-neon-white text-sm">
                  Step-by-step guides to master the game. Content, cash, conquering - we cover it all.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/40 border-red-500/30 hover:bg-card/60 transition-all duration-300 glow-effect">
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-red-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Zap className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="seedy-neon-red text-lg">ZERO TO HERO</CardTitle>
                <CardDescription className="seedy-neon-white text-sm">
                  Hit the ground running. Start making money within minutes of signing up.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card/40 border-yellow-500/30 hover:bg-card/60 transition-all duration-300" style={{
              boxShadow: '0 0 10px rgba(212, 175, 55, 0.1)'
            }}>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-8 w-8 text-yellow-500" />
                </div>
                <CardTitle className="seedy-neon-golden text-lg">REBEL PLAYBOOK</CardTitle>
                <CardDescription className="seedy-neon-white text-sm">
                  Battle-tested tips and tricks from the rebels who've been there, done that.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg seedy-neon-white mb-6">
              Need backup? Our AI is locked and loaded 24/7. Hit that chat bubble.
            </p>
            <div className="flex justify-center items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-red-500 animate-pulse" />
              <span className="text-sm seedy-neon-red font-display">TAP THE BUBBLE - LET'S RIDE</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24" aria-label="Call to action" role="region">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold font-heading mb-6 tracking-tight seedy-neon-red">
            READY TO RAISE SOME HELL?
          </h2>
          <p className="text-2xl mb-8 font-body seedy-neon-white">
            Join the rebellion. Thousands of bad boys and girls are already stacking cash on <span className="font-display font-black seedy-neon-golden tracking-wide">SouthernFanz</span>.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="glow-effect font-semibold text-lg px-8 py-4"
            data-testid="cta-login-button"
          >
            Let's Ride
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-200 py-8" role="contentinfo" aria-label="Site footer with legal information">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Terms & Conditions</a>
              <a href="/blog" className="block text-sm text-gray-600 hover:text-gray-800">About Us</a>
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Cookies Policy</a>
              <a href="/contact" className="block text-sm text-gray-600 hover:text-gray-800">Complaint Policy</a>
            </div>
            <div className="space-y-2">
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Privacy & Age Verification</a>
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Content Management Policy and Data Governance Procedures</a>
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Legal Library & Ethics Policy</a>
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Cancellation Policy</a>
            </div>
            <div className="space-y-2">
              <a href="/release-forms" className="block text-sm text-gray-600 hover:text-gray-800">Adult Star Model Release: 2257 and Agreement with Fanz™ Unlimited Network LLC</a>
              <a href="/compliance" className="block text-sm text-gray-600 hover:text-gray-800">Transaction/Chargeback Policy</a>
              <a href="/contact" className="block text-sm text-gray-600 hover:text-gray-800">Want to Request a New Feature?</a>
              <a href="/contact" className="block text-sm text-gray-600 hover:text-gray-800">Contact us</a>
            </div>
            <div className="space-y-2">
              <a href="/release-forms" className="block text-sm text-gray-600 hover:text-gray-800">Adult Co-Star Model Release: 2257 and Agreement with Fanz™ Unlimited Network LLC</a>
              <a href="/contact" className="block text-sm text-gray-600 hover:text-gray-800">Tech Support</a>
              <a href="/subscriptions" className="block text-sm text-gray-600 hover:text-gray-800">Become a VIP</a>
              <a href="/blog" className="block text-sm text-gray-600 hover:text-gray-800">Blog</a>
            </div>
          </div>

          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">
              © 2025 SouthernFanz. All rights reserved. FANZ (FANZ) L.L.C. - Address: 30 N Gould St #45302 Sheridan, Wyoming United States
            </p>
          </div>

          <div className="flex justify-center items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">PROTECTED BY:</span>
              <div className="flex items-center space-x-1">
                <div className="bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">DMCA</div>
                <span className="text-xs text-gray-600">DMCA.com COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* AI Chatbot Component */}
      <AIChatBot />
    </div>
  );
}