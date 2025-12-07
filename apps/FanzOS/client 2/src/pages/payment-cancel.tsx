import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, Home, RotateCcw } from "lucide-react";

export default function PaymentCancel() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Card className="bg-slate border-gray-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="w-16 h-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white" data-testid="text-payment-cancel-title">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-300">
            <p className="mb-2">Your payment was cancelled and no charges were made.</p>
            <p className="text-sm text-gray-400">
              Don't worry, you can try again anytime.
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">Need help?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Check your payment method details</li>
              <li>• Try a different payment processor</li>
              <li>• Contact support if you continue having issues</li>
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