import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import daddyFanzLogo from "@assets/daddyfanzlogo1_1759189347461.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Check } from "lucide-react";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      toast({
        title: "Invalid Link",
        description: "No reset token found. Please request a new password reset link.",
        variant: "destructive",
      });
      setTimeout(() => setLocation("/"), 3000);
    } else {
      setToken(tokenParam);
    }
  }, [toast, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords don't match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });

      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. Redirecting to login...",
      });

      setResetComplete(true);
      setTimeout(() => setLocation("/"), 3000);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Invalid or expired token. Please request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (resetComplete) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center px-4">
        <Card className="card-df max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-df-cyan rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-df-dungeon" />
              </div>
            </div>
            <h2 className="text-2xl neon-heading mb-4">Password Updated!</h2>
            <p className="text-df-fog mb-4">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <p className="text-df-steel text-sm">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-df-dungeon flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={daddyFanzLogo} 
            alt="DaddyFanz" 
            className="h-24 w-auto glow-image animate-pulse-glow"
          />
        </div>

        <Card className="card-df">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-df-cyan" />
            </div>
            <CardTitle className="text-2xl neon-heading-caps text-center">
              Reset Your Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-df-fog">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-df"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  data-testid="input-new-password"
                />
                <p className="text-df-fog text-xs mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-df-fog">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-df"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  data-testid="input-confirm-password"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !token}
                className="w-full btn-secondary"
                data-testid="button-reset-password"
              >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setLocation("/")}
                className="text-df-cyan hover:text-df-gold transition-colors text-sm"
                data-testid="button-back-home"
              >
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
