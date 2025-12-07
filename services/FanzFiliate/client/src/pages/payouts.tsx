import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import type { UserBalance, Payout } from "@shared/schema";

export default function Payouts() {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("paxum");

  const { data: balance } = useQuery<UserBalance>({
    queryKey: ["/api/balance/aff-1"],
  });

  const { data: payouts } = useQuery<Payout[]>({
    queryKey: ["/api/payouts/aff-1"],
  });

  const handleRequestPayout = () => {
    console.log("Requesting payout:", { amount: payoutAmount, method: payoutMethod });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-accent" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-chart-3" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-muted text-muted-foreground",
      processing: "bg-chart-3 text-background",
      sent: "bg-accent text-accent-foreground",
      failed: "bg-destructive text-destructive-foreground",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6" data-testid="payouts-page">
      <div>
        <h2 className="text-2xl font-bold">Payouts</h2>
        <p className="text-muted-foreground">Manage your earnings and withdrawal requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Balance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Available Balance</p>
              <p className="text-2xl font-bold neon-text" data-testid="available-balance">
                ${balance ? parseFloat(balance.availableBalance).toFixed(2) : "0.00"}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending:</span>
                <span data-testid="pending-balance">
                  ${balance ? parseFloat(balance.pendingBalance).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Earned:</span>
                <span className="font-medium" data-testid="total-earnings">
                  ${balance ? parseFloat(balance.totalEarnings).toFixed(2) : "0.00"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 gradient-card border-border">
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payout-amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="payout-amount"
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="pl-10"
                  data-testid="payout-amount-input"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum payout: $50.00
              </p>
            </div>

            <div>
              <Label htmlFor="payout-method">Payment Method</Label>
              <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                <SelectTrigger data-testid="payout-method-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paxum">Paxum (2-3 business days)</SelectItem>
                  <SelectItem value="cosmopayment">CosmoPayment (1-2 business days)</SelectItem>
                  <SelectItem value="bitsafe">Bitsafe (Same day)</SelectItem>
                  <SelectItem value="usdt">USDT TRC20 (Within 24 hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Payout Terms</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Minimum payout amount: $50.00</li>
                <li>• Processing fee varies by payment method</li>
                <li>• Payouts processed weekly on Fridays</li>
                <li>• 14-day hold period for new affiliates</li>
              </ul>
            </div>

            <Button 
              className="w-full neon-glow" 
              onClick={handleRequestPayout}
              disabled={!payoutAmount || parseFloat(payoutAmount) < 50}
              data-testid="request-payout-submit"
            >
              Request Payout
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {!payouts || payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payout history available
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Method</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mock data for demonstration */}
                  <tr className="border-b border-border data-row">
                    <td className="py-3 px-4">Dec 08, 2024</td>
                    <td className="py-3 px-4 font-medium text-primary">$500.00</td>
                    <td className="py-3 px-4">Paxum</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('sent')}
                        {getStatusBadge('sent')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">PAX-2024120801</td>
                  </tr>
                  <tr className="border-b border-border data-row">
                    <td className="py-3 px-4">Dec 01, 2024</td>
                    <td className="py-3 px-4 font-medium text-primary">$750.00</td>
                    <td className="py-3 px-4">USDT</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('processing')}
                        {getStatusBadge('processing')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
