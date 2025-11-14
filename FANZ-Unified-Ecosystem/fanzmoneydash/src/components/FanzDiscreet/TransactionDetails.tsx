/**
 * TransactionDetails Component
 * Modal showing full transaction information
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  DollarSign,
  User,
  Tag,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  MessageCircle,
} from 'lucide-react';

interface TransactionDetailsProps {
  transaction: {
    transaction_id: string;
    amount_cents: number;
    transaction_type: string;
    description: string;
    metadata?: {
      creator_name?: string;
      creator_username?: string;
      platform_name?: string;
      content_title?: string;
      subscription_period?: string;
    };
    status: string;
    created_at: string;
  };
  onClose: () => void;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ transaction, onClose }) => {
  const isLoad = transaction.transaction_type === 'load';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatTransactionType = (type: string) => {
    const types: Record<string, string> = {
      subscription: 'Subscription',
      tip: 'Creator Tip',
      ppv: 'PPV Content',
      message: 'Private Message',
      unlock: 'Content Unlock',
      gift: 'Gift',
      load: 'Card Load',
    };
    return types[type] || type;
  };

  const handleDownloadReceipt = () => {
    // Generate receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #A855F7; margin: 0; }
            .details { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .label { color: #6b7280; }
            .value { font-weight: bold; }
            .amount { font-size: 24px; color: #A855F7; margin: 20px 0; text-align: center; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FanzDiscreet</h1>
            <p>Transaction Receipt</p>
          </div>

          <div class="details">
            <div class="row">
              <span class="label">Transaction ID:</span>
              <span class="value">${transaction.transaction_id}</span>
            </div>
            <div class="row">
              <span class="label">Date:</span>
              <span class="value">${new Date(transaction.created_at).toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Type:</span>
              <span class="value">${formatTransactionType(transaction.transaction_type)}</span>
            </div>
            <div class="row">
              <span class="label">Description:</span>
              <span class="value">${transaction.description}</span>
            </div>
            ${
              transaction.metadata?.creator_name
                ? `<div class="row">
                    <span class="label">Creator:</span>
                    <span class="value">${transaction.metadata.creator_name}</span>
                  </div>`
                : ''
            }
            ${
              transaction.metadata?.platform_name
                ? `<div class="row">
                    <span class="label">Platform:</span>
                    <span class="value">${transaction.metadata.platform_name}</span>
                  </div>`
                : ''
            }
            <div class="row">
              <span class="label">Status:</span>
              <span class="value" style="text-transform: capitalize;">${transaction.status}</span>
            </div>
          </div>

          <div class="amount">
            ${isLoad ? '+' : '-'}$${(transaction.amount_cents / 100).toFixed(2)}
          </div>

          <div class="footer">
            <p>FanzDiscreet - 100% Private Payment Privacy</p>
            <p>Powered by Grp Hldings LLC</p>
            <p>This receipt is for your records only.</p>
          </div>
        </body>
      </html>
    `;

    // Convert to blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fanzdiscreete-receipt-${transaction.transaction_id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
          <div className="sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownloadReceipt}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Download className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Amount Card */}
            <div
              className={`bg-gradient-to-br ${
                isLoad
                  ? 'from-green-500/20 to-emerald-500/20 border-green-500/30'
                  : 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
              } backdrop-blur-lg rounded-2xl p-8 border text-center`}
            >
              <p className="text-gray-400 text-sm mb-2">Amount</p>
              <h3 className={`text-5xl font-bold ${isLoad ? 'text-green-400' : 'text-white'}`}>
                {isLoad ? '+' : '-'}${(transaction.amount_cents / 100).toFixed(2)}
              </h3>
              <p className="text-gray-300 text-sm mt-3">{formatTransactionType(transaction.transaction_type)}</p>
            </div>

            {/* Status Badge */}
            <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border ${getStatusColor(transaction.status)}`}>
              {getStatusIcon(transaction.status)}
              <span className="font-semibold capitalize">{transaction.status}</span>
            </div>

            {/* Transaction Info */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-start space-x-3">
                <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Transaction ID</p>
                  <p className="text-white font-mono text-sm mt-1 break-all">{transaction.transaction_id}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Date & Time</p>
                  <p className="text-white mt-1">
                    {new Date(transaction.created_at).toLocaleString('en-US', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-gray-400 text-sm">Description</p>
                  <p className="text-white mt-1">{transaction.description}</p>
                </div>
              </div>
            </div>

            {/* Creator/Platform Info */}
            {(transaction.metadata?.creator_name || transaction.metadata?.platform_name) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 space-y-4">
                <h4 className="text-white font-semibold mb-3">Additional Information</h4>

                {transaction.metadata?.creator_name && (
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm">Creator</p>
                      <p className="text-white mt-1">{transaction.metadata.creator_name}</p>
                      {transaction.metadata.creator_username && (
                        <p className="text-purple-400 text-sm mt-0.5">
                          @{transaction.metadata.creator_username}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {transaction.metadata?.platform_name && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-pink-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm">Platform</p>
                      <p className="text-white mt-1">{transaction.metadata.platform_name}</p>
                    </div>
                  </div>
                )}

                {transaction.metadata?.content_title && (
                  <div className="flex items-start space-x-3">
                    <Tag className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm">Content</p>
                      <p className="text-white mt-1">{transaction.metadata.content_title}</p>
                    </div>
                  </div>
                )}

                {transaction.metadata?.subscription_period && (
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-400 text-sm">Subscription Period</p>
                      <p className="text-white mt-1">{transaction.metadata.subscription_period}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Notice */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
              <h4 className="text-white font-semibold mb-2">Privacy Notice</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                This transaction was processed through your FanzDiscreet card.{' '}
                {isLoad
                  ? 'The charge on your credit card statement will appear as "GH Digital Services" or "GH Commerce".'
                  : 'This is an internal transaction and will not appear on any external billing statements.'}
              </p>
            </div>

            {/* Support Contact */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-2">Need help with this transaction?</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-shadow"
              >
                Contact Support
              </motion.button>
              <p className="text-xs text-gray-500 mt-3">Available 24/7</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TransactionDetails;
