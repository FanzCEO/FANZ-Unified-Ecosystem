/**
 * GiftCardPurchase Component
 * Interface for purchasing and sending FanzDiscreet gift cards
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gift,
  Mail,
  MessageSquare,
  DollarSign,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  Sparkles,
  Heart,
  Shield,
} from 'lucide-react';
import { discreetAPI } from '../../services/discreetAPI';

interface GiftCardPurchaseProps {
  onClose: () => void;
  onComplete: () => void;
}

const PRESET_AMOUNTS = [
  { value: 2500, label: '$25', popular: false },
  { value: 5000, label: '$50', popular: true },
  { value: 10000, label: '$100', popular: false },
  { value: 15000, label: '$150', popular: false },
  { value: 20000, label: '$200', popular: false },
  { value: 50000, label: '$500', popular: false },
];

const GIFT_TEMPLATES = [
  {
    id: 'birthday',
    title: 'Birthday Gift',
    message: 'Happy Birthday! Enjoy this gift to explore your favorite content. 🎂',
    emoji: '🎂',
  },
  {
    id: 'thanks',
    title: 'Thank You',
    message: 'Thank you so much! Here\'s a little something to show my appreciation. 💝',
    emoji: '💝',
  },
  {
    id: 'surprise',
    title: 'Just Because',
    message: 'Surprise! Treat yourself to something special. ✨',
    emoji: '✨',
  },
  {
    id: 'holiday',
    title: 'Holiday Gift',
    message: 'Happy Holidays! Wishing you joy and great content. 🎄',
    emoji: '🎄',
  },
  {
    id: 'custom',
    title: 'Custom Message',
    message: '',
    emoji: '💌',
  },
];

type PurchaseStep = 'amount' | 'recipient' | 'message' | 'preview' | 'payment' | 'success';

const GiftCardPurchase: React.FC<GiftCardPurchaseProps> = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [giftMessage, setGiftMessage] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomAmount(value);
      setSelectedAmount(Math.round(numValue * 100));
    } else {
      setCustomAmount(value);
    }
  };

  const handleTemplateSelect = (template: typeof GIFT_TEMPLATES[0]) => {
    setSelectedTemplate(template.id);
    if (template.id !== 'custom') {
      setGiftMessage(template.message);
    } else {
      setGiftMessage('');
    }
  };

  const handleNextStep = () => {
    setError('');

    if (currentStep === 'amount') {
      if (selectedAmount < 1000) {
        setError('Minimum gift card amount is $10.00');
        return;
      }
      if (selectedAmount > 500000) {
        setError('Maximum gift card amount is $5,000.00');
        return;
      }
      setCurrentStep('recipient');
    } else if (currentStep === 'recipient') {
      if (!recipientEmail || !recipientEmail.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      setCurrentStep('message');
    } else if (currentStep === 'message') {
      if (!giftMessage.trim()) {
        setError('Please add a gift message');
        return;
      }
      setCurrentStep('preview');
    } else if (currentStep === 'preview') {
      setCurrentStep('payment');
      handlePurchase();
    }
  };

  const handlePurchase = async () => {
    setProcessing(true);
    setError('');

    try {
      // In production, this would integrate with CCBill FlexForms
      // For now, simulate API call
      await discreetAPI.purchaseGiftCard({
        amountCents: selectedAmount,
        recipientEmail,
        giftMessage,
        ccbillToken: 'mock_token_' + Date.now(),
      });

      setCurrentStep('success');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to purchase gift card');
      setCurrentStep('preview');
    } finally {
      setProcessing(false);
    }
  };

  const getStepProgress = () => {
    const steps = ['amount', 'recipient', 'message', 'preview', 'payment'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Send Gift Card</h2>
                  <p className="text-sm text-gray-400">Spread the love, discreetly</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                disabled={processing}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Progress Bar */}
            {currentStep !== 'success' && (
              <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getStepProgress()}%` }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Step 1: Amount Selection */}
            {currentStep === 'amount' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Choose Gift Amount</h3>
                  <p className="text-gray-400 text-sm">Select a preset amount or enter a custom value</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {PRESET_AMOUNTS.map((preset) => (
                    <motion.button
                      key={preset.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAmountSelect(preset.value)}
                      className={`relative p-6 rounded-xl font-semibold text-lg transition-all ${
                        selectedAmount === preset.value && !customAmount
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                          : 'bg-white/10 hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      {preset.popular && (
                        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                          Popular
                        </div>
                      )}
                      {preset.label}
                    </motion.button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-white font-semibold mb-2">Custom Amount</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      placeholder="Enter custom amount"
                      min="10"
                      max="5000"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Min: $10.00 | Max: $5,000.00</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Recipient Info */}
            {currentStep === 'recipient' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Recipient Information</h3>
                  <p className="text-gray-400 text-sm">Who are you sending this gift to?</p>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Recipient Email *</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Recipient Name <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Your Name <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Jane Smith"
                    disabled={anonymous}
                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  />
                  <label className="flex items-center space-x-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/10 border-white/20"
                    />
                    <span className="text-sm text-gray-400">Send anonymously</span>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 3: Gift Message */}
            {currentStep === 'message' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Add a Personal Message</h3>
                  <p className="text-gray-400 text-sm">Choose a template or write your own</p>
                </div>

                {/* Message Templates */}
                <div className="grid grid-cols-2 gap-3">
                  {GIFT_TEMPLATES.map((template) => (
                    <motion.button
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedTemplate === template.id
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-2">{template.emoji}</div>
                      <div className="text-sm font-semibold">{template.title}</div>
                    </motion.button>
                  ))}
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-white font-semibold mb-2">Your Message</label>
                  <div className="relative">
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Write your gift message here..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {giftMessage.length}/500
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Preview Your Gift</h3>
                  <p className="text-gray-400 text-sm">Review before purchasing</p>
                </div>

                {/* Gift Card Preview */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <Gift className="w-12 h-12" />
                      <Sparkles className="w-8 h-8" />
                    </div>

                    <h3 className="text-3xl font-bold mb-2">FanzDiscreet Gift Card</h3>
                    <div className="text-5xl font-bold mb-6">${(selectedAmount / 100).toFixed(2)}</div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                      <p className="text-sm mb-1">To: {recipientName || recipientEmail}</p>
                      <p className="text-sm">From: {anonymous ? 'Anonymous' : senderName || 'A Friend'}</p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-sm italic">{giftMessage}</p>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-4">Order Summary</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Gift Amount</span>
                      <span className="text-white font-semibold">${(selectedAmount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Processing Fee</span>
                      <span className="text-white font-semibold">$0.00</span>
                    </div>
                    <div className="border-t border-white/10 pt-3 flex justify-between">
                      <span className="text-white font-bold">Total</span>
                      <span className="text-white font-bold text-lg">${(selectedAmount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-300">
                      Charges appear as "GH Gift Purchase" on statements
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Processing */}
            {currentStep === 'payment' && (
              <div className="py-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6"
                />
                <h3 className="text-2xl font-bold text-white mb-2">Processing Your Gift...</h3>
                <p className="text-gray-400">Please wait while we prepare your gift card</p>
              </div>
            )}

            {/* Step 6: Success */}
            {currentStep === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-3xl font-bold text-white mb-2">Gift Card Sent!</h3>
                <p className="text-gray-400 mb-8">
                  Your gift card has been sent to <span className="text-green-400">{recipientEmail}</span>
                </p>

                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30 max-w-md mx-auto mb-6">
                  <Gift className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-sm">
                    The recipient will receive an email with instructions to redeem their ${(selectedAmount / 100).toFixed(2)} gift card.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transition-shadow"
                >
                  Done
                </motion.button>
              </motion.div>
            )}

            {/* Error Message */}
            {error && currentStep !== 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Action Buttons */}
            {currentStep !== 'payment' && currentStep !== 'success' && (
              <div className="flex space-x-3 mt-6">
                {currentStep !== 'amount' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const steps: PurchaseStep[] = ['amount', 'recipient', 'message', 'preview'];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex > 0) {
                        setCurrentStep(steps[currentIndex - 1]);
                      }
                    }}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-4 rounded-xl font-semibold transition-colors"
                  >
                    Back
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextStep}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-4 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transition-shadow"
                >
                  {currentStep === 'preview' ? (
                    <>
                      <Send className="w-5 h-5 inline-block mr-2" />
                      Purchase & Send
                    </>
                  ) : (
                    'Continue'
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GiftCardPurchase;
