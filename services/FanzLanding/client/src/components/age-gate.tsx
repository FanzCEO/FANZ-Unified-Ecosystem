import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AgeGateProps {
  onEnter: () => void;
}

export default function AgeGate({ onEnter }: AgeGateProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = () => {
    setIsExiting(true);
    // In a real app, this would redirect to an appropriate exit page
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
        <h1
          className="text-4xl font-black mb-6 gradient-text floating-animation"
          data-testid="tagline-text"
        >
          Welcome to FANZ You Must Be 18+ year old to enter
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Welcome to FANZ Unlimited Network - Your gateway to exclusive creator
          communities
        </p>
        <div className="text-xs text-muted-foreground mb-4">
          ⚠️ This platform contains adult content | AES-256 Military Encryption
          | 2257 COMPLIANT
        </div>
        <div className="space-y-4">
          <Button
            onClick={onEnter}
            className="w-full bg-gradient-to-r from-primary to-fun-pink hover:from-fun-purple hover:to-fun-pink text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 glow-effect"
            data-testid="button-enter-funverse"
          >
            Yes, I am 18+ - Enter Platform Portal
          </Button>
          <Button
            onClick={handleExit}
            variant="secondary"
            className="w-full py-3 px-6 rounded-lg"
            disabled={isExiting}
            data-testid="button-exit"
          >
            {isExiting ? "Redirecting..." : "Exit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
