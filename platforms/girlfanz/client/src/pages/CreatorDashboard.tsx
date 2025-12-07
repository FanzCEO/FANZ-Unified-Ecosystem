import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Users, Eye, Calendar, CreditCard, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EarningsSummary {
  totalEarnings: number;
  averageMonthly: number;
  lastPayout: any;
  pendingEarnings: number;
  payoutHistory: any[];
}

export function CreatorDashboard() {
  const { toast } = useToast();

  const { data: earnings, isLoading: earningsLoading } = useQuery<EarningsSummary>({
    queryKey: ['/api/payouts/earnings'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleRequestPayout = async () => {
    try {
      const response = await fetch('/api/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: earnings?.pendingEarnings || 0,
          payoutAccountId: 'default'
        })
      });

      if (response.ok) {
        toast({
          title: "Payout Requested",
          description: "Your payout request has been submitted for processing.",
        });
      } else {
        throw new Error('Failed to request payout');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request payout. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (earningsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ghostly Background */}
      <div 
        className="fixed inset-0 opacity-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><defs><radialGradient id=\"g\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0%\" stop-color=\"%23ff00ff\" stop-opacity=\"0.3\"/><stop offset=\"100%\" stop-color=\"%2300ffff\" stop-opacity=\"0.1\"/></radialGradient></defs><rect width=\"100%\" height=\"100%\" fill=\"url(%23g)\"/></svg>')"
        }}
      />
      
      <div className="relative container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Creator Dashboard
          </h1>
          <p className="text-gray-400">Monitor your earnings, content performance, and manage your creator profile</p>
        </div>

        {/* Earnings Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-pink-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${((earnings?.totalEarnings || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Payout</CardTitle>
              <CreditCard className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${((earnings?.pendingEarnings || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">Available for payout</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Monthly Average</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${((earnings?.averageMonthly || 0) / 100).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">Last 12 months</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Last Payout</CardTitle>
              <Calendar className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {earnings?.lastPayout ? 'Recent' : 'None'}
              </div>
              <p className="text-xs text-gray-500">Previous payment</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="earnings" className="space-y-6">
          <TabsList className="bg-gray-900/50 border-gray-800">
            <TabsTrigger value="earnings" data-testid="tab-earnings">
              <DollarSign className="h-4 w-4 mr-2" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">
              <Eye className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">
              <Shield className="h-4 w-4 mr-2" />
              Compliance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-6">
            {/* Payout Request */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Request Payout</CardTitle>
                <CardDescription className="text-gray-400">
                  Request a payout of your available earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Available Balance:</span>
                  <span className="text-xl font-bold text-white">
                    ${((earnings?.pendingEarnings || 0) / 100).toFixed(2)}
                  </span>
                </div>
                
                <Button 
                  onClick={handleRequestPayout}
                  disabled={(earnings?.pendingEarnings || 0) < 5000} // $50 minimum
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  data-testid="button-request-payout"
                >
                  {(earnings?.pendingEarnings || 0) < 5000 ? 
                    'Minimum $50.00 required' : 
                    'Request Payout'
                  }
                </Button>
                
                <div className="text-xs text-gray-500">
                  Payouts are processed on the 1st of each month via adult-friendly processors (Paxum, eCP, etc.)
                </div>
              </CardContent>
            </Card>

            {/* Payout History */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Payout History</CardTitle>
                <CardDescription className="text-gray-400">
                  Your recent payout transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {earnings?.payoutHistory && earnings.payoutHistory.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.payoutHistory.map((payout, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-white">
                              ${(payout.amount / 100).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No payout history yet</p>
                    <p className="text-sm">Start creating content to earn your first payout</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Content Performance</CardTitle>
                <CardDescription className="text-gray-400">
                  Track your content metrics and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Content analytics coming soon</p>
                  <p className="text-sm">View detailed performance metrics for your posts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-green-400" />
                  Compliance Status
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Maintain your platform compliance and verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age Verification */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div>
                      <p className="font-medium text-white">Age Verification</p>
                      <p className="text-sm text-gray-400">Verified via VerifyMy</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Verified</Badge>
                </div>

                {/* Identity Verification */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div>
                      <p className="font-medium text-white">Identity Verification</p>
                      <p className="text-sm text-gray-400">Government ID verified</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Verified</Badge>
                </div>

                {/* 2257 Compliance */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                    <div>
                      <p className="font-medium text-white">2257 Compliance</p>
                      <p className="text-sm text-gray-400">Record keeping compliant</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>

                {/* Content Protection */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <p className="font-medium text-white">Content Protection</p>
                      <p className="text-sm text-gray-400">Forensic fingerprinting enabled</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">Protected</Badge>
                </div>

                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-300">Compliance Information</p>
                      <p className="text-xs text-blue-400 mt-1">
                        GirlFanz maintains full compliance with 18 U.S.C. §2257 record keeping requirements 
                        and all applicable adult content regulations. All content is protected with forensic 
                        watermarking for copyright protection.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}