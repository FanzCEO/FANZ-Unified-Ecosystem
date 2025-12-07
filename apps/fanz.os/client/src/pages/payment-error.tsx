import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Home, RotateCcw, MessageCircle } from "lucide-react";

export default function PaymentError() {
  const [, navigate] = useLocation();

  // Get error details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get("message") || "An unexpected error occurred during payment processing.";

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Card className="bg-slate border-gray-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white" data-testid="text-payment-error-title">
            Payment Failed
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-300">
            <p className="mb-2">We encountered an issue processing your payment.</p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-4">
              <p className="text-sm text-red-400" data-testid="text-error-message">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">What you can do:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Verify your payment method information</li>
              <li>• Check your internet connection</li>
              <li>• Try a different payment processor</li>
              <li>• Wait a few minutes and try again</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.history.back()}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              data-testid="button-try-again"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              onClick={() => navigate("/support")}
              variant="outline"
              className="w-full border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white"
              data-testid="button-contact-support"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full border-gray-600 hover:bg-gray-700 text-white"
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <Button 
              variant="ghost"
              onClick={() => window.history.back()}
              className="w-full text-gray-400 hover:text-white"
              data-testid="button-back-previous"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}