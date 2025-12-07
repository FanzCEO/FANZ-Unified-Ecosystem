import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Coins, FileCode, TrendingUp, Plus, ExternalLink, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface NftContract {
  id: string;
  creatorId: string;
  blockchain: string;
  contractAddress: string;
  royaltyPercentage: number;
  _count?: {
    mints: number;
  };
}

interface RoyaltyStats {
  totalRoyaltyAmount: string;
  totalSales: number;
}

interface MediaAsset {
  id: string;
  title: string;
  mimeType: string;
}

const deployContractSchema = z.object({
  blockchain: z.enum(["ethereum", "polygon", "solana", "binance"]),
  contractAddress: z.string().min(1, "Contract address is required"),
  royaltyPercentage: z.coerce.number().min(0).max(50, "Royalty must be between 0-50%"),
});

const mintNftSchema = z.object({
  contractId: z.string().min(1, "Contract is required"),
  mediaId: z.string().min(1, "Media asset is required"),
  tokenId: z.string().min(1, "Token ID is required"),
});

export default function NftDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please log in to access NFT Dashboard",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const isCreator = user?.role === "creator" || user?.role === "admin";

  const { data: contracts, isLoading: contractsLoading } = useQuery<NftContract[]>({
    queryKey: [`/api/nft/contracts/${user?.id}`],
    enabled: isAuthenticated && isCreator && !!user?.id,
  });

  const { data: royaltyStats } = useQuery<RoyaltyStats>({
    queryKey: [`/api/nft/royalties/stats/${user?.id}`],
    enabled: isAuthenticated && isCreator && !!user?.id,
  });

  const { data: mediaAssets } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media"],
    enabled: isAuthenticated && isCreator,
  });

  const { data: royalties } = useQuery<any[]>({
    queryKey: [`/api/nft/royalties/${user?.id}`],
    enabled: isAuthenticated && isCreator && !!user?.id,
  });

  // Get all minted NFTs for contracts with mints
  const contractsWithMints = contracts?.filter(c => c._count && c._count.mints > 0) || [];
  const { data: allMints } = useQuery<any[]>({
    queryKey: [`/api/nft/mints/all/${user?.id}`],
    queryFn: async () => {
      // Fetch mints for all contracts
      const mintsPromises = contractsWithMints.map(contract =>
        fetch(`/api/nft/mints/${contract.id}`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }).then(res => res.json()).then(mints => ({
          contractId: contract.id,
          mints: Array.isArray(mints) ? mints : []
        }))
      );
      const results = await Promise.all(mintsPromises);
      return results;
    },
    enabled: isAuthenticated && isCreator && contractsWithMints.length > 0,
  });

  const deployForm = useForm({
    resolver: zodResolver(deployContractSchema),
    defaultValues: {
      blockchain: "ethereum" as const,
      contractAddress: "",
      royaltyPercentage: 10,
    },
  });

  const mintForm = useForm({
    resolver: zodResolver(mintNftSchema),
    defaultValues: {
      contractId: "",
      mediaId: "",
      tokenId: "",
    },
  });

  const deployContractMutation = useMutation({
    mutationFn: async (data: z.infer<typeof deployContractSchema>) => {
      const response = await apiRequest("POST", "/api/nft/deploy-contract", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nft/contracts/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/nft/mints/all/${user?.id}`] });
      toast({
        title: "Success",
        description: "NFT contract deployed successfully",
      });
      setDeployDialogOpen(false);
      deployForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deploy contract",
        variant: "destructive",
      });
    },
  });

  const mintNftMutation = useMutation({
    mutationFn: async (data: z.infer<typeof mintNftSchema>) => {
      const response = await apiRequest("POST", "/api/nft/mint", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/nft/contracts/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/nft/mints/all/${user?.id}`] });
      toast({
        title: "Success",
        description: "NFT minted successfully",
      });
      setMintDialogOpen(false);
      mintForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mint NFT",
        variant: "destructive",
      });
    },
  });

  if (isLoading || contractsLoading) {
    return (
      <div className="min-h-screen bg-df-dungeon flex items-center justify-center">
        <div className="text-xl neon-heading">Loading NFT Dashboard...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-df-dungeon">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="card-df">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="mx-auto h-12 w-12 text-df-fog mb-4" />
                <h3 className="text-xl font-semibold text-df-snow mb-2">Creator Access Required</h3>
                <p className="text-df-fog">NFT Dashboard is only available for creators</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const totalRoyalties = royaltyStats?.totalRoyaltyAmount || "0";
  const totalSales = royaltyStats?.totalSales || 0;

  return (
    <div className="min-h-screen bg-df-dungeon">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-df-snow mb-2">
            <span className="neon-heading">NFT Dashboard</span>
          </h1>
          <p className="text-df-fog">
            Mint your content as NFTs and earn perpetual royalties
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-df">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-df-fog">Total Royalties</CardTitle>
              <TrendingUp className="h-4 w-4 text-df-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-df-cyan" data-testid="text-total-royalties">{totalRoyalties} ETH</div>
              <p className="text-xs text-df-fog mt-1">From {totalSales} sales</p>
            </CardContent>
          </Card>

          <Card className="card-df">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-df-fog">Active Contracts</CardTitle>
              <FileCode className="h-4 w-4 text-df-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-df-gold" data-testid="text-contract-count">{contracts?.length || 0}</div>
              <p className="text-xs text-df-fog mt-1">Deployed on blockchain</p>
            </CardContent>
          </Card>

          <Card className="card-df">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-df-fog">Total Mints</CardTitle>
              <Coins className="h-4 w-4 text-df-cyan" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-df-cyan" data-testid="text-total-mints">
                {contracts?.reduce((sum: number, c: any) => sum + (c._count?.mints || 0), 0) || 0}
              </div>
              <p className="text-xs text-df-fog mt-1">NFTs minted</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="card-df">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl neon-subheading">Smart Contracts</CardTitle>
                  <CardDescription className="text-df-fog mt-1">
                    Deploy and manage your NFT contracts
                  </CardDescription>
                </div>
                <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary" data-testid="button-deploy-contract">
                      <Plus className="mr-2 h-4 w-4" />
                      Deploy Contract
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-df-ink border-df-steel">
                    <DialogHeader>
                      <DialogTitle className="text-df-snow">Deploy NFT Contract</DialogTitle>
                      <DialogDescription className="text-df-fog">
                        Deploy a new smart contract for your NFTs
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...deployForm}>
                      <form onSubmit={deployForm.handleSubmit((data) => deployContractMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={deployForm.control}
                          name="blockchain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-df-snow">Blockchain</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="input-df" data-testid="select-blockchain">
                                    <SelectValue placeholder="Select blockchain" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-df-ink border-df-steel">
                                  <SelectItem value="ethereum">Ethereum</SelectItem>
                                  <SelectItem value="polygon">Polygon</SelectItem>
                                  <SelectItem value="solana">Solana</SelectItem>
                                  <SelectItem value="binance">Binance Smart Chain</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deployForm.control}
                          name="contractAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-df-snow">Contract Address</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-df" placeholder="0x..." data-testid="input-contract-address" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={deployForm.control}
                          name="royaltyPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-df-snow">Royalty Percentage (0-50%)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min="0" max="50" className="input-df" data-testid="input-royalty-percentage" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="btn-primary w-full" disabled={deployContractMutation.isPending} data-testid="button-submit-deploy">
                          {deployContractMutation.isPending ? "Deploying..." : "Deploy Contract"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contracts && contracts.length > 0 ? (
                <div className="space-y-4">
                  {contracts.map((contract: any) => (
                    <div key={contract.id} className="border border-df-steel rounded-lg p-4" data-testid={`card-contract-${contract.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-df-gold font-semibold">{contract.blockchain}</span>
                            <span className="text-xs bg-df-steel px-2 py-1 rounded text-df-fog">
                              {contract.royaltyPercentage}% royalty
                            </span>
                          </div>
                          <p className="text-sm text-df-fog font-mono break-all">{contract.contractAddress}</p>
                          <p className="text-xs text-df-fog mt-2">{contract._count?.mints || 0} NFTs minted</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-df-cyan hover:text-df-gold"
                          data-testid={`button-view-contract-${contract.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileCode className="mx-auto h-12 w-12 text-df-fog mb-4" />
                  <p className="text-df-fog">No contracts deployed yet</p>
                  <p className="text-sm text-df-fog mt-2">Deploy your first NFT contract to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-df">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl neon-subheading">Mint NFTs</CardTitle>
                  <CardDescription className="text-df-fog mt-1">
                    Turn your content into NFTs
                  </CardDescription>
                </div>
                <Dialog open={mintDialogOpen} onOpenChange={setMintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="btn-primary" 
                      disabled={!contracts || contracts.length === 0}
                      data-testid="button-mint-nft"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Mint NFT
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-df-ink border-df-steel">
                    <DialogHeader>
                      <DialogTitle className="text-df-snow">Mint NFT</DialogTitle>
                      <DialogDescription className="text-df-fog">
                        Mint your content as an NFT
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...mintForm}>
                      <form onSubmit={mintForm.handleSubmit((data) => mintNftMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={mintForm.control}
                          name="contractId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-df-snow">Contract</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="input-df" data-testid="select-contract">
                                    <SelectValue placeholder="Select contract" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-df-ink border-df-steel">
                                  {contracts?.map((contract: any) => (
                                    <SelectItem key={contract.id} value={contract.id}>
                                      {contract.blockchain} - {contract.contractAddress.slice(0, 10)}...
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mintForm.control}
                          name="mediaId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-df-snow">Media Asset</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="input-df" data-testid="select-media">
                                    <SelectValue placeholder="Select media" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-df-ink border-df-steel">
                                  {mediaAssets?.map((media: any) => (
                                    <SelectItem key={media.id} value={media.id}>
                                      {media.title || 'Untitled'} ({media.mimeType})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={mintForm.control}
                          name="tokenId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-df-snow">Token ID</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-df" placeholder="1" data-testid="input-token-id" />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="btn-primary w-full" disabled={mintNftMutation.isPending} data-testid="button-submit-mint">
                          {mintNftMutation.isPending ? "Minting..." : "Mint NFT"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {allMints && allMints.length > 0 ? (
                <div className="space-y-4">
                  {allMints.map((contractMints: any) => {
                    const contract = contracts?.find(c => c.id === contractMints.contractId);
                    if (!contract || !contractMints.mints || contractMints.mints.length === 0) return null;
                    
                    return (
                      <div key={contract.id} className="border border-df-steel rounded-lg p-4" data-testid={`section-mints-${contract.id}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-df-gold font-semibold">{contract.blockchain}</span>
                          <span className="text-xs text-df-fog">{contractMints.mints.length} minted</span>
                        </div>
                        <div className="space-y-2">
                          {contractMints.mints.map((mint: any) => (
                            <div 
                              key={mint.id} 
                              className="flex items-center justify-between py-2 px-3 bg-df-ink/30 rounded"
                              data-testid={`item-mint-${mint.id}`}
                            >
                              <div>
                                <p className="text-sm text-df-snow">Token #{mint.tokenId}</p>
                                <p className="text-xs text-df-fog">{mint.media?.title || 'Untitled NFT'}</p>
                              </div>
                              <div className="text-xs text-df-fog">
                                {new Date(mint.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="mx-auto h-12 w-12 text-df-fog mb-4" />
                  <p className="text-df-fog">No NFTs minted yet</p>
                  <p className="text-sm text-df-fog mt-2">
                    {contracts && contracts.length > 0 
                      ? "Mint your first NFT to get started"
                      : "Deploy a contract first to mint NFTs"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {royalties && royalties.length > 0 && (
          <Card className="card-df mt-8">
            <CardHeader>
              <CardTitle className="text-xl neon-subheading">Royalty History</CardTitle>
              <CardDescription className="text-df-fog mt-1">
                Track your NFT secondary sales royalties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-df-steel">
                      <th className="text-left py-3 px-4 text-sm font-medium text-df-fog">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-df-fog">Contract</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-df-fog">Sale Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-df-fog">Royalty</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-df-fog">Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {royalties.map((royalty: any) => (
                      <tr key={royalty.id} className="border-b border-df-steel/50" data-testid={`row-royalty-${royalty.id}`}>
                        <td className="py-3 px-4 text-sm text-df-snow">
                          {new Date(royalty.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-df-fog font-mono">
                          {royalty.contract?.contractAddress?.slice(0, 10)}...
                        </td>
                        <td className="py-3 px-4 text-sm text-df-cyan">
                          {royalty.salePrice} ETH
                        </td>
                        <td className="py-3 px-4 text-sm text-df-gold font-semibold">
                          {royalty.royaltyAmount} ETH
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <a
                            href={`https://etherscan.io/tx/${royalty.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-df-cyan hover:text-df-gold transition-colors"
                            data-testid={`link-tx-${royalty.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
