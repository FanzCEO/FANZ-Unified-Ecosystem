import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Star,
  Globe,
  MapPin,
  Clock,
  TrendingUp,
  Download
} from "lucide-react";

interface PayoutAccount {
  id: string;
  provider: string;
  accountRef: string;
  status: string;
  metadata?: any;
  createdAt: string;
}

interface PayoutAccountForm {
  provider: "paxum" | "epayservice" | "wise" | "crypto";
  accountRef: string;
  metadata: Record<string, any>;
}

export default function PaymentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProcessor, setSelectedProcessor] = useState("ccbill");
  const [payoutForm, setPayoutForm] = useState<PayoutAccountForm>({
    provider: "paxum",
    accountRef: "",
    metadata: {},
  });

  const { data: payoutAccounts, isLoading } = useQuery({
    queryKey: ["/api/payments/accounts"],
    retry: false,
    enabled: user?.role === "creator" || user?.role === "admin",
  });

  const createPayoutAccountMutation = useMutation({
    mutationFn: async (data: PayoutAccountForm) => {
      const response = await apiRequest("POST", "/api/payments/accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/accounts"] });
      toast({
        title: "Payout Account Added",
        description: "Your payout account has been set up successfully.",
      });
      setPayoutForm({
        provider: "paxum",
        accountRef: "",
        metadata: {},
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Setup Failed",
        description: "Failed to set up payout account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/payments/payout", { amount });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for processing.",
      });
    },
    onError: (error) => {
      toast({
        title: "Payout Failed",
        description: "Failed to request payout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitPayoutAccount = () => {
    if (!payoutForm.accountRef.trim()) {
      toast({
        title: "Account Required",
        description: "Please provide your account information.",
        variant: "destructive",
      });
      return;
    }

    createPayoutAccountMutation.mutate(payoutForm);
  };

  const handleRequestPayout = () => {
    // Mock available balance
    const availableBalance = 2134.50;
    requestPayoutMutation.mutate(availableBalance);
  };

  const paymentProcessors = [
    {
      id: "ccbill",
      name: "CCBill",
      region: "US",
      icon: "💳",
      description: "Primary US processor",
      recommended: true,
    },
    {
      id: "segpay",
      name: "Segpay",
      region: "Global",
      icon: "🌍",
      description: "Global backup processor",
      recommended: false,
    },
    {
      id: "epoch",
      name: "Epoch",
      region: "EU",
      icon: "🇪🇺",
      description: "European processor",
      recommended: false,
    },
    {
      id: "vendo",
      name: "Vendo",
      region: "LatAm",
      icon: "🌎",
      description: "Latin America processor",
      recommended: false,
    },
  ];

  const payoutProviders = [
    {
      id: "paxum",
      name: "Paxum",
      description: "Adult industry standard",
      processingTime: "1-2 business days",
      fees: "1.5%",
      recommended: true,
    },
    {
      id: "epayservice",
      name: "ePayService",
      description: "Alternative adult-friendly",
      processingTime: "2-3 business days",
      fees: "2.0%",
      recommended: false,
    },
    {
      id: "wise",
      name: "Wise",
      description: "International transfers",
      processingTime: "1-2 business days",
      fees: "0.5%",
      recommended: false,
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      description: "BTC, ETH, USDT, USDC",
      processingTime: "1-24 hours",
      fees: "Network fees",
      recommended: false,
    },
  ];

  const getProviderStatus = (provider: string) => {
    const account = payoutAccounts?.find((acc: PayoutAccount) => acc.provider === provider);
    if (account) {
      return account.status === "active" ? "connected" : "pending";
    }
    return "not_connected";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-600 text-white">Connected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-black">Pending</Badge>;
      case "not_connected":
        return <Badge variant="secondary">Not Connected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isCreator = user?.role === "creator" || user?.role === "admin";

  if (!isCreator) {
    return (
      <Card className="card-df">
        <CardContent className="pt-6 text-center">
          <Shield className="h-12 w-12 text-df-fog mx-auto mb-4" />
          <h3 className="text-df-snow text-lg font-semibold mb-2">Creator Access Required</h3>
          <p className="text-df-fog">You need to be a creator to access payment settings.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="processors" className="space-y-6">
        <TabsList className="bg-df-brick border border-df-steel">
          <TabsTrigger 
            value="processors" 
            className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
            data-testid="tab-processors"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Processors
          </TabsTrigger>
          <TabsTrigger 
            value="payouts" 
            className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
            data-testid="tab-payouts"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Payout Methods
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-df-cyan data-[state=active]:text-df-ink text-df-fog"
            data-testid="tab-analytics"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Payment Processors Tab */}
        <TabsContent value="processors">
          <Card className="card-df">
            <CardHeader>
              <CardTitle className="text-xl glow-text-gold">
                Adult-Friendly Payment Processors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Critical Warning */}
              <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-md p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="text-red-200 font-semibold mb-1">CRITICAL: Adult-Friendly Processors Only</h4>
                    <p className="text-red-100 text-sm">
                      NEVER use Stripe, PayPal, or Square - they prohibit adult content and will ban your account.
                      Only the processors listed below are approved for adult content.
                    </p>
                  </div>
                </div>
              </div>

              {/* Processor Selection */}
              <div>
                <Label className="text-df-fog">Selected Payment Processor</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {paymentProcessors.map((processor) => (
                    <div
                      key={processor.id}
                      onClick={() => setSelectedProcessor(processor.id)}
                      className={`p-4 border rounded-md cursor-pointer transition-all ${
                        selectedProcessor === processor.id
                          ? 'border-df-cyan bg-df-cyan bg-opacity-10'
                          : 'border-df-steel hover:border-df-cyan hover:bg-df-steel hover:bg-opacity-10'
                      }`}
                      data-testid={`processor-${processor.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{processor.icon}</span>
                          <div>
                            <h4 className="text-df-snow font-semibold">{processor.name}</h4>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 text-df-fog" />
                              <span className="text-df-fog text-sm">{processor.region}</span>
                            </div>
                          </div>
                        </div>
                        {processor.recommended && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-df-gold" />
                            <span className="text-df-gold text-sm font-medium">Recommended</span>
                          </div>
                        )}
                      </div>
                      <p className="text-df-fog text-sm">{processor.description}</p>
                      {selectedProcessor === processor.id && (
                        <div className="mt-3 p-3 bg-df-ink border border-df-steel rounded-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">Active Processor</span>
                          </div>
                          <p className="text-df-fog text-xs">
                            This processor is configured and ready to accept payments.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Routing Info */}
              <div className="mt-6 bg-df-ink border border-df-steel rounded-md p-4">
                <h4 className="text-df-cyan font-semibold mb-3">Regional Payment Routing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-df-fog">US & Canada:</span>
                    <span className="ml-2 text-df-snow">CCBill</span>
                  </div>
                  <div>
                    <span className="text-df-fog">Europe:</span>
                    <span className="ml-2 text-df-snow">Epoch</span>
                  </div>
                  <div>
                    <span className="text-df-fog">Latin America:</span>
                    <span className="ml-2 text-df-snow">Vendo</span>
                  </div>
                  <div>
                    <span className="text-df-fog">Global Fallback:</span>
                    <span className="ml-2 text-df-snow">Segpay</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Methods Tab */}
        <TabsContent value="payouts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payout Methods */}
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Payout Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="p-4 border border-df-steel rounded-md"
                      data-testid={`payout-provider-${provider.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-df-snow font-semibold">{provider.name}</h4>
                            {provider.recommended && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-df-gold" />
                                <span className="text-df-gold text-xs">Recommended</span>
                              </div>
                            )}
                          </div>
                          <p className="text-df-fog text-sm">{provider.description}</p>
                        </div>
                        {getStatusBadge(getProviderStatus(provider.id))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-df-fog">
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {provider.processingTime}
                        </div>
                        <div>
                          <DollarSign className="h-3 w-3 inline mr-1" />
                          {provider.fees}
                        </div>
                      </div>

                      {getProviderStatus(provider.id) === "not_connected" && (
                        <Button
                          onClick={() => setPayoutForm(prev => ({ ...prev, provider: provider.id as any }))}
                          size="sm"
                          className="w-full mt-3 btn-outline"
                          data-testid={`button-setup-${provider.id}`}
                        >
                          Setup {provider.name}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Setup Form */}
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  Setup Payout Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="payoutProvider" className="text-df-fog">Payout Provider</Label>
                  <select
                    id="payoutProvider"
                    value={payoutForm.provider}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, provider: e.target.value as any }))}
                    className="w-full bg-df-ink border border-df-steel rounded-md px-3 py-2 text-df-snow mt-1"
                    data-testid="select-payout-provider"
                  >
                    <option value="paxum">Paxum (Recommended)</option>
                    <option value="epayservice">ePayService</option>
                    <option value="wise">Wise</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="accountRef" className="text-df-fog">
                    {payoutForm.provider === "crypto" ? "Wallet Address" : "Account Email/ID"}
                  </Label>
                  <Input
                    id="accountRef"
                    type={payoutForm.provider === "crypto" ? "text" : "email"}
                    value={payoutForm.accountRef}
                    onChange={(e) => setPayoutForm(prev => ({ ...prev, accountRef: e.target.value }))}
                    className="input-df"
                    placeholder={
                      payoutForm.provider === "crypto" 
                        ? "Enter wallet address" 
                        : "Enter account email"
                    }
                    data-testid="input-account-ref"
                  />
                </div>

                {/* KYC Warning */}
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-md p-3">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-yellow-200 text-sm font-medium">KYC Verification Required</p>
                      <p className="text-yellow-100 text-xs">
                        KYC verification is required for payouts over $600 (US legal requirement).
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitPayoutAccount}
                  disabled={createPayoutAccountMutation.isPending || !payoutForm.accountRef.trim()}
                  className="w-full btn-primary"
                  data-testid="button-submit-payout-account"
                >
                  {createPayoutAccountMutation.isPending ? "Setting up..." : "Setup Payout Account"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Balance & Payout Request */}
          <Card className="card-df mt-8">
            <CardHeader>
              <CardTitle className="text-xl glow-text-gold">
                Current Balance & Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Available Balance */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4 text-center">
                  <DollarSign className="h-8 w-8 text-df-gold mx-auto mb-2" />
                  <p className="text-df-fog text-sm">Available Balance</p>
                  <p className="text-3xl font-bold text-df-gold" data-testid="available-balance">$2,134.50</p>
                  <Button
                    onClick={handleRequestPayout}
                    disabled={requestPayoutMutation.isPending || !payoutAccounts?.length}
                    className="w-full mt-3 btn-primary"
                    data-testid="button-request-payout"
                  >
                    {requestPayoutMutation.isPending ? "Processing..." : "Request Payout"}
                  </Button>
                </div>

                {/* Pending Payouts */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4 text-center">
                  <Clock className="h-8 w-8 text-df-cyan mx-auto mb-2" />
                  <p className="text-df-fog text-sm">Pending Payouts</p>
                  <p className="text-3xl font-bold text-df-cyan" data-testid="pending-payouts">$0.00</p>
                  <p className="text-df-fog text-xs mt-2">Next payout: Friday</p>
                </div>

                {/* Total Earnings */}
                <div className="bg-df-ink border border-df-steel rounded-md p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-df-fog text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-400" data-testid="total-earnings">$12,847.25</p>
                  <p className="text-green-400 text-xs mt-2">+12% this month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card className="card-df">
            <CardHeader>
              <CardTitle className="text-xl neon-subheading">
                Payment Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-df-ink border border-df-steel rounded-md p-6 h-48 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-df-cyan mx-auto mb-4" />
                  <p className="text-df-fog">Revenue analytics chart will render here</p>
                  <p className="text-df-fog text-sm">Chart.js integration required</p>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-8">
                <h4 className="text-df-gold font-semibold mb-4">Recent Transactions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-df-ink border border-df-steel rounded-md p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="text-df-snow text-sm font-medium">Subscription Payment</p>
                        <p className="text-df-fog text-xs">2 hours ago • CCBill</p>
                      </div>
                    </div>
                    <span className="text-df-gold font-semibold">+$29.99</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-df-ink border border-df-steel rounded-md p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div>
                        <p className="text-df-snow text-sm font-medium">Premium Content</p>
                        <p className="text-df-fog text-xs">5 hours ago • Segpay</p>
                      </div>
                    </div>
                    <span className="text-df-gold font-semibold">+$49.99</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-df-ink border border-df-steel rounded-md p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <div>
                        <p className="text-df-snow text-sm font-medium">Payout to Paxum</p>
                        <p className="text-df-fog text-xs">1 day ago • Processing</p>
                      </div>
                    </div>
                    <span className="text-df-gold font-semibold">-$1,250.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
