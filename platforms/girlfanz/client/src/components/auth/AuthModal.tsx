import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logoUrl from "@/assets/logo.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotEmail, setShowForgotEmail] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    securityQuestion: "",
    securityAnswer: "",
    rememberMe: false,
  });

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });
      const data = await response.json();
      
      // Store JWT token in localStorage
      localStorage.setItem("auth_token", data.token);
      
      // Invalidate auth query to refetch user
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
        isCreator: false,
      });
      const data = await response.json();
      
      // Store JWT token in localStorage
      localStorage.setItem("auth_token", data.token);
      
      // Invalidate auth query to refetch user
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      
      onClose();
      setLocation("/feed");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/forgot-password", {
        email: formData.email,
      });
      
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a password reset link.",
      });
      
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not send reset email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotEmail = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/recover-email", {
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer,
      });
      const data = await response.json();
      
      toast({
        title: "Email Found",
        description: data.hint || "Check the information provided",
      });
      
      setShowForgotEmail(false);
    } catch (error: any) {
      toast({
        title: "Email Recovery Failed",
        description: error.message || "Could not recover email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gf-graphite border-gf-smoke/20">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-2xl text-gf-snow mb-2 flex flex-col items-center">
            <img 
              src={logoUrl} 
              alt="GirlFanz" 
              className="h-36 w-auto mb-2" 
              data-testid="img-auth-logo"
            />
            Welcome to the Revolution
          </DialogTitle>
          <p className="text-center text-gf-smoke">Join the cyber-glam creator revolution</p>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gf-graphite">
            <TabsTrigger 
              value="signin" 
              className="data-[state=active]:bg-gf-pink data-[state=active]:text-gf-snow"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="data-[state=active]:bg-gf-pink data-[state=active]:text-gf-snow"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="signin-email" className="text-gf-smoke">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="text-gf-smoke">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signin-password"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setShowForgotEmail(true)}
                className="text-gf-pink hover:text-gf-violet"
              >
                Forgot email?
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-gf-pink hover:text-gf-violet"
              >
                Forgot password?
              </button>
            </div>
            
            <Button 
              onClick={handleLogin}
              disabled={isLoading || !formData.email || !formData.password}
              className="w-full bg-gf-gradient text-gf-snow hover:shadow-glow-pink"
              data-testid="button-signin"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3 max-h-[500px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="signup-firstname" className="text-gf-smoke text-sm">First Name</Label>
                <Input
                  id="signup-firstname"
                  type="text"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                  data-testid="input-signup-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-lastname" className="text-gf-smoke text-sm">Last Name</Label>
                <Input
                  id="signup-lastname"
                  type="text"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                  data-testid="input-signup-lastname"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-gf-smoke text-sm">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signup-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-gf-smoke text-sm">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-signup-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-question" className="text-gf-smoke text-sm">Security Question (for email recovery)</Label>
              <Input
                id="security-question"
                type="text"
                placeholder="e.g., What is your mother's maiden name?"
                value={formData.securityQuestion}
                onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-security-question"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-answer" className="text-gf-smoke text-sm">Security Answer</Label>
              <Input
                id="security-answer"
                type="text"
                placeholder="Your answer"
                value={formData.securityAnswer}
                onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                className="bg-gf-graphite border-gf-smoke/20 text-gf-snow placeholder-gf-smoke focus:border-gf-pink"
                data-testid="input-security-answer"
              />
            </div>
            
            <Button 
              onClick={handleRegister}
              disabled={isLoading || !formData.email || !formData.password || formData.password.length < 8}
              className="w-full bg-gf-gradient text-gf-snow hover:shadow-glow-pink mt-4"
              data-testid="button-signup"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gf-smoke">
          By continuing, you agree to our{" "}
          <a href="#" className="text-gf-pink">Terms</a> and{" "}
          <a href="#" className="text-gf-pink">Privacy Policy</a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
