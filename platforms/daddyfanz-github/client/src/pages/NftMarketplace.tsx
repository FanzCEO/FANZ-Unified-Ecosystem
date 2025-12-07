import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Search, Filter, ExternalLink, Coins, Image as ImageIcon } from "lucide-react";

interface MarketplaceNft {
  id: string;
  tokenId: string;
  blockchain: string;
  mintPrice: string;
  mintPriceUsd: string;
  status: string;
  mintedAt: string;
  ownerId: string | null;
  creator: {
    id: string;
    username: string;
    displayName: string;
  };
  media: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    mediaUrl: string;
    mediaType: string;
  };
  contract: {
    id: string;
    blockchain: string;
    contractAddress: string;
    royaltyPercentage: string;
  };
}

export default function NftMarketplace() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [blockchainFilter, setBlockchainFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [selectedNft, setSelectedNft] = useState<MarketplaceNft | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);

  const { data: nfts, isLoading } = useQuery<MarketplaceNft[]>({
    queryKey: ["/api/nft/marketplace"],
    enabled: isAuthenticated,
  });

  // Filter and sort NFTs
  const filteredNfts = nfts
    ?.filter((nft) => {
      const matchesSearch =
        searchQuery === "" ||
        nft.media.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.creator.displayName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBlockchain =
        blockchainFilter === "all" || nft.contract.blockchain.toLowerCase() === blockchainFilter.toLowerCase();
      return matchesSearch && matchesBlockchain;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return parseFloat(a.mintPriceUsd || "0") - parseFloat(b.mintPriceUsd || "0");
      } else if (sortBy === "price-desc") {
        return parseFloat(b.mintPriceUsd || "0") - parseFloat(a.mintPriceUsd || "0");
      } else {
        return new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime();
      }
    });

  const purchaseMutation = useMutation({
    mutationFn: async (nftId: string) => {
      // Simulate blockchain purchase
      const response = await apiRequest("POST", "/api/nft/purchase", { nftId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nft/marketplace"] });
      toast({
        title: "Success",
        description: "NFT purchased successfully!",
      });
      setPurchaseDialogOpen(false);
      setSelectedNft(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to purchase NFT",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = () => {
    if (selectedNft) {
      purchaseMutation.mutate(selectedNft.id);
    }
  };

  const getBlockchainExplorerUrl = (blockchain: string, address: string) => {
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/address/${address}`,
      polygon: `https://polygonscan.com/address/${address}`,
      solana: `https://solscan.io/account/${address}`,
      binance: `https://bscscan.com/address/${address}`,
    };
    return explorers[blockchain.toLowerCase()] || "#";
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-df-ink">
        <Card className="w-full max-w-md bg-df-steel border-df-steel">
          <CardHeader>
            <CardTitle className="text-df-gold">NFT Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-df-fog">Please log in to browse the NFT marketplace.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-df-ink p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-df-snow mb-2">NFT Marketplace</h1>
          <p className="text-df-fog">Discover and collect exclusive creator NFTs on blockchain</p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-df-steel border-df-steel">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-df-fog" />
                  <Input
                    placeholder="Search NFTs or creators..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-df-ink border-df-steel text-df-snow"
                    data-testid="input-search-nft"
                  />
                </div>
              </div>

              {/* Blockchain Filter */}
              <Select value={blockchainFilter} onValueChange={setBlockchainFilter}>
                <SelectTrigger className="bg-df-ink border-df-steel text-df-snow" data-testid="select-blockchain-filter">
                  <SelectValue placeholder="All Blockchains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blockchains</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="binance">Binance Smart Chain</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-df-ink border-df-steel text-df-snow" data-testid="select-sort">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* NFT Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-df-cyan"></div>
          </div>
        ) : filteredNfts && filteredNfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNfts.map((nft) => (
              <Card
                key={nft.id}
                className="bg-df-steel border-df-steel hover:border-df-cyan transition-colors cursor-pointer group"
                data-testid={`card-nft-${nft.id}`}
              >
                <CardContent className="p-4">
                  {/* NFT Image */}
                  <div className="aspect-square bg-df-ink rounded-lg mb-4 overflow-hidden relative">
                    {nft.media.thumbnailUrl ? (
                      <img
                        src={nft.media.thumbnailUrl}
                        alt={nft.media.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-df-fog" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 bg-df-ink/80 text-df-cyan border-df-cyan">
                      {nft.contract.blockchain}
                    </Badge>
                  </div>

                  {/* NFT Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-df-snow truncate" data-testid={`text-nft-title-${nft.id}`}>
                      {nft.media.title}
                    </h3>
                    <p className="text-sm text-df-fog truncate">
                      by {nft.creator.displayName || nft.creator.username}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-df-fog">Price</p>
                        <p className="text-lg font-bold text-df-gold" data-testid={`text-price-${nft.id}`}>
                          ${nft.mintPriceUsd || "0.00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-df-fog">Token ID</p>
                        <p className="text-sm text-df-snow">#{nft.tokenId}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    {nft.ownerId ? (
                      <Button
                        disabled
                        className="flex-1 bg-df-fog text-df-ink cursor-not-allowed"
                        data-testid={`button-sold-${nft.id}`}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        {nft.ownerId === user?.id ? "Owned" : "Sold"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedNft(nft);
                          setPurchaseDialogOpen(true);
                        }}
                        className="flex-1 bg-df-cyan hover:bg-df-cyan/80 text-df-ink"
                        data-testid={`button-purchase-${nft.id}`}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(getBlockchainExplorerUrl(nft.contract.blockchain, nft.contract.contractAddress), "_blank")}
                      className="border-df-cyan text-df-cyan hover:bg-df-cyan hover:text-df-ink"
                      data-testid={`button-view-contract-${nft.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Coins className="mx-auto h-16 w-16 text-df-fog mb-4" />
            <p className="text-df-fog text-lg">No NFTs found</p>
            <p className="text-sm text-df-fog mt-2">
              {searchQuery || blockchainFilter !== "all"
                ? "Try adjusting your filters"
                : "Check back later for new listings"}
            </p>
          </div>
        )}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent className="bg-df-steel border-df-steel">
          <DialogHeader>
            <DialogTitle className="text-df-gold">Purchase NFT</DialogTitle>
          </DialogHeader>
          {selectedNft && (
            <div className="space-y-4">
              <div className="aspect-video bg-df-ink rounded-lg overflow-hidden">
                {selectedNft.media.thumbnailUrl ? (
                  <img
                    src={selectedNft.media.thumbnailUrl}
                    alt={selectedNft.media.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-df-fog" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-df-snow">{selectedNft.media.title}</h3>
                <p className="text-df-fog">by {selectedNft.creator.displayName || selectedNft.creator.username}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-df-ink rounded-lg">
                <div>
                  <p className="text-xs text-df-fog">Price</p>
                  <p className="text-2xl font-bold text-df-gold">${selectedNft.mintPriceUsd || "0.00"}</p>
                </div>
                <div>
                  <p className="text-xs text-df-fog">Blockchain</p>
                  <Badge className="mt-1 bg-df-cyan text-df-ink">{selectedNft.contract.blockchain}</Badge>
                </div>
              </div>
              <p className="text-sm text-df-fog">{selectedNft.media.description || "No description available"}</p>
              <div className="flex items-center gap-2 text-xs text-df-fog">
                <span>Contract:</span>
                <code className="text-df-cyan">{selectedNft.contract.contractAddress.slice(0, 10)}...</code>
                <span>Royalty: {selectedNft.contract.royaltyPercentage}%</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchaseDialogOpen(false)}
              className="border-df-steel text-df-fog"
              data-testid="button-cancel-purchase"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending}
              className="bg-df-cyan hover:bg-df-cyan/80 text-df-ink"
              data-testid="button-confirm-purchase"
            >
              {purchaseMutation.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
