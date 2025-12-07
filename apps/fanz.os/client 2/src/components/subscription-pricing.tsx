import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Crown,
  Sparkles,
  Star,
  Gift,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Zap,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Info,
  Percent,
  Timer,
  CreditCard,
  Shield,
  Award,
  Heart,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Save,
  RotateCcw,
  Settings,
  Tag,
  Users,
  Gem,
  Trophy,
  Target,
  Flame,
  BellRing,
  Ticket
} from "lucide-react";

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  billingPeriod: "daily" | "3-day" | "weekly" | "monthly" | "quarterly" | "yearly";
  features: string[];
  isPopular?: boolean;
  isLimited?: boolean;
  promotion?: {
    type: "discount" | "trial" | "bonus";
    value: number;
    endsAt: string;
    autoRevert: boolean;
  };
  perks: {
    customRequests: boolean;
    priorityMessages: boolean;
    exclusiveContent: boolean;
    liveStreamAccess: boolean;
    merchandiseDiscount: number;
    customVideos: boolean;
    phoneCallAccess: boolean;
  };
  maxSubscribers?: number;
  currentSubscribers?: number;
}

interface SubscriptionBundle {
  months: number;
  discount: number;
  savings: number;
  mostPopular?: boolean;
}

interface SubscriptionPricingProps {
  creatorId?: string;
  isCreatorView?: boolean;
  onSubscribe?: (tierId: string, bundleMonths?: number) => void;
}

