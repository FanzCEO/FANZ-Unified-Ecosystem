import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { toast } = useToast();
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
    setIsSubmitting(true);

    try {
      if (authMode === "register") {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        
        await apiRequest("POST", "/api/auth/register", {
          ...formData,
          authProvider: "local",
        });
        
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
        
        onSuccess?.();
        onClose();
        
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

  const handleReplitAuth = () => {
    window.location.href = "/api/login";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
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
              disabled={isSubmitting}
              className="w-full btn-secondary"
              data-testid="button-submit"
            >
              {isSubmitting ? "Processing..." : authMode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              className="text-df-cyan hover:text-df-gold transition-colors text-sm"
              data-testid="button-toggle-auth"
            >
              {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
          
          <div className="chain-divider my-6"></div>
          
          <Button 
            onClick={handleReplitAuth}
            className="w-full bg-df-dom text-df-snow hover:shadow-glow"
            data-testid="button-replit-auth"
          >
            Continue with Replit
          </Button>
          
          <p className="text-df-fog text-xs text-center mt-4">
            <AlertTriangle className="inline h-3 w-3 text-df-gold mr-1" />
            By joining, you confirm you are 18+ and agree to our Terms & Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
