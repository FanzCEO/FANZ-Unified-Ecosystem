/**
 * VaultMode Component
 * Biometric/PIN protected interface for FanzDiscreet
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Shield,
  Fingerprint,
  Eye,
  EyeOff,
  X,
  CheckCircle,
  AlertTriangle,
  History,
  Settings,
  Key,
} from 'lucide-react';
import { discreetAPI } from '../../services/discreetAPI';

interface VaultModeProps {
  card: {
    card_id: string;
    card_display_name: string;
    vault_mode_enabled: boolean;
  };
  onClose: () => void;
}

type VaultView = 'locked' | 'authenticating' | 'unlocked' | 'settings';
type AuthMethod = 'biometric' | 'pin';

interface AccessLog {
  access_id: string;
  auth_method: string;
  success: boolean;
  ip_address?: string;
  created_at: string;
}

const VaultMode: React.FC<VaultModeProps> = ({ card, onClose }) => {
  const [currentView, setCurrentView] = useState<VaultView>(
    card.vault_mode_enabled ? 'locked' : 'unlocked'
  );
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('biometric');
  const [error, setError] = useState<string>('');
  const [isEnabling, setIsEnabling] = useState<boolean>(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [biometricSupported, setBiometricSupported] = useState<boolean>(false);

  useEffect(() => {
    checkBiometricSupport();
    if (currentView === 'unlocked') {
      loadAccessLogs();
    }
  }, [currentView]);

  const checkBiometricSupport = async () => {
    // Check if Web Authentication API is available
    if (window.PublicKeyCredential) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricSupported(available);
        if (available) {
          setAuthMethod('biometric');
        } else {
          setAuthMethod('pin');
        }
      } catch (e) {
        setBiometricSupported(false);
        setAuthMethod('pin');
      }
    } else {
      setBiometricSupported(false);
      setAuthMethod('pin');
    }
  };

  const loadAccessLogs = async () => {
    try {
      // This would call the API to get access logs
      // For now, using mock data
      setAccessLogs([]);
    } catch (error) {
      console.error('Failed to load access logs:', error);
    }
  };

  const handleBiometricAuth = async () => {
    setCurrentView('authenticating');
    setError('');

    try {
      // Simulate biometric authentication
      // In production, this would use WebAuthn API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success
      const success = Math.random() > 0.2; // 80% success rate for demo

      if (success) {
        setCurrentView('unlocked');
        loadAccessLogs();
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error: any) {
      setError(error.message || 'Authentication failed. Please try again.');
      setCurrentView('locked');
    }
  };

  const handlePinAuth = async () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setCurrentView('authenticating');
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In production, verify PIN with backend
      // For demo, accept any 6-digit PIN
      setCurrentView('unlocked');
      setPin('');
      loadAccessLogs();
    } catch (error: any) {
      setError(error.message || 'Invalid PIN. Please try again.');
      setCurrentView('locked');
      setPin('');
    }
  };

  const handleEnableVault = async () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsEnabling(true);
    setError('');

    try {
      // Hash the PIN before sending
      const pinHash = btoa(pin); // In production, use proper hashing

      await discreetAPI.enableVaultMode(card.card_id, pinHash);

      setCurrentView('locked');
      setPin('');
      setConfirmPin('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to enable Vault Mode');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisableVault = async () => {
    try {
      await discreetAPI.disableVaultMode(card.card_id);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to disable Vault Mode');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit);
    }
  };

  const handlePinDelete = () => {
    setPin(pin.slice(0, -1));
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
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-3xl border border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Vault Mode</h2>
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

          <div className="p-6">
            {/* Locked View */}
            {currentView === 'locked' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="text-center py-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-gradient-to-br from-purple-500 to-pink-500 p-8 rounded-full inline-block mb-6"
                  >
                    <Lock className="w-16 h-16" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Vault is Locked</h3>
                  <p className="text-gray-400">
                    Authenticate to access your private transactions
                  </p>
                </div>

                {/* Auth Method Selector */}
                {biometricSupported && (
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAuthMethod('biometric')}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        authMethod === 'biometric'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Fingerprint className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">Biometric</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAuthMethod('pin')}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        authMethod === 'pin'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <Key className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm">PIN</span>
                    </motion.button>
                  </div>
                )}

                {/* Biometric Auth */}
                {authMethod === 'biometric' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBiometricAuth}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-purple-500/50 transition-shadow"
                  >
                    <Fingerprint className="w-6 h-6 inline-block mr-2" />
                    Authenticate with Biometrics
                  </motion.button>
                )}

                {/* PIN Auth */}
                {authMethod === 'pin' && (
                  <div className="space-y-4">
                    {/* PIN Display */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">Enter PIN</span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPin(!showPin)}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </motion.button>
                      </div>
                      <div className="flex justify-center space-x-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20"
                          >
                            {pin[i] ? (
                              showPin ? (
                                <span className="text-2xl font-bold">{pin[i]}</span>
                              ) : (
                                <div className="w-3 h-3 bg-purple-400 rounded-full" />
                              )
                            ) : (
                              <div className="w-3 h-3 bg-white/20 rounded-full" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Number Pad */}
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <motion.button
                          key={num}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePinInput(num.toString())}
                          className="p-6 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xl transition-colors"
                        >
                          {num}
                        </motion.button>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePinDelete}
                        className="p-6 bg-red-500/20 hover:bg-red-500/30 rounded-xl font-bold transition-colors"
                      >
                        ←
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePinInput('0')}
                        className="p-6 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xl transition-colors"
                      >
                        0
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePinAuth}
                        disabled={pin.length !== 6}
                        className="p-6 bg-green-500/20 hover:bg-green-500/30 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ✓
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-start space-x-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Authenticating View */}
            {currentView === 'authenticating' && (
              <div className="py-12 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
                />
                <h3 className="text-2xl font-bold text-white mb-2">Authenticating...</h3>
                <p className="text-gray-400">Please wait while we verify your identity</p>
              </div>
            )}

            {/* Unlocked View */}
            {currentView === 'unlocked' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="bg-gradient-to-br from-green-500 to-emerald-500 p-8 rounded-full inline-block mb-4"
                  >
                    <Unlock className="w-16 h-16" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Vault Unlocked</h3>
                  <p className="text-gray-400">Your private transactions are now accessible</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView('settings')}
                    className="flex items-center justify-center space-x-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center space-x-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <History className="w-5 h-5" />
                    <span>Access Log</span>
                  </motion.button>
                </div>

                {/* Privacy Info */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                  <h4 className="text-white font-semibold mb-3">Vault Mode Active</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Transactions hidden from dashboard</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Biometric or PIN required for access</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>All access attempts logged</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Maximum privacy protection</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Settings View */}
            {currentView === 'settings' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="text-center py-4">
                  <h3 className="text-2xl font-bold text-white mb-2">Vault Settings</h3>
                  <p className="text-gray-400">Manage your vault security</p>
                </div>

                {/* Change PIN */}
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <h4 className="text-white font-semibold mb-4">Change PIN</h4>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 rounded-xl font-semibold"
                  >
                    Update PIN
                  </motion.button>
                </div>

                {/* Disable Vault */}
                <div className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-6 border border-red-500/30">
                  <h4 className="text-white font-semibold mb-2">Disable Vault Mode</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    This will remove all protection and make transactions visible on the dashboard.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDisableVault}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 py-3 rounded-xl font-semibold border border-red-500/50 transition-colors"
                  >
                    Disable Vault Mode
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView('unlocked')}
                  className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-semibold transition-colors"
                >
                  Back
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VaultMode;
