import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowLeft, Home } from "lucide-react";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();

  // Get transaction ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get("id");

  useEffect(() => {
    // Could fetch transaction details here if needed
    console.log("Payment successful for transaction:", transactionId);
  }, [transactionId]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <Card className="bg-slate border-gray-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white" data-testid="text-payment-success-title">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-gray-300">
            <p className="mb-2">Your payment has been processed successfully.</p>
            {transactionId && (
              <p className="text-sm text-gray-400" data-testid="text-transaction-id">
                Transaction ID: {transactionId}
              </p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Your account will be updated within a few minutes</li>
              <li>• You'll receive a confirmation email shortly</li>
              <li>• Access to content will be activated immediately</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              data-testid="button-back-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full border-gray-600 hover:bg-gray-700 text-white"
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