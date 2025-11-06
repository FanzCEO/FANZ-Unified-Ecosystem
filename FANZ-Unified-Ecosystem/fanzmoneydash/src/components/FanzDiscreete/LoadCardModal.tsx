/**
 * LoadCardModal Component
 * CCBill FlexForms integration for loading funds onto FanzDiscreete cards
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, CreditCard, Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { discreteAPI } from '../../services/discreteAPI';

interface LoadCardModalProps {
  card: {
    card_id: string;
    card_display_name: string;
    balance_cents: number;
    available_balance_cents: number;
  };
  onClose: () => void;
  onComplete: () => void;
}

const PRESET_AMOUNTS = [
  { value: 2500, label: '$25' },
  { value: 5000, label: '$50' },
  { value: 10000, label: '$100' },
  { value: 20000, label: '$200' },
  { value: 50000, label: '$500' },
];

type LoadStatus = 'selecting' | 'processing' | 'success' | 'error';

const LoadCardModal: React.FC<LoadCardModalProps> = ({ card, onClose, onComplete }) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('selecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [ccbillConfig, setCCBillConfig] = useState<any>(null);
  const [descriptor, setDescriptor] = useState<string>('GH Digital Services');

  useEffect(() => {
    loadCCBillConfig();
  }, []);

  useEffect(() => {
    // Load CCBill FlexForms script
    const script = document.createElement('script');
    script.src = 'https://api.ccbill.com/wap-frontflex/flexforms/client-javascript.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Script may already be removed
      }
    };
  }, []);

  const loadCCBillConfig = async () => {
    try {
      const config = await discreteAPI.getCCBillConfig();
      setCCBillConfig(config);
      setDescriptor(config.descriptor || 'GH Digital Services');
    } catch (error) {
      console.error('Failed to load CCBill config:', error);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setShowCustomInput(false);
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

  const handleLoadCard = async () => {
    if (selectedAmount < 1000) {
      setErrorMessage('Minimum load amount is $10.00');
      return;
    }

    if (selectedAmount > 500000) {
      setErrorMessage('Maximum load amount is $5,000.00');
      return;
    }

    setLoadStatus('processing');
    setErrorMessage('');

    try {
      // Initialize CCBill FlexForms
      if (window.CCBillFlexForms && ccbillConfig) {
        window.CCBillFlexForms.createFlexForm({
          clientAccnum: ccbillConfig.clientAccnum,
          clientSubacc: ccbillConfig.clientSubacc,
          formName: ccbillConfig.formName,
          flexId: ccbillConfig.flexId,
          currency: 'USD',
          initialPrice: (selectedAmount / 100).toFixed(2),
          initialPeriod: 2, // Days (for verification)
          numRebills: 0,
          allowedTypes: 'credit_debit',
          skipLanding: true,
          onSuccess: handleCCBillSuccess,
          onError: handleCCBillError,
        });
      } else {
        throw new Error('CCBill FlexForms not loaded');
      }
    } catch (error: any) {
      setLoadStatus('error');
      setErrorMessage(error.message || 'Failed to initialize payment. Please try again.');
    }
  };

  const handleCCBillSuccess = async (response: any) => {
    try {
      // Process the successful payment
      await discreteAPI.loadCard(
        card.card_id,
        selectedAmount,
        response.subscriptionId || response.transactionId
      );

      setLoadStatus('success');

      // Close modal and refresh after 2 seconds
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      setLoadStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleCCBillError = (error: any) => {
    setLoadStatus('error');
    setErrorMessage(
      error.message ||
      'Payment processing failed. Please check your card details and try again.'
    );
  };

  const handleClose = () => {
    if (loadStatus !== 'processing') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
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
          <div className="sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Load Card</h2>
                <p className="text-sm text-gray-400">{card.card_display_name}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              disabled={loadStatus === 'processing'}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="p-6">
            {loadStatus === 'selecting' && (
              <>
                {/* Current Balance */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                      <h3 className="text-3xl font-bold text-white">
                        ${(card.balance_cents / 100).toFixed(2)}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">Available</p>
                      <h3 className="text-2xl font-bold text-green-400">
                        ${(card.available_balance_cents / 100).toFixed(2)}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3">Select Amount</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {PRESET_AMOUNTS.map((preset) => (
                      <motion.button
                        key={preset.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAmountSelect(preset.value)}
                        className={`p-4 rounded-xl font-semibold text-lg transition-all ${
                          selectedAmount === preset.value && !showCustomInput
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50'
                            : 'bg-white/10 hover:bg-white/20 border border-white/20'
                        }`}
                      >
                        {preset.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowCustomInput(!showCustomInput)}
                    className={`w-full p-4 rounded-xl font-semibold transition-all ${
                      showCustomInput
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    Custom Amount
                  </motion.button>

                  <AnimatePresence>
                    {showCustomInput && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                            placeholder="Enter amount"
                            min="10"
                            max="5000"
                            step="0.01"
                            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Min: $10.00 | Max: $5,000.00
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Descriptor Preview */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-2">100% Discreet Billing</h4>
                      <p className="text-gray-300 text-sm mb-3">
                        This charge will appear on your credit card statement as:
                      </p>
                      <div className="bg-black/40 rounded-lg px-4 py-3 font-mono text-purple-300 text-sm">
                        {descriptor} - ${(selectedAmount / 100).toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Zero mention of Fanz or adult content anywhere on your billing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{errorMessage}</p>
                  </motion.div>
                )}

                {/* Load Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoadCard}
                  disabled={!selectedAmount || selectedAmount < 1000}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Load ${(selectedAmount / 100).toFixed(2)} via CCBill
                </motion.button>

                {/* Security Notice */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-400">
                    Secured by CCBill • PCI-DSS Level 1 Certified
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Processed by Grp Hldings LLC
                  </p>
                </div>
              </>
            )}

            {loadStatus === 'processing' && (
              <div className="py-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
                />
                <h3 className="text-2xl font-bold text-white mb-2">Processing Payment...</h3>
                <p className="text-gray-400">
                  Please wait while we securely process your transaction with CCBill.
                </p>
                <div className="mt-6 bg-white/5 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-300">
                    Amount: <span className="font-semibold text-white">${(selectedAmount / 100).toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Descriptor: <span className="font-mono text-purple-300">{descriptor}</span>
                  </p>
                </div>
              </div>
            )}

            {loadStatus === 'success' && (
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
                <h3 className="text-3xl font-bold text-white mb-2">Card Loaded Successfully!</h3>
                <p className="text-gray-400 mb-6">
                  ${(selectedAmount / 100).toFixed(2)} has been added to your FanzDiscreete card.
                </p>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30 max-w-md mx-auto">
                  <p className="text-gray-300 text-sm mb-2">New Balance</p>
                  <h4 className="text-4xl font-bold text-green-400">
                    ${((card.balance_cents + selectedAmount) / 100).toFixed(2)}
                  </h4>
                </div>
              </motion.div>
            )}

            {loadStatus === 'error' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-12 text-center"
              >
                <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-2">Payment Failed</h3>
                <p className="text-gray-400 mb-6">{errorMessage}</p>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setLoadStatus('selecting');
                      setErrorMessage('');
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-xl font-semibold"
                  >
                    Try Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="w-full bg-white/10 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                  >
                    Close
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadCardModal;

// Extend Window interface for CCBill FlexForms
declare global {
  interface Window {
    CCBillFlexForms?: any;
  }
}
