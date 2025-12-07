import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Offer } from "@shared/schema";

export default function OfferMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers", "approved", "true"],
    queryFn: async () => {
      const response = await fetch("/api/offers?status=approved&isActive=true");
      if (!response.ok) throw new Error("Failed to fetch offers");
      return response.json();
    },
  });

  const filteredOffers = offers?.filter(offer =>
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Card className="lg:col-span-2 gradient-card border-border">
        <CardHeader>
          <CardTitle>Available Offers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-64 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2 gradient-card border-border" data-testid="offer-marketplace">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Available Offers</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border"
                data-testid="offer-search"
              />
            </div>
            <Button size="sm" className="neon-glow" data-testid="filter-offers">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredOffers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "No offers match your search criteria" : "No approved offers available"}
          </div>
        ) : (
          filteredOffers.map((offer) => (
            <div 
              key={offer.id} 
              className="border border-border rounded-lg p-4 data-row"
              data-testid={`offer-${offer.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{offer.name}</h4>
                    {offer.conversionRate && parseFloat(offer.conversionRate) > 3 && (
                      <Badge className="bg-accent text-accent-foreground">Hot</Badge>
                    )}
                    {offer.isAdultContent && (
                      <Badge className="bg-chart-2 text-background">18+</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{offer.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-primary font-medium">
                      ${offer.payoutAmount} {offer.conversionType}
                    </span>
                    {offer.conversionRate && (
                      <span className="text-muted-foreground">
                        • CR: {offer.conversionRate}%
                      </span>
                    )}
                    {offer.allowedGeos && offer.allowedGeos.length > 0 && (
                      <span className="text-muted-foreground">
                        • GEO: {offer.allowedGeos.includes("*") ? "Worldwide" : offer.allowedGeos.join(", ")}
                      </span>
                    )}
                    {offer.allowedTrafficTypes && offer.allowedTrafficTypes.includes("adult") && (
                      <span className="text-muted-foreground">• Adult Traffic OK</span>
                    )}
                  </div>
                </div>
                <Button className="neon-glow hover:opacity-90" data-testid={`get-link-${offer.id}`}>
                  Get Link
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
