/**
 * TransactionHistory Component
 * Display spending history with filters and infinite scroll
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
  Download,
  Search,
  Eye,
  Heart,
  Lock,
  Gift,
  CreditCard,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { discreteAPI } from '../../services/discreteAPI';
import TransactionDetails from './TransactionDetails';

interface Transaction {
  transaction_id: string;
  amount_cents: number;
  transaction_type: 'subscription' | 'tip' | 'ppv' | 'message' | 'unlock' | 'gift' | 'load';
  description: string;
  metadata?: {
    creator_name?: string;
    creator_username?: string;
    platform_name?: string;
  };
  status: string;
  created_at: string;
}

interface TransactionHistoryProps {
  cardId: string;
}

const TRANSACTION_TYPES = [
  { value: 'all', label: 'All Transactions', icon: CreditCard },
  { value: 'subscription', label: 'Subscriptions', icon: TrendingUp },
  { value: 'tip', label: 'Tips', icon: Heart },
  { value: 'ppv', label: 'PPV Content', icon: Lock },
  { value: 'message', label: 'Messages', icon: Eye },
  { value: 'unlock', label: 'Unlocks', icon: Eye },
  { value: 'gift', label: 'Gifts', icon: Gift },
  { value: 'load', label: 'Card Loads', icon: ArrowDownRight },
];

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ cardId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const limit = 20;

  useEffect(() => {
    loadTransactions();
  }, [cardId]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedType, searchQuery, dateRange]);

  useEffect(() => {
    // Setup intersection observer for infinite scroll
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreTransactions();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await discreteAPI.getTransactions(cardId, limit, 0);
      setTransactions(response.transactions || []);
      setHasMore(response.transactions?.length === limit);
      setOffset(limit);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    try {
      setLoading(true);
      const response = await discreteAPI.getTransactions(cardId, limit, offset);
      const newTransactions = response.transactions || [];
      setTransactions((prev) => [...prev, ...newTransactions]);
      setHasMore(newTransactions.length === limit);
      setOffset((prev) => prev + limit);
    } catch (error) {
      console.error('Failed to load more transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((t) => t.transaction_type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.metadata?.creator_name?.toLowerCase().includes(query) ||
          t.metadata?.creator_username?.toLowerCase().includes(query) ||
          t.metadata?.platform_name?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter((t) => new Date(t.created_at) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter((t) => new Date(t.created_at) <= new Date(dateRange.end));
    }

    setFilteredTransactions(filtered);
  };

  const handleExport = () => {
    // Convert transactions to CSV
    const csv = [
      ['Date', 'Type', 'Description', 'Amount', 'Status'].join(','),
      ...filteredTransactions.map((t) =>
        [
          new Date(t.created_at).toLocaleString(),
          t.transaction_type,
          t.description.replace(/,/g, ';'),
          `$${(t.amount_cents / 100).toFixed(2)}`,
          t.status,
        ].join(',')
      ),
    ].join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fanzdiscreete-transactions-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTransactionIcon = (type: string) => {
    const typeConfig = TRANSACTION_TYPES.find((t) => t.value === type);
    return typeConfig?.icon || CreditCard;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Transaction History</h3>
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${
                showFilters ? 'bg-purple-500' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <Filter className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRANSACTION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <motion.button
                          key={type.value}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedType(type.value)}
                          className={`flex items-center space-x-2 p-3 rounded-xl transition-all ${
                            selectedType === type.value
                              ? 'bg-purple-500 shadow-lg'
                              : 'bg-white/10 hover:bg-white/20'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{type.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedType('all');
                    setSearchQuery('');
                    setDateRange({ start: '', end: '' });
                  }}
                  className="w-full py-2 bg-white/10 rounded-xl text-sm hover:bg-white/20 transition-colors"
                >
                  Clear All Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
        {filteredTransactions.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery || selectedType !== 'all'
                ? 'No transactions match your filters'
                : 'No transactions yet'}
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction, index) => {
            const Icon = getTransactionIcon(transaction.transaction_type);
            const isLoad = transaction.transaction_type === 'load';

            return (
              <motion.div
                key={transaction.transaction_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTransaction(transaction)}
                className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isLoad
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                    }`}
                  >
                    {isLoad ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-white font-medium truncate">{transaction.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-400">{formatDate(transaction.created_at)}</p>
                      {transaction.metadata?.creator_name && (
                        <>
                          <span className="text-gray-600">•</span>
                          <p className="text-sm text-purple-400 truncate">
                            @{transaction.metadata.creator_username || transaction.metadata.creator_name}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        isLoad ? 'text-green-400' : 'text-white'
                      }`}
                    >
                      {isLoad ? '+' : '-'}${(transaction.amount_cents / 100).toFixed(2)}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        transaction.status === 'completed'
                          ? 'text-green-400'
                          : transaction.status === 'pending'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {transaction.status}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Loading More */}
        {loading && (
          <div className="p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"
            />
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMore && !loading && <div ref={loadMoreRef} className="h-4" />}

        {/* End of List */}
        {!hasMore && filteredTransactions.length > 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            You've reached the end of your transaction history
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <TransactionDetails
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TransactionHistory;
