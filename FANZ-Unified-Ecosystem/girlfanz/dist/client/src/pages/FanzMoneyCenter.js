"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FanzMoneyCenter;
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const use_toast_1 = require("@/hooks/use-toast");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const tabs_1 = require("@/components/ui/tabs");
const badge_1 = require("@/components/ui/badge");
const lucide_react_1 = require("lucide-react");
const queryClient_1 = require("@/lib/queryClient");
function FanzMoneyCenter() {
    var _a, _b, _c, _d, _e, _f, _g;
    const { toast } = (0, use_toast_1.useToast)();
    const [activeTab, setActiveTab] = (0, react_1.useState)("overview");
    // Fetch wallet data
    const { data: wallet, isLoading: walletLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/fanztrust/wallet'],
    });
    // Fetch transactions
    const { data: transactions, isLoading: transactionsLoading } = (0, react_query_1.useQuery)({
        queryKey: ['/api/fanztrust/transactions'],
    });
    // Fetch trust score
    const { data: trustScore } = (0, react_query_1.useQuery)({
        queryKey: ['/api/fanztrust/trust-score'],
    });
    // Create wallet mutation
    const createWallet = (0, react_query_1.useMutation)({
        mutationFn: async (type) => {
            const response = await fetch('/api/fanztrust/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            if (!response.ok)
                throw new Error('Failed to create wallet');
            return response.json();
        },
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/fanztrust/wallet'] });
            toast({
                title: "Wallet Created",
                description: "Your digital wallet has been set up successfully.",
            });
        },
    });
    // Crypto wallet connection mutation
    const connectCryptoWallet = (0, react_query_1.useMutation)({
        mutationFn: async (walletData) => {
            const response = await fetch('/api/fanztrust/crypto-wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(walletData)
            });
            if (!response.ok)
                throw new Error('Failed to connect wallet');
            return response.json();
        },
        onSuccess: () => {
            queryClient_1.queryClient.invalidateQueries({ queryKey: ['/api/fanztrust/wallet'] });
            toast({
                title: "Crypto Wallet Connected",
                description: "Your cryptocurrency wallet has been linked successfully.",
            });
        },
    });
    const handleConnectMetaMask = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                connectCryptoWallet.mutate({
                    provider: 'metamask',
                    walletAddress: accounts[0],
                    network: 'ethereum'
                });
            }
            catch (error) {
                toast({
                    title: "Connection Failed",
                    description: "Could not connect to MetaMask. Please try again.",
                    variant: "destructive"
                });
            }
        }
        else {
            toast({
                title: "MetaMask Not Found",
                description: "Please install MetaMask extension to continue.",
                variant: "destructive"
            });
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
            case 'approved':
                return React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-green-500" });
            case 'pending':
                return React.createElement(lucide_react_1.Clock, { className: "h-4 w-4 text-yellow-500" });
            case 'rejected':
            case 'failed':
                return React.createElement(lucide_react_1.XCircle, { className: "h-4 w-4 text-red-500" });
            default:
                return React.createElement(lucide_react_1.AlertTriangle, { className: "h-4 w-4 text-gray-500" });
        }
    };
    const getStatusBadge = (status) => {
        const variant = status === 'completed' || status === 'approved' ? 'default' :
            status === 'pending' ? 'secondary' : 'destructive';
        return (React.createElement(badge_1.Badge, { variant: variant, className: "capitalize" }, status));
    };
    return (React.createElement("div", { className: "min-h-screen bg-black text-white p-4 md:p-8" },
        React.createElement("div", { className: "max-w-7xl mx-auto space-y-8" },
            React.createElement("div", { className: "space-y-2" },
                React.createElement("h1", { className: "text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent", "data-testid": "text-title" }, "FanzMoneyCenter\u2122"),
                React.createElement("p", { className: "text-gray-400 text-sm md:text-base", "data-testid": "text-subtitle" }, "Your Complete Financial Control Center")),
            trustScore && (React.createElement(card_1.Card, { className: "bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30", "data-testid": "card-trust-score" },
                React.createElement(card_1.CardContent, { className: "p-4 md:p-6" },
                    React.createElement("div", { className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4" },
                        React.createElement("div", { className: "flex items-center gap-4" },
                            React.createElement("div", { className: "w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center" },
                                React.createElement(lucide_react_1.Shield, { className: "h-6 w-6 md:h-8 md:w-8" })),
                            React.createElement("div", null,
                                React.createElement("h3", { className: "text-lg md:text-xl font-bold", "data-testid": "text-trust-level" },
                                    "Trust Level: ",
                                    trustScore.level),
                                React.createElement("p", { className: "text-sm text-gray-400", "data-testid": "text-trust-score" },
                                    "Score: ",
                                    trustScore.score,
                                    "/1000"))),
                        React.createElement("div", { className: "grid grid-cols-3 gap-4 w-full md:w-auto" },
                            React.createElement("div", { className: "text-center" },
                                React.createElement("p", { className: "text-xl md:text-2xl font-bold text-green-500", "data-testid": "text-successful-transactions" }, trustScore.successfulTransactions),
                                React.createElement("p", { className: "text-xs text-gray-400" }, "Successful")),
                            React.createElement("div", { className: "text-center" },
                                React.createElement("p", { className: "text-xl md:text-2xl font-bold text-yellow-500", "data-testid": "text-refunds-initiated" }, trustScore.refundsInitiated),
                                React.createElement("p", { className: "text-xs text-gray-400" }, "Refunds")),
                            React.createElement("div", { className: "text-center" },
                                React.createElement("p", { className: "text-xl md:text-2xl font-bold text-red-500", "data-testid": "text-fraud-flags" }, trustScore.fraudFlags),
                                React.createElement("p", { className: "text-xs text-gray-400" }, "Flags"))))))),
            React.createElement(tabs_1.Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6" },
                React.createElement(tabs_1.TabsList, { className: "grid w-full grid-cols-2 md:grid-cols-5 bg-gray-900", "data-testid": "tabs-list" },
                    React.createElement(tabs_1.TabsTrigger, { value: "overview", className: "text-xs md:text-sm", "data-testid": "tab-overview" },
                        React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4 mr-1 md:mr-2" }),
                        React.createElement("span", { className: "hidden md:inline" }, "Overview")),
                    React.createElement(tabs_1.TabsTrigger, { value: "wallet", className: "text-xs md:text-sm", "data-testid": "tab-wallet" },
                        React.createElement(lucide_react_1.Wallet, { className: "h-4 w-4 mr-1 md:mr-2" }),
                        React.createElement("span", { className: "hidden md:inline" }, "Wallet")),
                    React.createElement(tabs_1.TabsTrigger, { value: "transactions", className: "text-xs md:text-sm", "data-testid": "tab-transactions" },
                        React.createElement(lucide_react_1.TrendingUp, { className: "h-4 w-4 mr-1 md:mr-2" }),
                        React.createElement("span", { className: "hidden md:inline" }, "Transactions")),
                    React.createElement(tabs_1.TabsTrigger, { value: "crypto", className: "text-xs md:text-sm", "data-testid": "tab-crypto" },
                        React.createElement(lucide_react_1.Bitcoin, { className: "h-4 w-4 mr-1 md:mr-2" }),
                        React.createElement("span", { className: "hidden md:inline" }, "Crypto")),
                    React.createElement(tabs_1.TabsTrigger, { value: "cards", className: "text-xs md:text-sm", "data-testid": "tab-cards" },
                        React.createElement(lucide_react_1.CreditCard, { className: "h-4 w-4 mr-1 md:mr-2" }),
                        React.createElement("span", { className: "hidden md:inline" }, "Cards"))),
                React.createElement(tabs_1.TabsContent, { value: "overview", className: "space-y-6" },
                    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" },
                        React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-fanzcoin-balance" },
                            React.createElement(card_1.CardHeader, { className: "pb-2" },
                                React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "FanzCoin Balance")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-2xl font-bold text-cyan-500", "data-testid": "text-fanzcoin-amount" }, ((_a = wallet === null || wallet === void 0 ? void 0 : wallet.fanzCoin) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || '0.00'),
                                        React.createElement("p", { className: "text-xs text-gray-500" },
                                            "\u2248 $",
                                            (wallet === null || wallet === void 0 ? void 0 : wallet.fanzCoin) ? (wallet.fanzCoin * 0.01).toFixed(2) : '0.00')),
                                    React.createElement(lucide_react_1.Coins, { className: "h-8 w-8 text-cyan-500" })))),
                        React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-fanztoken-balance" },
                            React.createElement(card_1.CardHeader, { className: "pb-2" },
                                React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "FanzToken Balance")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-2xl font-bold text-purple-500", "data-testid": "text-fanztoken-amount" }, ((_b = wallet === null || wallet === void 0 ? void 0 : wallet.fanzToken) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || '0.00'),
                                        React.createElement("p", { className: "text-xs text-gray-500" }, "Platform Currency")),
                                    React.createElement(lucide_react_1.Coins, { className: "h-8 w-8 text-purple-500" })))),
                        React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-fanzcredit-balance" },
                            React.createElement(card_1.CardHeader, { className: "pb-2" },
                                React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "FanzCredit")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-2xl font-bold text-pink-500", "data-testid": "text-fanzcredit-amount" },
                                            "$",
                                            ((_c = wallet === null || wallet === void 0 ? void 0 : wallet.fanzCredit) === null || _c === void 0 ? void 0 : _c.toFixed(2)) || '0.00'),
                                        React.createElement("p", { className: "text-xs text-gray-500" }, "Available Credit")),
                                    React.createElement(lucide_react_1.DollarSign, { className: "h-8 w-8 text-pink-500" })))),
                        React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-total-value" },
                            React.createElement(card_1.CardHeader, { className: "pb-2" },
                                React.createElement(card_1.CardTitle, { className: "text-sm font-medium text-gray-400" }, "Total Value")),
                            React.createElement(card_1.CardContent, null,
                                React.createElement("div", { className: "flex items-center justify-between" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-2xl font-bold text-green-500", "data-testid": "text-total-amount" },
                                            "$",
                                            (((wallet === null || wallet === void 0 ? void 0 : wallet.fanzCoin) || 0) * 0.01 + ((wallet === null || wallet === void 0 ? void 0 : wallet.fanzCredit) || 0)).toFixed(2)),
                                        React.createElement("p", { className: "text-xs text-gray-500" }, "USD Value")),
                                    React.createElement(lucide_react_1.TrendingUp, { className: "h-8 w-8 text-green-500" }))))),
                    React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-quick-actions" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "Quick Actions"),
                            React.createElement(card_1.CardDescription, null, "Manage your finances efficiently")),
                        React.createElement(card_1.CardContent, { className: "grid grid-cols-2 md:grid-cols-4 gap-3" },
                            React.createElement(button_1.Button, { className: "bg-purple-600 hover:bg-purple-700", disabled: createWallet.isPending, onClick: () => createWallet.mutate('main'), "data-testid": "button-add-funds" },
                                React.createElement(lucide_react_1.ArrowDownLeft, { className: "mr-2 h-4 w-4" }),
                                "Add Funds"),
                            React.createElement(button_1.Button, { variant: "outline", className: "border-gray-700", "data-testid": "button-withdraw" },
                                React.createElement(lucide_react_1.ArrowUpRight, { className: "mr-2 h-4 w-4" }),
                                "Withdraw"),
                            React.createElement(button_1.Button, { variant: "outline", className: "border-gray-700", "data-testid": "button-convert" },
                                React.createElement(lucide_react_1.RefreshCw, { className: "mr-2 h-4 w-4" }),
                                "Convert"),
                            React.createElement(button_1.Button, { variant: "outline", className: "border-gray-700", "data-testid": "button-history" },
                                React.createElement(lucide_react_1.Eye, { className: "mr-2 h-4 w-4" }),
                                "History")))),
                React.createElement(tabs_1.TabsContent, { value: "wallet", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-wallet-details" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "Wallet Management"),
                            React.createElement(card_1.CardDescription, null, "View and manage your digital wallets")),
                        React.createElement(card_1.CardContent, { className: "space-y-4" }, walletLoading ? (React.createElement("div", { className: "text-center py-8" },
                            React.createElement(lucide_react_1.RefreshCw, { className: "h-8 w-8 animate-spin mx-auto mb-2" }),
                            React.createElement("p", { className: "text-gray-400" }, "Loading wallet..."))) : wallet ? (React.createElement("div", { className: "space-y-4" },
                            React.createElement("div", { className: "bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-6 rounded-lg border border-purple-500/30" },
                                React.createElement("div", { className: "flex items-center justify-between mb-4" },
                                    React.createElement("h3", { className: "text-lg font-bold", "data-testid": "text-wallet-type" },
                                        ((_d = wallet.type) === null || _d === void 0 ? void 0 : _d.toUpperCase()) || 'MAIN',
                                        " Wallet"),
                                    React.createElement(badge_1.Badge, { variant: "default", "data-testid": "badge-wallet-status" }, "Active")),
                                React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4" },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-xs text-gray-400" }, "FanzCoin"),
                                        React.createElement("p", { className: "text-xl font-bold text-cyan-500", "data-testid": "text-wallet-fanzcoin" }, ((_e = wallet.fanzCoin) === null || _e === void 0 ? void 0 : _e.toFixed(2)) || '0.00')),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-xs text-gray-400" }, "FanzToken"),
                                        React.createElement("p", { className: "text-xl font-bold text-purple-500", "data-testid": "text-wallet-fanztoken" }, ((_f = wallet.fanzToken) === null || _f === void 0 ? void 0 : _f.toFixed(2)) || '0.00')),
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "text-xs text-gray-400" }, "FanzCredit"),
                                        React.createElement("p", { className: "text-xl font-bold text-pink-500", "data-testid": "text-wallet-fanzcredit" },
                                            "$",
                                            ((_g = wallet.fanzCredit) === null || _g === void 0 ? void 0 : _g.toFixed(2)) || '0.00')))),
                            wallet.walletAddress && (React.createElement("div", { className: "bg-gray-800/50 p-4 rounded-lg" },
                                React.createElement("p", { className: "text-xs text-gray-400 mb-1" }, "Wallet Address"),
                                React.createElement("div", { className: "flex items-center gap-2" },
                                    React.createElement("code", { className: "text-sm font-mono", "data-testid": "text-wallet-address" }, wallet.walletAddress),
                                    React.createElement(button_1.Button, { size: "sm", variant: "ghost", "data-testid": "button-copy-address" },
                                        React.createElement(lucide_react_1.ExternalLink, { className: "h-3 w-3" }))))))) : (React.createElement("div", { className: "text-center py-8" },
                            React.createElement(lucide_react_1.Wallet, { className: "h-12 w-12 mx-auto mb-4 text-gray-600" }),
                            React.createElement("p", { className: "text-gray-400 mb-4" }, "No wallet found"),
                            React.createElement(button_1.Button, { onClick: () => createWallet.mutate('main'), disabled: createWallet.isPending, "data-testid": "button-create-wallet" }, "Create Wallet")))))),
                React.createElement(tabs_1.TabsContent, { value: "transactions", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-transactions" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "Transaction History"),
                            React.createElement(card_1.CardDescription, null, "View all your financial transactions")),
                        React.createElement(card_1.CardContent, null, transactionsLoading ? (React.createElement("div", { className: "text-center py-8" },
                            React.createElement(lucide_react_1.RefreshCw, { className: "h-8 w-8 animate-spin mx-auto mb-2" }),
                            React.createElement("p", { className: "text-gray-400" }, "Loading transactions..."))) : transactions && transactions.length > 0 ? (React.createElement("div", { className: "space-y-3" }, transactions.map((tx) => (React.createElement("div", { key: tx.id, className: "flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors", "data-testid": `transaction-${tx.id}` },
                            React.createElement("div", { className: "flex items-center gap-4" },
                                React.createElement("div", { className: `w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'}` }, tx.type === 'deposit' ?
                                    React.createElement(lucide_react_1.ArrowDownLeft, { className: "h-5 w-5 text-green-500" }) :
                                    React.createElement(lucide_react_1.ArrowUpRight, { className: "h-5 w-5 text-red-500" })),
                                React.createElement("div", null,
                                    React.createElement("p", { className: "font-medium", "data-testid": `text-transaction-type-${tx.id}` }, tx.type.charAt(0).toUpperCase() + tx.type.slice(1)),
                                    React.createElement("p", { className: "text-xs text-gray-400", "data-testid": `text-transaction-date-${tx.id}` }, new Date(tx.createdAt).toLocaleDateString()))),
                            React.createElement("div", { className: "flex items-center gap-4" },
                                React.createElement("div", { className: "text-right" },
                                    React.createElement("p", { className: `font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-red-500'}`, "data-testid": `text-transaction-amount-${tx.id}` },
                                        tx.type === 'deposit' ? '+' : '-',
                                        "$",
                                        tx.amount.toFixed(2)),
                                    React.createElement("p", { className: "text-xs text-gray-400", "data-testid": `text-transaction-gateway-${tx.id}` }, tx.gateway)),
                                getStatusIcon(tx.status))))))) : (React.createElement("div", { className: "text-center py-8" },
                            React.createElement(lucide_react_1.TrendingUp, { className: "h-12 w-12 mx-auto mb-4 text-gray-600" }),
                            React.createElement("p", { className: "text-gray-400" }, "No transactions yet")))))),
                React.createElement(tabs_1.TabsContent, { value: "crypto", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-crypto-wallets" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "Cryptocurrency Wallets"),
                            React.createElement(card_1.CardDescription, null, "Connect and manage your crypto wallets")),
                        React.createElement(card_1.CardContent, { className: "space-y-4" },
                            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
                                React.createElement(button_1.Button, { variant: "outline", className: "h-24 flex-col border-orange-500/30 hover:bg-orange-500/10", onClick: handleConnectMetaMask, disabled: connectCryptoWallet.isPending, "data-testid": "button-connect-metamask" },
                                    React.createElement(lucide_react_1.Bitcoin, { className: "h-8 w-8 mb-2 text-orange-500" }),
                                    React.createElement("span", null, "Connect MetaMask")),
                                React.createElement(button_1.Button, { variant: "outline", className: "h-24 flex-col border-purple-500/30 hover:bg-purple-500/10", "data-testid": "button-connect-solana" },
                                    React.createElement(lucide_react_1.Wallet, { className: "h-8 w-8 mb-2 text-purple-500" }),
                                    React.createElement("span", null, "Connect Solana")),
                                React.createElement(button_1.Button, { variant: "outline", className: "h-24 flex-col border-cyan-500/30 hover:bg-cyan-500/10", "data-testid": "button-connect-tronlink" },
                                    React.createElement(lucide_react_1.Coins, { className: "h-8 w-8 mb-2 text-cyan-500" }),
                                    React.createElement("span", null, "Connect TronLink"))),
                            (wallet === null || wallet === void 0 ? void 0 : wallet.cryptoWallets) && wallet.cryptoWallets.length > 0 ? (React.createElement("div", { className: "space-y-3 mt-6" },
                                React.createElement("h4", { className: "font-medium" }, "Connected Wallets"),
                                wallet.cryptoWallets.map((crypto, index) => (React.createElement("div", { key: index, className: "p-4 bg-gray-800/50 rounded-lg flex items-center justify-between", "data-testid": `crypto-wallet-${index}` },
                                    React.createElement("div", null,
                                        React.createElement("p", { className: "font-medium capitalize", "data-testid": `text-crypto-provider-${index}` }, crypto.provider),
                                        React.createElement("code", { className: "text-xs text-gray-400", "data-testid": `text-crypto-address-${index}` },
                                            crypto.walletAddress.slice(0, 6),
                                            "...",
                                            crypto.walletAddress.slice(-4))),
                                    React.createElement(badge_1.Badge, { variant: "default", "data-testid": `badge-crypto-status-${index}` }, "Connected")))))) : (React.createElement("div", { className: "text-center py-8 text-gray-400" },
                                React.createElement("p", null, "No crypto wallets connected yet")))))),
                React.createElement(tabs_1.TabsContent, { value: "cards", className: "space-y-6" },
                    React.createElement(card_1.Card, { className: "bg-gray-900 border-gray-800", "data-testid": "card-virtual-cards" },
                        React.createElement(card_1.CardHeader, null,
                            React.createElement(card_1.CardTitle, null, "FanzCard\u2122 Virtual Cards"),
                            React.createElement(card_1.CardDescription, null, "Create and manage virtual payment cards")),
                        React.createElement(card_1.CardContent, null,
                            React.createElement("div", { className: "text-center py-8" },
                                React.createElement(lucide_react_1.CreditCard, { className: "h-12 w-12 mx-auto mb-4 text-gray-600" }),
                                React.createElement("p", { className: "text-gray-400 mb-4" }, "Virtual card feature coming soon"),
                                React.createElement(button_1.Button, { disabled: true, "data-testid": "button-create-card" }, "Create Virtual Card")))))))));
}
