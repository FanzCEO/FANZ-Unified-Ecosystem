import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export default function AgeVerification({ onVerified }: AgeVerificationProps) {
  const handleEnterSite = () => {
    localStorage.setItem('ageVerified', 'true');
    onVerified();
  };

  const handleExitSite = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <Card className="bg-slate border-gray-700 max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              FansLab
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded mx-auto"></div>
          </div>
          <CardTitle className="text-xl font-semibold text-white" data-testid="text-age-verification-title">
            Age Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">
            <AlertTriangle className="w-12 h-12 text-accent" />
          </div>
          <p className="text-gray-300" data-testid="text-age-verification-description">
            You must be 18 years or older to access this platform. This site contains adult content.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleEnterSite}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-purple-600 hover:to-pink-600 transition-all"
              data-testid="button-enter-site"
            >
              I am 18+ - Enter Site
            </Button>
            <Button 
              onClick={handleExitSite}
              variant="secondary"
              className="w-full bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              data-testid="button-exit-site"
            >
              I am under 18 - Exit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
