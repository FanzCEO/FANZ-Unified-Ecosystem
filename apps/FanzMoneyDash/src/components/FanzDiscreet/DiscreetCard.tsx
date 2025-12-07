/**
 * FanzDiscreet Card Component
 * 3D animated virtual card display
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';

interface DiscreetCardProps {
  card: {
    card_id: string;
    card_display_name: string;
    card_type: string;
    balance_cents: number;
    available_balance_cents: number;
    status: string;
    vault_mode_enabled: boolean;
    created_at: string;
  };
  onVaultToggle?: () => void;
}

const DiscreetCard: React.FC<DiscreetCardProps> = ({ card, onVaultToggle }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const formatCardNumber = (cardId: string) => {
    const last4 = cardId.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const formatBalance = (cents: number) => {
    if (!showBalance) return '••••';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const cardGradients = {
    prepaid: 'from-blue-600 via-purple-600 to-pink-600',
    reloadable: 'from-purple-600 via-pink-600 to-red-600',
    gift: 'from-green-600 via-emerald-600 to-teal-600'
  };

  const gradient = cardGradients[card.card_type as keyof typeof cardGradients] || cardGradients.reloadable;

  return (
    <div className="perspective-1000 w-full">
      <motion.div
        className="relative w-full aspect-[1.586/1] cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        whileHover={{ scale: 1.02 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front of Card */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className={`relative h-full bg-gradient-to-br ${gradient} rounded-3xl p-8 overflow-hidden shadow-2xl`}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>

            {/* Card Content */}
            <div className="relative h-full flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-6 h-6 text-white/90" />
                    <span className="text-white/90 font-semibold text-sm tracking-wider">
                      FANZDISCREETE
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {card.vault_mode_enabled && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span className="text-xs font-medium">Vault</span>
                      </motion.div>
                    )}
                    <span className="text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full capitalize">
                      {card.card_type}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBalance(!showBalance);
                  }}
                  className="bg-white/10 backdrop-blur-sm p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  {showBalance ? (
                    <Eye className="w-5 h-5" />
                  ) : (
                    <EyeOff className="w-5 h-5" />
                  )}
                </motion.button>
              </div>

              {/* Card Number */}
              <div className="space-y-4">
                <div>
                  <div className="text-white/60 text-xs mb-1">Card Number</div>
                  <div className="text-2xl font-mono tracking-wider">
                    {formatCardNumber(card.card_id)}
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <div className="text-white/60 text-xs mb-1">Available Balance</div>
                  <motion.div
                    key={card.available_balance_cents}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold"
                  >
                    {formatBalance(card.available_balance_cents)}
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-white/60 text-xs mb-1">Cardholder</div>
                  <div className="text-sm font-semibold">{card.card_display_name}</div>
                </div>

                <div className="text-right">
                  <div className="text-white/60 text-xs mb-1">Member Since</div>
                  <div className="text-sm font-semibold">
                    {new Date(card.created_at).toLocaleDateString('en-US', {
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Holographic Effect Overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 pointer-events-none"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundSize: '200% 200%',
              }}
            />
          </div>
        </motion.div>

        {/* Back of Card */}
        <motion.div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className={`relative h-full bg-gradient-to-br ${gradient} rounded-3xl p-8 overflow-hidden shadow-2xl`}>
            {/* Animated Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Magnetic Stripe */}
            <div className="absolute top-12 left-0 right-0 h-16 bg-black/60" />

            <div className="relative h-full flex flex-col justify-between pt-24">
              {/* CVV Area */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-white/80">Security Code</span>
                  <Lock className="w-4 h-4 text-white/80" />
                </div>
                <div className="bg-white text-black px-4 py-3 rounded-lg font-mono text-lg tracking-wider">
                  •••
                </div>
              </div>

              {/* Privacy Information */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="font-semibold text-sm">100% Private Billing</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  All charges appear as "GH Commerce" or "GH Digital Services" on your credit card statement.
                </p>
              </div>

              {/* Fine Print */}
              <div className="text-center text-white/60 text-xs">
                <p>Powered by CCBill • Grp Hldings LLC</p>
                <p className="mt-1">PCI-DSS Level 1 Certified</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Status Indicator */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${
              card.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm text-gray-400 capitalize">{card.status}</span>
        </div>

        {card.vault_mode_enabled && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onVaultToggle}
            className="flex items-center space-x-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Lock className="w-4 h-4" />
            <span>Access Vault</span>
          </motion.button>
        )}
      </div>

      {/* Card Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-gray-400 text-xs mb-1">Total Balance</div>
            <div className="text-xl font-bold">
              ${(card.balance_cents / 100).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Available</div>
            <div className="text-xl font-bold text-green-400">
              ${(card.available_balance_cents / 100).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 leading-relaxed">
            This card works across all 94 FANZ platforms. Your purchases are internal and never appear on external billing statements.
          </p>
        </div>
      </motion.div>

      {/* Flip Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-4 text-center text-gray-500 text-xs"
      >
        Click card to flip
      </motion.div>
    </div>
  );
};

export default DiscreetCard;
