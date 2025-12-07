import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";

export default function AccessGate() {
  const [accessCode, setAccessCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    // Simulate API call
    setTimeout(() => {
      if (accessCode === "TEST1234") {
        window.location.href = "/";
      } else {
        setError("Invalid access code. Please check your email and try again.");
        setIsVerifying(false);
      }
    }, 1500);
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    // Simulate API call to resend code
    setError("");
    alert("Access code has been resent to your email");
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden flex items-center justify-center p-4">
      <div className="scan-line"></div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent"></div>

      <Card className="w-full max-w-md bg-card/90 border-primary/30 neon-card backdrop-blur-xl relative z-10">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
              <Shield className="w-10 h-10 text-primary neon-glow" />
            </div>
            <h1 className="text-3xl font-bold text-primary neon-text mb-2">
              Secure Access Required
            </h1>
            <p className="text-muted-foreground">
              FANZ is a private platform. Enter your access code to continue.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-primary mb-1">How to get access:</p>
                <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Complete profile verification</li>
                  <li>Upload profile photo and ID</li>
                  <li>Pass age verification (18+)</li>
                  <li>Await moderation approval</li>
                  <li>Receive access code via email</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Access Code Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Access Code
              </label>
              <Input
                type="text"
                placeholder="Enter your 8-character code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="bg-input border-border text-lg font-mono tracking-wider text-center"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Check your email for the access code sent after approval
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="gradient"
              className="w-full neon-glow text-lg py-6"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Enter Platform
                </>
              )}
            </Button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive your code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResendCode}
              className="text-primary hover:text-primary/80"
            >
              Resend Access Code
            </Button>
          </div>

          {/* New User CTA */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-center text-sm text-muted-foreground mb-4">
              New to FANZ?
            </p>
            <Button
              variant="neon-outline"
              className="w-full"
              onClick={() => window.location.href = "/verification-signup"}
            >
              Start Verification Process
            </Button>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Protected by VerifyMy Age Verification</span>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        <p>© 2025 FANZ. All rights reserved. | 18+ Only | Private Platform</p>
      </div>
    </div>
  );
}
