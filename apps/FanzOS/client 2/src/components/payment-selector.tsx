import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Bitcoin, 
  DollarSign, 
  ShoppingCart,
  Heart,
  Crown,
  Wallet,
  Check
} from "lucide-react";

interface PaymentProcessor {
  id: string;
  name: string;
  type: "card" | "crypto" | "bank";
  currencies: string[];
  recommended: string[];
}

interface PaymentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: "subscription" | "tip" | "ppv" | "merchandise";
  amount: number;
  currency?: string;
  creatorId?: string;
  description: string;
}

const paymentTypeIcons = {
  subscription: Crown,
  tip: Heart,
  ppv: ShoppingCart,
  merchandise: DollarSign,
};

const paymentTypeNames = {
  subscription: "Subscription",
  tip: "Tip",
  ppv: "Pay-Per-View",
  merchandise: "Merchandise",
};

const processorIcons = {
  card: CreditCard,
  crypto: Bitcoin,
  bank: Wallet,
};

export default function PaymentSelector({
  isOpen,
  onClose,
  paymentType,
  amount,
  currency = "USD",
  creatorId,
  description,
}: PaymentSelectorProps) {
  const { toast } = useToast();
  const [selectedProcessor, setSelectedProcessor] = useState<string | null>(null);

  // Fetch available payment processors
  const { data: processorsData, isLoading } = useQuery<{processors: PaymentProcessor[]}>({
    queryKey: ["/api/payments/processors"],
    enabled: isOpen,
  });

  const processors = processorsData?.processors || [];
  
  // Filter processors based on payment type and currency
  const availableProcessors = processors.filter((processor: PaymentProcessor) => 
    processor.currencies.includes(currency) &&
    (processor.recommended.includes(paymentType) || processor.recommended.length === 0)
  );

  const paymentMutation = useMutation({
    mutationFn: async (processorId: string) => {
      const response = await apiRequest("POST", "/api/payments/initiate", {
        processor: processorId,
        type: paymentType,
        amount,
        currency,
        creatorId,
        description,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        toast({
          title: "Redirecting to Payment",
          description: `Redirecting to ${data.processor} to complete your payment`,
        });
        
        // Redirect to payment processor
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || "Payment initiation failed");
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Payment Failed",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProcessorSelect = (processorId: string) => {
    setSelectedProcessor(processorId);
  };

  const handlePayment = () => {
    if (selectedProcessor) {
      paymentMutation.mutate(selectedProcessor);
    }
  };

  // Auto-select recommended processor if only one available
  useEffect(() => {
    if (availableProcessors.length === 1) {
      setSelectedProcessor(availableProcessors[0].id);
    }
  }, [availableProcessors]);

  const PaymentIcon = paymentTypeIcons[paymentType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold mb-4" data-testid="text-payment-title">
            <PaymentIcon className="w-6 h-6 mx-auto mb-2 text-primary" />
            Complete {paymentTypeNames[paymentType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">{description}</span>
              <span className="text-xl font-bold text-primary" data-testid="text-payment-amount">
                ${amount.toFixed(2)} {currency}
              </span>
            </div>
          </div>

          {/* Payment Processors */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Choose Payment Method</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : availableProcessors.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                No payment methods available for this transaction
              </div>
            ) : (
              availableProcessors.map((processor: PaymentProcessor) => {
                const ProcessorIcon = processorIcons[processor.type];
                const isSelected = selectedProcessor === processor.id;
                const isRecommended = processor.recommended.includes(paymentType);
                
                return (
                  <div
                    key={processor.id}
                    className={`
                      cursor-pointer rounded-lg border p-4 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-gray-600 hover:border-gray-500'
                      }
                    `}
                    onClick={() => handleProcessorSelect(processor.id)}
                    data-testid={`processor-option-${processor.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <ProcessorIcon className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-semibold text-white flex items-center space-x-2">
                            <span>{processor.name}</span>
                            {isRecommended && (
                              <Badge variant="secondary" className="text-xs bg-accent text-black">
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {processor.type} payment
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Security Notice */}
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure payment processing with industry-standard encryption</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 hover:bg-gray-700"
              data-testid="button-payment-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={!selectedProcessor || paymentMutation.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              data-testid="button-payment-proceed"
            >
              {paymentMutation.isPending ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}