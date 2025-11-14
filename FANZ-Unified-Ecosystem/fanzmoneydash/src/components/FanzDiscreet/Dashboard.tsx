/**
 * FanzDiscreet Dashboard
 * Main dashboard for discreet payment privacy
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, Shield, Gift, Eye, EyeOff, Lock,
  TrendingUp, DollarSign, Send, Plus, Settings
} from 'lucide-react';
import DiscreetCard from './DiscreetCard';
import LoadCardModal from './LoadCardModal';
import VaultMode from './VaultMode';
import TransactionHistory from './TransactionHistory';
import GiftCardPurchase from './GiftCardPurchase';
import { discreetAPI } from '../../services/discreetAPI';

interface DiscreetCardData {
  card_id: string;
  card_display_name: string;
  card_type: string;
  balance_cents: number;
  available_balance_cents: number;
  status: string;
  vault_mode_enabled: boolean;
  daily_remaining_cents: number;
  monthly_remaining_cents: number;
  transactions_last_30d: number;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<DiscreetCardData[]>([]);
  const [selectedCard, setSelectedCard] = useState<DiscreetCardData | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalSpent30d: 0,
    transactions30d: 0
  });

  useEffect(() => {
    loadCards();
    loadStats();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const response = await discreetAPI.getUserCards();
      setCards(response.cards || []);
      if (response.cards?.length > 0) {
        setSelectedCard(response.cards[0]);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await discreetAPI.getSpendingSummary(30);
      setStats({
        totalBalance: cards.reduce((sum, card) => sum + card.balance_cents, 0),
        totalSpent30d: response.total_spent_usd * 100,
        transactions30d: response.transaction_count
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateCard = async () => {
    try {
      await discreetAPI.createCard('reloadable');
      await loadCards();
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  const handleLoadComplete = () => {
    setShowLoadModal(false);
    loadCards();
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  FanzDiscreet
                </h1>
                <p className="text-sm text-gray-400">100% Private Payment Privacy</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGiftCard(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transition-shadow"
              >
                <Gift className="w-5 h-5" />
                <span>Send Gift</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Settings className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Balance</p>
                <h3 className="text-3xl font-bold mt-1">
                  ${(stats.totalBalance / 100).toFixed(2)}
                </h3>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-xl">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Spent (30 days)</p>
                <h3 className="text-3xl font-bold mt-1">
                  ${(stats.totalSpent30d / 100).toFixed(2)}
                </h3>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Transactions</p>
                <h3 className="text-3xl font-bold mt-1">{stats.transactions30d}</h3>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-xl">
                <Send className="w-8 h-8" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Display */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {selectedCard ? (
                <DiscreetCard
                  card={selectedCard}
                  onVaultToggle={() => setShowVault(true)}
                />
              ) : (
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-12 border border-white/10 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-2xl font-bold mb-2">No FanzDiscreet Card Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first discreet payment card to start spending privately
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCreateCard}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-xl font-semibold text-lg"
                  >
                    Create Card
                  </motion.button>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            {selectedCard && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLoadModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-purple-500/50 transition-shadow"
                >
                  <Plus className="w-6 h-6 mx-auto mb-2" />
                  Load Card
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowVault(!showVault)}
                  className="bg-white/10 p-6 rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-colors"
                >
                  {selectedCard.vault_mode_enabled ? (
                    <>
                      <Lock className="w-6 h-6 mx-auto mb-2" />
                      Vault Mode
                    </>
                  ) : (
                    <>
                      <Eye className="w-6 h-6 mx-auto mb-2" />
                      Normal Mode
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* Transaction History */}
            {selectedCard && (
              <TransactionHistory cardId={selectedCard.card_id} />
            )}
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Privacy Info */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold">100% Private</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                All charges appear as <span className="font-semibold text-purple-400">"GH Commerce"</span> or <span className="font-semibold text-purple-400">"GH Digital Services"</span> on your credit card statement. Zero mention of Fanz or adult content.
              </p>
            </motion.div>

            {/* Quick Stats */}
            {selectedCard && (
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-bold mb-4">Card Limits</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Daily Remaining</span>
                      <span className="font-semibold">
                        ${(selectedCard.daily_remaining_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(selectedCard.daily_remaining_cents / 100000) * 100}%`
                        }}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Monthly Remaining</span>
                      <span className="font-semibold">
                        ${(selectedCard.monthly_remaining_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(selectedCard.monthly_remaining_cents / 500000) * 100}%`
                        }}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* How It Works */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-lg font-bold mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-gray-300">
                    Load your FanzDiscreet card via CCBill
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-sm text-gray-300">
                    Your credit card shows "GH Commerce"
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-sm text-gray-300">
                    Spend privately across all FANZ platforms
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p className="text-sm text-gray-300">
                    No external billing for your purchases
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLoadModal && (
          <LoadCardModal
            card={selectedCard!}
            onClose={() => setShowLoadModal(false)}
            onComplete={handleLoadComplete}
          />
        )}

        {showVault && selectedCard && (
          <VaultMode
            card={selectedCard}
            onClose={() => setShowVault(false)}
          />
        )}

        {showGiftCard && (
          <GiftCardPurchase
            onClose={() => setShowGiftCard(false)}
            onComplete={() => {
              setShowGiftCard(false);
              loadCards();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
