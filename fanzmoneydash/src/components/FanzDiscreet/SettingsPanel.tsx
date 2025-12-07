/**
 * SettingsPanel Component
 * Card settings and preferences management
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Settings,
  DollarSign,
  RefreshCw,
  Bell,
  Shield,
  Edit3,
  Save,
  AlertCircle,
  CheckCircle,
  Lock,
  Zap,
} from 'lucide-react';
import { discreetAPI, DiscreetCard } from '../../services/discreetAPI';

interface SettingsPanelProps {
  card: DiscreetCard;
  onClose: () => void;
  onUpdate: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ card, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'limits' | 'autoreload' | 'notifications'>(
    'general'
  );

  // General settings
  const [cardName, setCardName] = useState(card.card_display_name);
  const [isEditingName, setIsEditingName] = useState(false);

  // Spending limits
  const [dailyLimit, setDailyLimit] = useState((card.daily_remaining_cents / 100).toString());
  const [monthlyLimit, setMonthlyLimit] = useState((card.monthly_remaining_cents / 100).toString());
  const [maxBalance, setMaxBalance] = useState('5000');

  // Auto-reload
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
  const [reloadThreshold, setReloadThreshold] = useState('50');
  const [reloadAmount, setReloadAmount] = useState('100');
  const [maxReloadsPerMonth, setMaxReloadsPerMonth] = useState('5');

  // Notifications
  const [notifyOnLoad, setNotifyOnLoad] = useState(true);
  const [notifyOnSpend, setNotifyOnSpend] = useState(false);
  const [notifyLowBalance, setNotifyLowBalance] = useState(true);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('25');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'limits', label: 'Spending Limits', icon: DollarSign },
    { id: 'autoreload', label: 'Auto-Reload', icon: RefreshCw },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleSaveCardName = async () => {
    if (!cardName.trim()) {
      setError('Card name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await discreetAPI.updateCardName(card.card_id, cardName);
      setIsEditingName(false);
      setSuccess('Card name updated successfully');
      setTimeout(() => {
        onUpdate();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to update card name');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimits = async () => {
    const daily = parseFloat(dailyLimit) * 100;
    const monthly = parseFloat(monthlyLimit) * 100;
    const max = parseFloat(maxBalance) * 100;

    if (daily <= 0 || monthly <= 0 || max <= 0) {
      setError('All limits must be greater than zero');
      return;
    }

    if (daily > monthly) {
      setError('Daily limit cannot exceed monthly limit');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await discreetAPI.updateSpendingLimits(card.card_id, {
        daily_limit_cents: daily,
        monthly_limit_cents: monthly,
        max_balance_cents: max,
      });
      setSuccess('Spending limits updated successfully');
      setTimeout(() => {
        onUpdate();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Failed to update spending limits');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutoReload = async () => {
    if (autoReloadEnabled) {
      const threshold = parseFloat(reloadThreshold) * 100;
      const amount = parseFloat(reloadAmount) * 100;
      const maxReloads = parseInt(maxReloadsPerMonth);

      if (threshold <= 0 || amount <= 0 || maxReloads <= 0) {
        setError('All values must be greater than zero');
        return;
      }

      setSaving(true);
      setError('');
      setSuccess('');

      try {
        await discreetAPI.enableAutoReload(card.card_id, {
          threshold_cents: threshold,
          reload_amount_cents: amount,
          max_per_month: maxReloads,
        });
        setSuccess('Auto-reload enabled successfully');
        setTimeout(() => {
          onUpdate();
        }, 1500);
      } catch (error: any) {
        setError(error.message || 'Failed to enable auto-reload');
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(true);
      setError('');
      setSuccess('');

      try {
        await discreetAPI.disableAutoReload(card.card_id);
        setSuccess('Auto-reload disabled successfully');
        setTimeout(() => {
          onUpdate();
        }, 1500);
      } catch (error: any) {
        setError(error.message || 'Failed to disable auto-reload');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSaveNotifications = () => {
    // In production, this would save notification preferences to backend
    setSuccess('Notification preferences saved successfully');
    setTimeout(() => {
      setSuccess('');
    }, 2000);
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
          className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Card Settings</h2>
                <p className="text-sm text-gray-400">{card.card_display_name}</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-56 bg-black/20 border-r border-white/10 p-4 space-y-2 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* General Tab */}
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">General Settings</h3>

                      {/* Card Name */}
                      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-4">
                        <label className="block text-white font-semibold mb-3">Card Nickname</label>
                        <div className="flex items-center space-x-3">
                          {isEditingName ? (
                            <>
                              <input
                                type="text"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                maxLength={50}
                                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSaveCardName}
                                disabled={saving}
                                className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg transition-shadow disabled:opacity-50"
                              >
                                <Save className="w-5 h-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setIsEditingName(false);
                                  setCardName(card.card_display_name);
                                }}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </motion.button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1 px-4 py-3 bg-white/10 rounded-xl text-white">
                                {cardName}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsEditingName(true)}
                                className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors"
                              >
                                <Edit3 className="w-5 h-5" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card Status */}
                      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                        <h4 className="text-white font-semibold mb-4">Card Status</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Status</p>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-white capitalize">{card.status}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Type</p>
                            <span className="text-white capitalize">{card.card_type}</span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Created</p>
                            <span className="text-white">
                              {new Date(card.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Vault Mode</p>
                            <div className="flex items-center space-x-2">
                              {card.vault_mode_enabled ? (
                                <>
                                  <Lock className="w-4 h-4 text-purple-400" />
                                  <span className="text-purple-400">Enabled</span>
                                </>
                              ) : (
                                <span className="text-gray-400">Disabled</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Spending Limits Tab */}
                {activeTab === 'limits' && (
                  <motion.div
                    key="limits"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Spending Limits</h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Set daily and monthly spending limits to control your spending
                      </p>

                      <div className="space-y-4">
                        {/* Daily Limit */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                          <label className="block text-white font-semibold mb-3">
                            Daily Spending Limit
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <input
                              type="number"
                              value={dailyLimit}
                              onChange={(e) => setDailyLimit(e.target.value)}
                              min="10"
                              max="10000"
                              step="10"
                              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Maximum amount you can spend per day</p>
                        </div>

                        {/* Monthly Limit */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                          <label className="block text-white font-semibold mb-3">
                            Monthly Spending Limit
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <input
                              type="number"
                              value={monthlyLimit}
                              onChange={(e) => setMonthlyLimit(e.target.value)}
                              min="50"
                              max="50000"
                              step="50"
                              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Maximum amount you can spend per month</p>
                        </div>

                        {/* Max Balance */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                          <label className="block text-white font-semibold mb-3">
                            Maximum Card Balance
                          </label>
                          <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <input
                              type="number"
                              value={maxBalance}
                              onChange={(e) => setMaxBalance(e.target.value)}
                              min="100"
                              max="10000"
                              step="100"
                              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Maximum balance your card can hold</p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSaveLimits}
                          disabled={saving}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Limits'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Auto-Reload Tab */}
                {activeTab === 'autoreload' && (
                  <motion.div
                    key="autoreload"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Auto-Reload</h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Automatically reload your card when balance falls below threshold
                      </p>

                      {/* Enable/Disable Toggle */}
                      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Zap className="w-6 h-6 text-yellow-400" />
                            <div>
                              <h4 className="text-white font-semibold">Enable Auto-Reload</h4>
                              <p className="text-sm text-gray-400">
                                Automatically load funds when balance is low
                              </p>
                            </div>
                          </div>
                          <label className="relative inline-block w-14 h-8 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoReloadEnabled}
                              onChange={(e) => setAutoReloadEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-full h-full bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                          </label>
                        </div>
                      </div>

                      {autoReloadEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {/* Reload Threshold */}
                          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                            <label className="block text-white font-semibold mb-3">
                              Reload When Balance Falls Below
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <input
                                type="number"
                                value={reloadThreshold}
                                onChange={(e) => setReloadThreshold(e.target.value)}
                                min="10"
                                max="500"
                                step="10"
                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          {/* Reload Amount */}
                          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                            <label className="block text-white font-semibold mb-3">
                              Reload Amount
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <input
                                type="number"
                                value={reloadAmount}
                                onChange={(e) => setReloadAmount(e.target.value)}
                                min="25"
                                max="1000"
                                step="25"
                                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          {/* Max Reloads */}
                          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                            <label className="block text-white font-semibold mb-3">
                              Maximum Reloads Per Month
                            </label>
                            <input
                              type="number"
                              value={maxReloadsPerMonth}
                              onChange={(e) => setMaxReloadsPerMonth(e.target.value)}
                              min="1"
                              max="20"
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </motion.div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveAutoReload}
                        disabled={saving}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-shadow disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Auto-Reload Settings'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Notifications</h3>
                      <p className="text-gray-400 text-sm mb-6">
                        Choose when you want to receive notifications
                      </p>

                      <div className="space-y-3">
                        {/* Notification Options */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <Bell className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-white font-medium">Card Loads</p>
                                <p className="text-sm text-gray-400">When funds are added to your card</p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={notifyOnLoad}
                              onChange={(e) => setNotifyOnLoad(e.target.checked)}
                              className="w-5 h-5 rounded bg-white/10 border-white/20"
                            />
                          </label>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <Bell className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-white font-medium">Purchases</p>
                                <p className="text-sm text-gray-400">When you make a purchase</p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={notifyOnSpend}
                              onChange={(e) => setNotifyOnSpend(e.target.checked)}
                              className="w-5 h-5 rounded bg-white/10 border-white/20"
                            />
                          </label>
                        </div>

                        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10">
                          <label className="flex items-center justify-between cursor-pointer mb-3">
                            <div className="flex items-center space-x-3">
                              <Bell className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="text-white font-medium">Low Balance</p>
                                <p className="text-sm text-gray-400">When balance falls below threshold</p>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={notifyLowBalance}
                              onChange={(e) => setNotifyLowBalance(e.target.checked)}
                              className="w-5 h-5 rounded bg-white/10 border-white/20"
                            />
                          </label>

                          {notifyLowBalance && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <label className="block text-sm text-gray-400 mb-2">Threshold</label>
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                  <DollarSign className="w-4 h-4" />
                                </div>
                                <input
                                  type="number"
                                  value={lowBalanceThreshold}
                                  onChange={(e) => setLowBalanceThreshold(e.target.value)}
                                  min="10"
                                  max="500"
                                  step="5"
                                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveNotifications}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-shadow mt-6"
                      >
                        Save Notification Preferences
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-4 bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-start space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-green-300 text-sm">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsPanel;
