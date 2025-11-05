import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  DollarSign,
  Coins,
  Bitcoin,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Eye,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WalletResponse, TrustScoreResponse, TransactionResponse } from "@shared/schema";

export default function FanzMoneyCenter() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading } = useQuery<WalletResponse | null>({
    queryKey: ['/api/fanztrust/wallet'],
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<TransactionResponse[]>({
    queryKey: ['/api/fanztrust/transactions'],
  });

  // Fetch trust score
  const { data: trustScore } = useQuery<TrustScoreResponse | null>({
    queryKey: ['/api/fanztrust/trust-score'],
  });

  // Create wallet mutation
  const createWallet = useMutation({
    mutationFn: async (type: string) => {
      const response = await fetch('/api/fanztrust/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (!response.ok) throw new Error('Failed to create wallet');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fanztrust/wallet'] });
      toast({
        title: "Wallet Created",
        description: "Your digital wallet has been set up successfully.",
      });
    },
  });

  // Crypto wallet connection mutation
  const connectCryptoWallet = useMutation({
    mutationFn: async (walletData: any) => {
      const response = await fetch('/api/fanztrust/crypto-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(walletData)
      });
      if (!response.ok) throw new Error('Failed to connect wallet');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/fanztrust/wallet'] });
      toast({
        title: "Crypto Wallet Connected",
        description: "Your cryptocurrency wallet has been linked successfully.",
      });
    },
  });

  const handleConnectMetaMask = async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        connectCryptoWallet.mutate({
          provider: 'metamask',
          walletAddress: accounts[0],
          network: 'ethereum'
        });
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to MetaMask. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask extension to continue.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'completed' || status === 'approved' ? 'default' :
                   status === 'pending' ? 'secondary' : 'destructive';
    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent" data-testid="text-title">
            FanzMoneyCenter™
          </h1>
          <p className="text-gray-400 text-sm md:text-base" data-testid="text-subtitle">
            Your Complete Financial Control Center
          </p>
        </div>

        {/* Trust Score Banner */}
        {trustScore && (
          <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30" data-testid="card-trust-score">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Shield className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold" data-testid="text-trust-level">
                      Trust Level: {trustScore.level}
                    </h3>
                    <p className="text-sm text-gray-400" data-testid="text-trust-score">
                      Score: {trustScore.score}/1000
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-green-500" data-testid="text-successful-transactions">
                      {trustScore.successfulTransactions}
                    </p>
                    <p className="text-xs text-gray-400">Successful</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-yellow-500" data-testid="text-refunds-initiated">
                      {trustScore.refundsInitiated}
                    </p>
                    <p className="text-xs text-gray-400">Refunds</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl md:text-2xl font-bold text-red-500" data-testid="text-fraud-flags">
                      {trustScore.fraudFlags}
                    </p>
                    <p className="text-xs text-gray-400">Flags</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-gray-900" data-testid="tabs-list">
            <TabsTrigger value="overview" className="text-xs md:text-sm" data-testid="tab-overview">
              <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs md:text-sm" data-testid="tab-wallet">
              <Wallet className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm" data-testid="tab-transactions">
              <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="crypto" className="text-xs md:text-sm" data-testid="tab-crypto">
              <Bitcoin className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Crypto</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-xs md:text-sm" data-testid="tab-cards">
              <CreditCard className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Cards</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800" data-testid="card-fanzcoin-balance">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">FanzCoin Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-cyan-500" data-testid="text-fanzcoin-amount">
                        {wallet?.fanzCoin?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">≈ ${wallet?.fanzCoin ? (wallet.fanzCoin * 0.01).toFixed(2) : '0.00'}</p>
                    </div>
                    <Coins className="h-8 w-8 text-cyan-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800" data-testid="card-fanztoken-balance">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">FanzToken Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-purple-500" data-testid="text-fanztoken-amount">
                        {wallet?.fanzToken?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">Platform Currency</p>
                    </div>
                    <Coins className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800" data-testid="card-fanzcredit-balance">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">FanzCredit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-pink-500" data-testid="text-fanzcredit-amount">
                        ${wallet?.fanzCredit?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500">Available Credit</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-pink-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-800" data-testid="card-total-value">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-500" data-testid="text-total-amount">
                        ${((wallet?.fanzCoin || 0) * 0.01 + (wallet?.fanzCredit || 0)).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">USD Value</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-gray-900 border-gray-800" data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your finances efficiently</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={createWallet.isPending}
                  onClick={() => createWallet.mutate('main')}
                  data-testid="button-add-funds"
                >
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Add Funds
                </Button>
                <Button variant="outline" className="border-gray-700" data-testid="button-withdraw">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
                <Button variant="outline" className="border-gray-700" data-testid="button-convert">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Convert
                </Button>
                <Button variant="outline" className="border-gray-700" data-testid="button-history">
                  <Eye className="mr-2 h-4 w-4" />
                  History
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800" data-testid="card-wallet-details">
              <CardHeader>
                <CardTitle>Wallet Management</CardTitle>
                <CardDescription>View and manage your digital wallets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {walletLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-400">Loading wallet...</p>
                  </div>
                ) : wallet ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold" data-testid="text-wallet-type">
                          {wallet.type?.toUpperCase() || 'MAIN'} Wallet
                        </h3>
                        <Badge variant="default" data-testid="badge-wallet-status">Active</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">FanzCoin</p>
                          <p className="text-xl font-bold text-cyan-500" data-testid="text-wallet-fanzcoin">
                            {wallet.fanzCoin?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">FanzToken</p>
                          <p className="text-xl font-bold text-purple-500" data-testid="text-wallet-fanztoken">
                            {wallet.fanzToken?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">FanzCredit</p>
                          <p className="text-xl font-bold text-pink-500" data-testid="text-wallet-fanzcredit">
                            ${wallet.fanzCredit?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {wallet.walletAddress && (
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono" data-testid="text-wallet-address">
                            {wallet.walletAddress}
                          </code>
                          <Button size="sm" variant="ghost" data-testid="button-copy-address">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-4">No wallet found</p>
                    <Button 
                      onClick={() => createWallet.mutate('main')}
                      disabled={createWallet.isPending}
                      data-testid="button-create-wallet"
                    >
                      Create Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800" data-testid="card-transactions">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View all your financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-gray-400">Loading transactions...</p>
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                        data-testid={`transaction-${tx.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {tx.type === 'deposit' ? 
                              <ArrowDownLeft className="h-5 w-5 text-green-500" /> :
                              <ArrowUpRight className="h-5 w-5 text-red-500" />
                            }
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`text-transaction-type-${tx.id}`}>
                              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </p>
                            <p className="text-xs text-gray-400" data-testid={`text-transaction-date-${tx.id}`}>
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold ${
                              tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'
                            }`} data-testid={`text-transaction-amount-${tx.id}`}>
                              {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400" data-testid={`text-transaction-gateway-${tx.id}`}>
                              {tx.gateway}
                            </p>
                          </div>
                          {getStatusIcon(tx.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800" data-testid="card-crypto-wallets">
              <CardHeader>
                <CardTitle>Cryptocurrency Wallets</CardTitle>
                <CardDescription>Connect and manage your crypto wallets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col border-orange-500/30 hover:bg-orange-500/10"
                    onClick={handleConnectMetaMask}
                    disabled={connectCryptoWallet.isPending}
                    data-testid="button-connect-metamask"
                  >
                    <Bitcoin className="h-8 w-8 mb-2 text-orange-500" />
                    <span>Connect MetaMask</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col border-purple-500/30 hover:bg-purple-500/10"
                    data-testid="button-connect-solana"
                  >
                    <Wallet className="h-8 w-8 mb-2 text-purple-500" />
                    <span>Connect Solana</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-24 flex-col border-cyan-500/30 hover:bg-cyan-500/10"
                    data-testid="button-connect-tronlink"
                  >
                    <Coins className="h-8 w-8 mb-2 text-cyan-500" />
                    <span>Connect TronLink</span>
                  </Button>
                </div>

                {wallet?.cryptoWallets && wallet.cryptoWallets.length > 0 ? (
                  <div className="space-y-3 mt-6">
                    <h4 className="font-medium">Connected Wallets</h4>
                    {wallet.cryptoWallets.map((crypto, index) => (
                      <div 
                        key={index}
                        className="p-4 bg-gray-800/50 rounded-lg flex items-center justify-between"
                        data-testid={`crypto-wallet-${index}`}
                      >
                        <div>
                          <p className="font-medium capitalize" data-testid={`text-crypto-provider-${index}`}>
                            {crypto.provider}
                          </p>
                          <code className="text-xs text-gray-400" data-testid={`text-crypto-address-${index}`}>
                            {crypto.walletAddress.slice(0, 6)}...{crypto.walletAddress.slice(-4)}
                          </code>
                        </div>
                        <Badge variant="default" data-testid={`badge-crypto-status-${index}`}>
                          Connected
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No crypto wallets connected yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800" data-testid="card-virtual-cards">
              <CardHeader>
                <CardTitle>FanzCard™ Virtual Cards</CardTitle>
                <CardDescription>Create and manage virtual payment cards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">Virtual card feature coming soon</p>
                  <Button disabled data-testid="button-create-card">
                    Create Virtual Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
