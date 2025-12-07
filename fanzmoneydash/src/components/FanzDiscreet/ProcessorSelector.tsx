/**
 * Payment Processor Selector
 * Choose from 20+ payment processors
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Wallet,
  Bitcoin,
  DollarSign,
  Globe,
  Shield,
  Zap,
  Award,
  Info,
  CheckCircle,
  Filter,
} from 'lucide-react';
import {
  PAYMENT_PROCESSORS,
  PaymentProcessor,
  PaymentMethod,
  getProcessorsByMethod,
  getAdultFriendlyProcessors,
  getDiscreetProcessors,
  calculateFees,
  recommendProcessor,
} from '../../services/paymentProcessors';

interface ProcessorSelectorProps {
  amount_cents: number;
  currency: string;
  region?: string;
  onSelect: (processor: PaymentProcessor) => void;
  onClose: () => void;
}

const PAYMENT_METHOD_ICONS: Record<PaymentMethod, any> = {
  credit_card: CreditCard,
  debit_card: CreditCard,
  crypto: Bitcoin,
  wallet: Wallet,
  bank_transfer: DollarSign,
  buy_now_pay_later: Award,
};

const ProcessorSelector: React.FC<ProcessorSelectorProps> = ({
  amount_cents,
  currency,
  region,
  onSelect,
  onClose,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | 'all'>('all');
  const [showAdultOnly, setShowAdultOnly] = useState(true);
  const [showDiscreetOnly, setShowDiscreetOnly] = useState(true);
  const [selectedProcessor, setSelectedProcessor] = useState<PaymentProcessor | null>(null);

  // Get recommended processor
  const recommendedProcessor = useMemo(() => {
    return recommendProcessor({
      amount_cents,
      currency,
      region,
      require_discreet: showDiscreetOnly,
      require_instant: false,
    });
  }, [amount_cents, currency, region, showDiscreetOnly]);

  // Filter processors
  const filteredProcessors = useMemo(() => {
    let processors = PAYMENT_PROCESSORS.filter(p => p.enabled);

    if (showAdultOnly) {
      processors = processors.filter(p => p.features.adult_friendly);
    }

    if (showDiscreetOnly) {
      processors = processors.filter(p => p.discreet_billing.enabled);
    }

    if (selectedMethod !== 'all') {
      processors = processors.filter(p => p.supportedMethods.includes(selectedMethod));
    }

    // Filter by currency
    processors = processors.filter(p => p.supportedCurrencies.includes(currency));

    // Filter by amount limits
    processors = processors.filter(p =>
      amount_cents >= p.limits.min_transaction_cents &&
      amount_cents <= p.limits.max_transaction_cents
    );

    // Filter by region
    if (region) {
      processors = processors.filter(p =>
        p.region.includes(region) || p.region.includes('WORLDWIDE')
      );
    }

    return processors.sort((a, b) => a.priority - b.priority);
  }, [selectedMethod, showAdultOnly, showDiscreetOnly, currency, amount_cents, region]);

  // Get unique payment methods from filtered processors
  const availableMethods = useMemo(() => {
    const methods = new Set<PaymentMethod>();
    filteredProcessors.forEach(p => {
      p.supportedMethods.forEach(m => methods.add(m));
    });
    return Array.from(methods);
  }, [filteredProcessors]);

  const handleConfirm = () => {
    if (selectedProcessor) {
      onSelect(selectedProcessor);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl border border-white/10 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">Choose Payment Method</h2>
                <p className="text-gray-400 text-sm">
                  Loading ${(amount_cents / 100).toFixed(2)} {currency}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Recommended Processor Alert */}
            {recommendedProcessor && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 flex items-center space-x-3"
              >
                <Award className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-semibold">Recommended</p>
                  <p className="text-sm text-gray-300">
                    {recommendedProcessor.displayName} - Best rates and instant processing
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProcessor(recommendedProcessor)}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white font-semibold transition-colors"
                >
                  Select
                </button>
              </motion.div>
            )}
          </div>

          {/* Filters */}
          <div className="bg-black/20 border-b border-white/10 p-4">
            <div className="flex flex-wrap gap-3">
              {/* Payment Method Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod | 'all')}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Methods</option>
                  {availableMethods.map(method => (
                    <option key={method} value={method}>
                      {method.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adult-Friendly Filter */}
              <label className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                <input
                  type="checkbox"
                  checked={showAdultOnly}
                  onChange={(e) => setShowAdultOnly(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-white">Adult-Friendly Only</span>
              </label>

              {/* Discreet Billing Filter */}
              <label className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors">
                <input
                  type="checkbox"
                  checked={showDiscreetOnly}
                  onChange={(e) => setShowDiscreetOnly(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-white">Discreet Billing Only</span>
              </label>

              <div className="ml-auto text-sm text-gray-400">
                {filteredProcessors.length} processors available
              </div>
            </div>
          </div>

          {/* Processor Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredProcessors.length === 0 ? (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No payment processors match your filters</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filter settings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProcessors.map((processor) => {
                  const fees = calculateFees(processor, amount_cents);
                  const isSelected = selectedProcessor?.id === processor.id;
                  const isRecommended = recommendedProcessor?.id === processor.id;

                  return (
                    <motion.div
                      key={processor.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProcessor(processor)}
                      className={`relative cursor-pointer rounded-2xl p-5 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>Best</span>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute -top-2 -left-2">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      )}

                      {/* Processor Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{processor.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">{processor.displayName}</h3>
                          <p className="text-xs text-gray-400">{processor.name}</p>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-4">
                        {processor.features.instant && (
                          <div className="flex items-center space-x-2 text-xs">
                            <Zap className="w-3 h-3 text-yellow-400" />
                            <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                              Instant Processing
                            </span>
                          </div>
                        )}
                        {processor.discreet_billing.enabled && (
                          <div className="flex items-center space-x-2 text-xs">
                            <Shield className="w-3 h-3 text-purple-400" />
                            <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                              Discreet Billing
                            </span>
                          </div>
                        )}
                        {processor.features.chargeback_protection && (
                          <div className="flex items-center space-x-2 text-xs">
                            <Shield className="w-3 h-3 text-green-400" />
                            <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                              Chargeback Protection
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Fees */}
                      <div className="bg-black/20 rounded-lg p-3 mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isSelected ? 'text-white/80' : 'text-gray-400'}>
                            Fee
                          </span>
                          <span className={isSelected ? 'text-white' : 'text-gray-300'}>
                            ${(fees.fees_cents / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={isSelected ? 'text-white/80' : 'text-gray-400'}>
                            You receive
                          </span>
                          <span className={isSelected ? 'text-white font-bold' : 'text-white'}>
                            ${(fees.net_amount_cents / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Descriptor Preview */}
                      {processor.discreet_billing.enabled && (
                        <div className="text-xs">
                          <p className={isSelected ? 'text-white/60' : 'text-gray-500'}>
                            Appears as:
                          </p>
                          <p className={isSelected ? 'text-white' : 'text-purple-400'}>
                            "{processor.discreet_billing.descriptor}"
                          </p>
                        </div>
                      )}

                      {/* Payment Methods */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {processor.supportedMethods.slice(0, 3).map(method => {
                          const Icon = PAYMENT_METHOD_ICONS[method];
                          return (
                            <div
                              key={method}
                              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                                isSelected ? 'bg-white/20' : 'bg-white/10'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              <span className="capitalize">{method.split('_')[0]}</span>
                            </div>
                          );
                        })}
                        {processor.supportedMethods.length > 3 && (
                          <div className={`px-2 py-1 rounded text-xs ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                            +{processor.supportedMethods.length - 3}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedProcessor && (
            <div className="bg-black/30 backdrop-blur-xl border-t border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Selected Processor</p>
                  <p className="text-white font-bold text-lg">{selectedProcessor.displayName}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-shadow"
                  >
                    Continue with {selectedProcessor.displayName}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessorSelector;
