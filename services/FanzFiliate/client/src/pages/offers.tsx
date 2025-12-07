import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Offer } from "@shared/schema";

export default function Offers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
  });

  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="p-6 space-y-6" data-testid="offers-page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Offers</h2>
          <p className="text-muted-foreground">Browse and manage available offers</p>
        </div>
        <Button className="neon-glow" data-testid="create-offer">
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      <Card className="gradient-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Offers</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search offers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-border w-64"
                  data-testid="offers-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-secondary border-border" data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="border-border" data-testid="advanced-filter">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading offers...</div>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "No offers match your filters" : "No offers available"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <div 
                  key={offer.id} 
                  className="border border-border rounded-lg p-4 data-row"
                  data-testid={`offer-card-${offer.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-lg">{offer.name}</h4>
                        <Badge 
                          className={
                            offer.status === 'approved' ? 'bg-accent text-accent-foreground' :
                            offer.status === 'in_review' ? 'bg-chart-3 text-background' :
                            offer.status === 'paused' ? 'bg-muted text-muted-foreground' :
                            'bg-secondary text-secondary-foreground'
                          }
                        >
                          {offer.status}
                        </Badge>
                        {offer.isAdultContent && (
                          <Badge className="bg-chart-2 text-background">18+</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{offer.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Payout:</span>
                          <p className="font-medium text-primary">${offer.payoutAmount} {offer.conversionType}</p>
                        </div>
                        {offer.conversionRate && (
                          <div>
                            <span className="text-muted-foreground">CR:</span>
                            <p className="font-medium">{offer.conversionRate}%</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Geos:</span>
                          <p className="font-medium">
                            {offer.allowedGeos && offer.allowedGeos.includes("*") ? "Worldwide" : 
                             offer.allowedGeos?.slice(0, 3).join(", ") || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Traffic:</span>
                          <p className="font-medium">
                            {offer.allowedTrafficTypes?.slice(0, 2).join(", ") || "All types"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-border">
                        Details
                      </Button>
                      {offer.status === 'approved' && (
                        <Button size="sm" className="neon-glow">
                          Get Link
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
