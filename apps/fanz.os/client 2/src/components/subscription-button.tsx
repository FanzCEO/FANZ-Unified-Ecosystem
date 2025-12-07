import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import PaymentSelector from "./payment-selector";
import { Heart, Check } from "lucide-react";

interface SubscriptionButtonProps {
  creatorId: string;
  price: number;
  isSubscribed?: boolean;
}

export default function SubscriptionButton({ creatorId, price, isSubscribed }: SubscriptionButtonProps) {
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  // Check if user is already subscribed
  const { data: subscriptionCheck } = useQuery({
    queryKey: ["/api/subscriptions/check", creatorId],
  });

  const actuallySubscribed = isSubscribed || subscriptionCheck?.isSubscribed;

  const handleSubscribe = () => {
    setShowPaymentSelector(true);
  };

  if (actuallySubscribed) {
    return (
      <Button 
        variant="outline"
        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
        data-testid="button-subscribed"
      >
        <Check className="w-4 h-4 mr-2" />
        Subscribed
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleSubscribe}
        className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
        data-testid="button-subscribe"
      >
        <Heart className="w-4 h-4 mr-2" />
        Subscribe ${price.toFixed(2)}/month
      </Button>

      <PaymentSelector
        isOpen={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        paymentType="subscription"
        amount={price}
        currency="USD"
        creatorId={creatorId}
        description={`Monthly subscription for $${price.toFixed(2)}`}
      />
    </>
  );
}
