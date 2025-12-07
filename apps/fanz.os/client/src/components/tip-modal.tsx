import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PaymentSelector from "./payment-selector";
import { DollarSign } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export default function TipModal({ isOpen, onClose, recipientId, recipientName }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  const tipAmounts = [5, 10, 25, 50, 100];

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount("");
    setMessage("");
    setShowCustom(false);
    onClose();
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustom(false);
    setCustomAmount("");
  };

  const handleCustomClick = () => {
    setShowCustom(true);
    setSelectedAmount(null);
  };

  const handleSendTip = () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount <= 0) {
      return;
    }

    setShowPaymentSelector(true);
  };

  const getCurrentTipAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const getTipDescription = () => {
    const amount = getCurrentTipAmount();
    const baseDescription = `Tip $${amount.toFixed(2)} to ${recipientName}`;
    return message ? `${baseDescription} - ${message}` : baseDescription;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-2" data-testid="text-tip-modal-title">
            Send a Tip
          </DialogTitle>
          <p className="text-center text-gray-400" data-testid="text-tip-modal-description">
            Show your appreciation to {recipientName}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tip Amount Selection */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Select Amount</Label>
            <div className="grid grid-cols-3 gap-3">
              {tipAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={selectedAmount === amount ? "default" : "outline"}
                  onClick={() => handleAmountSelect(amount)}
                  className={`py-3 font-semibold transition-all ${
                    selectedAmount === amount
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 border-gray-600 hover:bg-primary hover:text-white'
                  }`}
                  data-testid={`button-tip-amount-${amount}`}
                >
                  ${amount}
                </Button>
              ))}
              <Button
                variant={showCustom ? "default" : "outline"}
                onClick={handleCustomClick}
                className={`py-3 font-semibold transition-all ${
                  showCustom
                    ? 'bg-primary text-white'
                    : 'bg-gray-800 border-gray-600 hover:bg-primary hover:text-white'
                }`}
                data-testid="button-tip-custom"
              >
                Custom
              </Button>
            </div>
          </div>

          {/* Custom Amount Input */}
          {showCustom && (
            <div>
              <Label htmlFor="custom-amount" className="text-sm font-semibold mb-2 block">
                Custom Amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="custom-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="bg-gray-800 border-gray-600 pl-10 text-white"
                  data-testid="input-custom-tip-amount"
                />
              </div>
            </div>
          )}
          
          {/* Message */}
          <div>
            <Label htmlFor="tip-message" className="text-sm font-semibold mb-2 block">
              Add a message (optional)
            </Label>
            <Textarea
              id="tip-message"
              placeholder="Say something nice..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white resize-none"
              rows={3}
              data-testid="textarea-tip-message"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-600 hover:bg-gray-700"
              data-testid="button-tip-cancel"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendTip}
              disabled={!selectedAmount && !parseFloat(customAmount)}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
              data-testid="button-tip-send"
            >
              Send Tip
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <PaymentSelector
        isOpen={showPaymentSelector}
        onClose={() => {
          setShowPaymentSelector(false);
          handleClose(); // Close tip modal after payment is initiated
        }}
        paymentType="tip"
        amount={getCurrentTipAmount()}
        currency="USD"
        creatorId={recipientId}
        description={getTipDescription()}
      />
    </Dialog>
  );
}
