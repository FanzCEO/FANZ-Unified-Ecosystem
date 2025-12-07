import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserBalance } from "@shared/schema";

export default function PayoutInfo() {
  const { data: balance, isLoading } = useQuery<UserBalance>({
    queryKey: ["/api/balance/aff-1"],
  });

  const handleRequestPayout = () => {
    console.log("Request payout functionality would be implemented here");
  };

  if (isLoading) {
    return (
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Payout Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Payout Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Unable to load balance information
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card border-border" data-testid="payout-info">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payout Status
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
            100% Yours
          </span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          No platform fees • Creator-controlled payouts
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Available Balance:</span>
          <span className="font-medium neon-text" data-testid="available-balance">
            ${parseFloat(balance.availableBalance).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pending:</span>
          <span className="font-medium" data-testid="pending-balance">
            ${parseFloat(balance.pendingBalance).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Method:</span>
          <span className="font-medium">Paxum</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Next Payout:</span>
          <span className="font-medium">Weekly (Friday)</span>
        </div>
        
        <Button 
          className="w-full mt-4 neon-glow hover:opacity-90"
          onClick={handleRequestPayout}
          data-testid="request-payout-button"
        >
          Request Payout
        </Button>
      </CardContent>
    </Card>
  );
}