export default function SubscriptionPricing({ 
  creatorId, 
  isCreatorView = false,
  onSubscribe 
}: SubscriptionPricingProps) {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState<string>("monthly");
  const [selectedBundle, setSelectedBundle] = useState<number>(1);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionType, setPromotionType] = useState<"discount" | "trial" | "bonus">("discount");
  const [promotionValue, setPromotionValue] = useState(20);
  const [promotionDuration, setPromotionDuration] = useState(7);
  const [autoRevert, setAutoRevert] = useState(true);
  const [customPrice, setCustomPrice] = useState<{ [key: string]: number }>({
    daily: 4.99,
    "3-day": 12.99,
    weekly: 24.99,
    monthly: 49.99,
    quarterly: 129.99,
    yearly: 399.99
  });

  // Fetch subscription tiers
  const { data: tiers, isLoading } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/subscription-tiers", creatorId],
  });

  // Mock data for demonstration
  const mockTiers: SubscriptionTier[] = tiers || [
    {
      id: "free",
      name: "Free Tier",
      price: 0,
      billingPeriod: "monthly",
      features: [
        "Access to free posts",
        "Like and comment",
        "Follow creators",
        "Basic chat"
      ],
      perks: {
        customRequests: false,
        priorityMessages: false,
        exclusiveContent: false,
        liveStreamAccess: false,
        merchandiseDiscount: 0,
        customVideos: false,
        phoneCallAccess: false
      }
    },
    {
      id: "vip",
      name: "VIP Access",
      price: 9.99,
      originalPrice: 14.99,
      billingPeriod: "monthly",
      features: [
        "All free tier features",
        "Exclusive content access",
        "Priority messaging",
        "Live stream access",
        "10% merch discount",
        "Monthly bonus content"
      ],
      isPopular: true,
      promotion: {
        type: "discount",
        value: 33,
        endsAt: "2024-02-01",
        autoRevert: true
      },
      perks: {
        customRequests: true,
        priorityMessages: true,
        exclusiveContent: true,
        liveStreamAccess: true,
        merchandiseDiscount: 10,
        customVideos: false,
        phoneCallAccess: false
      }
    },
    {
      id: "premium",
      name: "Premium Elite",
      price: 29.99,
      billingPeriod: "monthly",
      features: [
        "All VIP features",
        "Custom content requests",
        "1-on-1 video calls",
        "25% merch discount",
        "Early access to new content",
        "Exclusive Discord access",
        "Birthday special content"
      ],
      isLimited: true,
      maxSubscribers: 100,
      currentSubscribers: 87,
      perks: {
        customRequests: true,
        priorityMessages: true,
        exclusiveContent: true,
        liveStreamAccess: true,
        merchandiseDiscount: 25,
        customVideos: true,
        phoneCallAccess: true
      }
    }
  ];

  const bundles: SubscriptionBundle[] = [
    { months: 1, discount: 0, savings: 0 },
    { months: 3, discount: 10, savings: 14.99, mostPopular: true },
    { months: 6, discount: 20, savings: 59.94 },
    { months: 12, discount: 30, savings: 179.88 }
  ];

  // Update tier pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/creator/subscription-pricing`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-tiers"] });
      toast({
        title: "Pricing updated",
        description: "Your subscription pricing has been updated successfully",
      });
    }
  });

  // Create promotion mutation
  const createPromotionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/creator/promotions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription-tiers"] });
      setShowPromotion(false);
      toast({
        title: "Promotion created",
        description: "Your promotion is now active",
      });
    }
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ tierId, months }: { tierId: string; months: number }) => {
      const response = await apiRequest("POST", `/api/subscriptions/subscribe`, {
        tierId,
        months,
        creatorId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      toast({
        title: "Subscription successful",
        description: "You are now subscribed!",
      });
      if (onSubscribe) {
        onSubscribe(selectedTier, selectedBundle);
      }
    }
  });

  const calculatePrice = (basePrice: number, months: number, discount: number) => {
    const total = basePrice * months;
    const discountAmount = (total * discount) / 100;
    return (total - discountAmount).toFixed(2);
  };

  const getPeriodLabel = (period: string) => {
    switch(period) {
      case "daily": return "per day";
      case "3-day": return "per 3 days";
      case "weekly": return "per week";
      case "monthly": return "per month";
      case "quarterly": return "per quarter";
      case "yearly": return "per year";
      default: return period;
    }
  };

  const handlePriceUpdate = () => {
    updatePricingMutation.mutate({
      tiers: Object.entries(customPrice).map(([period, price]) => ({
        billingPeriod: period,
        price
      }))
    });
  };

  const handleCreatePromotion = () => {
    createPromotionMutation.mutate({
      type: promotionType,
      value: promotionValue,
      duration: promotionDuration,
      autoRevert
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Creator view for managing pricing
  if (isCreatorView) {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Subscription Pricing Manager
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure your subscription tiers, pricing, and promotions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Billing Period Pricing</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(customPrice).map(([period, price]) => (
                  <div key={period} className="space-y-2">
                    <Label className="text-white capitalize">{period}</Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">$</span>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setCustomPrice({
                          ...customPrice,
                          [period]: parseFloat(e.target.value) || 0
                        })}
                        className="bg-gray-700 border-gray-600 text-white"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={handlePriceUpdate}
                className="mt-4 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                disabled={updatePricingMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Pricing
              </Button>
            </div>

            {/* Bundle Configuration */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Subscription Bundles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {bundles.map((bundle) => (
                  <Card key={bundle.months} className="bg-gray-700 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">
                          {bundle.months} {bundle.months === 1 ? 'Month' : 'Months'}
                        </p>
                        {bundle.discount > 0 && (
                          <Badge className="mt-2 bg-green-900 text-green-400">
                            Save {bundle.discount}%
                          </Badge>
                        )}
                        {bundle.mostPopular && (
                          <Badge className="mt-2 ml-2 bg-primary">
                            Most Popular
                          </Badge>
                        )}
                        {bundle.savings > 0 && (
                          <p className="text-sm text-gray-400 mt-2">
                            Save ${bundle.savings.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Promotions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Active Promotions</h3>
                <Button
                  onClick={() => setShowPromotion(true)}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Promotion
                </Button>
              </div>
              
              {/* Active promotions list */}
              <div className="space-y-2">
                {mockTiers
                  .filter(tier => tier.promotion)
                  .map(tier => (
                    <Card key={tier.id} className="bg-gray-700 border-gray-600">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{tier.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-yellow-900 text-yellow-400">
                                <Percent className="w-3 h-3 mr-1" />
                                {tier.promotion?.value}% OFF
                              </Badge>
                              <span className="text-xs text-gray-400">
                                Ends {new Date(tier.promotion?.endsAt || '').toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            End
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Tier Features */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Tier Benefits</h3>
              <div className="space-y-4">
                {mockTiers.filter(t => t.price > 0).map((tier) => (
                  <Card key={tier.id} className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">{tier.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(tier.perks).map(([perk, enabled]) => (
                          <div key={perk} className="flex items-center justify-between">
                            <span className="text-sm text-gray-400 capitalize">
                              {perk.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <Switch
                              checked={typeof enabled === 'boolean' ? enabled : enabled > 0}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Promotion Dialog */}
        <Dialog open={showPromotion} onOpenChange={setShowPromotion}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Promotion</DialogTitle>
              <DialogDescription className="text-gray-400">
                Set up a limited-time offer to attract more subscribers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white">Promotion Type</Label>
                <Select value={promotionType} onValueChange={(v: any) => setPromotionType(v)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="discount">Percentage Discount</SelectItem>
                    <SelectItem value="trial">Free Trial</SelectItem>
                    <SelectItem value="bonus">Bonus Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {promotionType === "discount" && (
                <div>
                  <Label className="text-white">Discount Percentage</Label>
                  <div className="flex items-center space-x-4">
                    <Slider
                      value={[promotionValue]}
                      onValueChange={(v) => setPromotionValue(v[0])}
                      max={75}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-white font-semibold w-12">{promotionValue}%</span>
                  </div>
                </div>
              )}
              
              <div>
                <Label className="text-white">Duration (days)</Label>
                <Input
                  type="number"
                  value={promotionDuration}
                  onChange={(e) => setPromotionDuration(parseInt(e.target.value) || 7)}
                  className="bg-gray-700 border-gray-600 text-white"
                  min="1"
                  max="90"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white">Auto-revert when expired</Label>
                <Switch
                  checked={autoRevert}
                  onCheckedChange={setAutoRevert}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowPromotion(false)}
                className="text-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePromotion}
                className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                disabled={createPromotionMutation.isPending}
              >
                Create Promotion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Fan view for subscribing
  return (
    <div className="space-y-6">
      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockTiers.map((tier) => (
          <Card
            key={tier.id}
            className={`bg-gray-800 border-gray-700 relative ${
              tier.isPopular ? 'ring-2 ring-primary' : ''
            }`}
          >
            {tier.isPopular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-primary to-secondary">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            {tier.isLimited && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-red-600">
                  <Users className="w-3 h-3 mr-1" />
                  {tier.maxSubscribers! - tier.currentSubscribers!} spots left
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-white">{tier.name}</CardTitle>
              <div className="mt-4">
                {tier.promotion && (
                  <div className="mb-2">
                    <Badge className="bg-yellow-900 text-yellow-400">
                      <Percent className="w-3 h-3 mr-1" />
                      {tier.promotion.value}% OFF
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      Ends {new Date(tier.promotion.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-white">
                    ${tier.price}
                  </span>
                  {tier.originalPrice && (
                    <span className="ml-2 text-lg text-gray-400 line-through">
                      ${tier.originalPrice}
                    </span>
                  )}
                  <span className="ml-2 text-gray-400">
                    {getPeriodLabel(tier.billingPeriod)}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Perks badges */}
              <div className="mt-4 flex flex-wrap gap-1">
                {tier.perks.customRequests && (
                  <Badge className="bg-gray-700 text-gray-300">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Custom
                  </Badge>
                )}
                {tier.perks.liveStreamAccess && (
                  <Badge className="bg-gray-700 text-gray-300">
                    <Zap className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                )}
                {tier.perks.phoneCallAccess && (
                  <Badge className="bg-gray-700 text-gray-300">
                    <Phone className="w-3 h-3 mr-1" />
                    Calls
                  </Badge>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              {tier.price === 0 ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                  onClick={() => {
                    setSelectedTier(tier.id);
                    subscribeMutation.mutate({ tierId: tier.id, months: selectedBundle });
                  }}
                  disabled={subscribeMutation.isPending}
                >
                  {subscribeMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Bundle Options */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Gift className="w-5 h-5 mr-2" />
            Save with Bundles
          </CardTitle>
          <CardDescription className="text-gray-400">
            Subscribe for longer periods and save more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bundles.map((bundle) => (
              <Card
                key={bundle.months}
                className={`bg-gray-700 border-gray-600 cursor-pointer transition-all ${
                  selectedBundle === bundle.months ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedBundle(bundle.months)}
              >
                <CardContent className="pt-6 text-center">
                  <p className="text-xl font-bold text-white">
                    {bundle.months} {bundle.months === 1 ? 'Month' : 'Months'}
                  </p>
                  {bundle.discount > 0 && (
                    <>
                      <Badge className="mt-2 bg-green-900 text-green-400">
                        {bundle.discount}% OFF
                      </Badge>
                      <p className="text-sm text-gray-400 mt-2">
                        Save ${bundle.savings.toFixed(2)}
                      </p>
                    </>
                  )}
                  {bundle.mostPopular && (
                    <Badge className="mt-2 bg-primary">
                      <Trophy className="w-3 h-3 mr-1" />
                      Best Value
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Transparency */}
      <Card className="bg-gradient-to-r from-green-900 to-emerald-900 border-green-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                Creators Keep 100% of Revenue
              </h3>
              <p className="text-green-300">
                We don't take any commission from subscriptions. Creators receive every dollar you pay.
              </p>
            </div>
            <div className="text-6xl">💚</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}