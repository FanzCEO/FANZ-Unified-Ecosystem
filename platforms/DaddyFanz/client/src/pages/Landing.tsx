import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import daddyFanzLogo from "@assets/daddyfanzlogo1_1759189347461.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCSRFHeaders } from "@/hooks/useCSRF";
import { AlertTriangle, Shield, DollarSign, Users, Eye, Zap } from "lucide-react";

export default function Landing() {
  const { isLoading } = useAuth();
  const { toast } = useToast();
  const { token: csrfToken } = useCSRFHeaders();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure CSRF token is available
    if (!csrfToken) {
      toast({
        title: "Please wait",
        description: "Security token is loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (authMode === "register") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        
        await apiRequest("POST", "/api/auth/signup", formData);
        
        toast({
          title: "Account Created",
          description: "Welcome to DaddyFanz! Please log in to continue.",
        });
        
        setAuthMode("login");
      } else {
        const response = await apiRequest("POST", "/api/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        
        const data = await response.json();
        localStorage.setItem("authToken", data.token);
        
        toast({
          title: "Welcome Back",
          description: "You've been logged in successfully.",
        });
        
        // Trigger auth refresh
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center">
        <div className="text-df-cyan text-xl font-display">Loading DaddyFanz...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-df-dungeon">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-chain-pattern opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src={daddyFanzLogo} 
                  alt="DaddyFanz" 
                  className="h-32 w-auto md:h-40 lg:h-48 glow-image animate-pulse-glow"
                />
              </div>
              <p className="text-df-fog text-xl max-w-2xl mx-auto">
                The ultimate adult content creator platform. Raw, dominant, and unapologetically bold.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                onClick={() => {
                  setAuthMode("register");
                  setShowAuthModal(true);
                }}
                className="btn-primary px-8 py-4 text-lg pulse-glow"
                data-testid="button-signup"
              >
                <Zap className="mr-2 h-5 w-5" />
                Join the Kingdom
              </Button>
              
              <Button 
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="bg-df-dom text-df-snow px-8 py-4 text-lg hover:shadow-glow"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </div>

            {/* Age Verification Notice */}
            <div className="flex items-center justify-center gap-2 text-df-fog text-sm">
              <AlertTriangle className="h-4 w-4 text-df-gold" />
              <span>18+ Only. By joining, you confirm you are of legal age.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl text-center mb-12 neon-heading-caps">
          Built for Creators, Designed for Dominance
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card className="card-df p-6">
            <CardHeader>
              <DollarSign className="h-12 w-12 text-df-gold mb-4" />
              <CardTitle className="neon-subheading">Adult-Friendly Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog">
                Integrated with CCBill, Segpay, and Paxum. Never worry about payment processor bans again.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="card-df p-6">
            <CardHeader>
              <Shield className="h-12 w-12 text-df-cyan mb-4" />
              <CardTitle className="neon-subheading">Compliance Built-In</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog">
                18 U.S.C. §2257 compliance, KYC verification, and GDPR ready. Your safety is our priority.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="card-df p-6">
            <CardHeader>
              <Users className="h-12 w-12 text-df-gold mb-4" />
              <CardTitle className="neon-subheading">Real-Time Interaction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog">
                Live messaging, instant notifications, and WebSocket-powered real-time features.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-df-brick py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl neon-heading mb-2">$2M+</div>
              <div className="text-df-fog">Creator Earnings</div>
            </div>
            <div>
              <div className="text-4xl glow-text-gold mb-2">10K+</div>
              <div className="text-df-fog">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl neon-heading mb-2">99.9%</div>
              <div className="text-df-fog">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-df-ink py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="text-xl mb-4">
                <span className="neon-heading">Daddy</span><span className="glow-text-gold">Fanz</span>
              </div>
              <p className="text-df-fog text-sm">Adult content platform for creators and fans.</p>
            </div>

            {/* Compliance */}
            <div>
              <h4 className="text-df-snow font-semibold mb-4">Compliance</h4>
              <ul className="space-y-2 text-df-fog text-sm">
                <li>18 U.S.C. § 2257</li>
                <li>GDPR Compliance</li>
                <li>Age Verification</li>
                <li>KYC/AML Policy</li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-df-snow font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-df-fog text-sm">
                <li>Help Center</li>
                <li>Creator Guide</li>
                <li>Payment Help</li>
                <li>Contact Us</li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-df-snow font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-df-fog text-sm">
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
                <li>DMCA Policy</li>
                <li>Acceptable Use</li>
              </ul>
            </div>
          </div>

          <div className="chain-divider my-8"></div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-df-fog text-sm">© 2024 DaddyFanz. All rights reserved. Adult content platform 18+</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-df-fog text-sm">Powered by:</span>
              <div className="flex items-center space-x-2 text-df-steel text-xs">
                <span>CCBill</span>
                <span>•</span>
                <span>Segpay</span>
                <span>•</span>
                <span>Paxum</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowForgotPassword(false)}>
          <Card className="card-df max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-2xl neon-heading-caps text-center">
                Reset Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                // Ensure CSRF token is available
                if (!csrfToken) {
                  toast({
                    title: "Please wait",
                    description: "Security token is loading. Please try again in a moment.",
                    variant: "destructive",
                  });
                  return;
                }
                
                setIsSubmitting(true);
                
                try {
                  await apiRequest("POST", "/api/auth/forgot-password", {
                    email: formData.email,
                  });
                  
                  toast({
                    title: "Email Sent",
                    description: "Check your email for password reset instructions.",
                  });
                  
                  setShowForgotPassword(false);
                  setFormData(prev => ({ ...prev, email: "" }));
                } catch (error) {
                  toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to send reset email",
                    variant: "destructive",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email" className="text-df-fog">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-df"
                    placeholder="Enter your email"
                    required
                    data-testid="input-reset-email"
                  />
                  <p className="text-df-fog text-xs mt-2">
                    We'll send you a link to reset your password.
                  </p>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !csrfToken}
                  className="w-full btn-secondary"
                  data-testid="button-send-reset"
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowAuthModal(true);
                  }}
                  className="text-df-cyan hover:text-df-gold transition-colors text-sm"
                  data-testid="button-back-to-login"
                >
                  Back to Sign In
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAuthModal(false)}>
          <Card className="card-df max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-2xl neon-heading-caps text-center">
                {authMode === "login" ? "Welcome Back" : "Join DaddyFanz"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === "register" && (
                  <div>
                    <Label htmlFor="username" className="text-df-fog">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="input-df"
                      required
                      data-testid="input-username"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email" className="text-df-fog">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-df"
                    required
                    data-testid="input-email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-df-fog">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="input-df"
                    required
                    minLength={8}
                    data-testid="input-password"
                  />
                </div>
                
                {authMode === "register" && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-df-fog">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="input-df"
                      required
                      minLength={8}
                      data-testid="input-confirm-password"
                    />
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !csrfToken}
                  className="w-full btn-secondary"
                  data-testid="button-submit"
                >
                  {isSubmitting ? "Processing..." : authMode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>
              
              {authMode === "login" && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setShowAuthModal(false);
                      setShowForgotPassword(true);
                    }}
                    className="text-df-cyan hover:text-df-gold transition-colors text-sm"
                    data-testid="button-forgot-password"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-df-cyan hover:text-df-gold transition-colors text-sm"
                  data-testid="button-toggle-auth"
                >
                  {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
              
              <p className="text-df-fog text-xs text-center mt-4">
                <AlertTriangle className="inline h-3 w-3 text-df-gold mr-1" />
                By joining, you confirm you are 18+ and agree to our Terms & Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
