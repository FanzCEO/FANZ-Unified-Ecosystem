import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  Heart,
  Truck,
  Package,
  Shield,
  ShoppingCart,
  Plus,
  Minus,
  X,
  Gift,
  Sparkles,
  TrendingUp,
  Tag,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shirt,
  Camera,
  Headphones,
  Gem,
  Book,
  Image,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  Calendar,
  MapPin,
  CreditCard,
  Zap
} from "lucide-react";
import { Link } from "wouter";

interface Product {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  category: "apparel" | "accessories" | "prints" | "digital" | "collectibles" | "other";
  images: string[];
  stock: number;
  sold: number;
  rating: number;
  reviews: number;
  tags: string[];
  sizes?: string[];
  colors?: string[];
  featured: boolean;
  exclusive: boolean;
  limitedEdition: boolean;
  customizable: boolean;
  shippingCost: number;
  estimatedDelivery: string;
  inWishlist: boolean;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customization?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export default function Merchandise() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("popular");
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/merchandise", selectedCategory, sortBy],
  });

  // Fetch user orders
  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: !!user,
  });

  // Mock data for demonstration
  const mockProducts: Product[] = products || [
    {
      id: "1",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      name: "Signature Collection T-Shirt",
      description: "Premium quality cotton t-shirt with exclusive design. Limited edition piece from the Signature Collection.",
      price: 39.99,
      salePrice: 29.99,
      category: "apparel",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop",
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&h=800&fit=crop"
      ],
      stock: 50,
      sold: 145,
      rating: 4.8,
      reviews: 67,
      tags: ["limited", "signature", "cotton"],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "White", "Pink"],
      featured: true,
      exclusive: true,
      limitedEdition: true,
      customizable: false,
      shippingCost: 5.99,
      estimatedDelivery: "3-5 business days",
      inWishlist: false
    },
    {
      id: "2",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      name: "Autographed Photo Print",
      description: "High-quality glossy photo print, personally autographed. Each print is numbered and comes with a certificate of authenticity.",
      price: 49.99,
      category: "prints",
      images: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=800&fit=crop",
        "https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=600&h=800&fit=crop"
      ],
      stock: 100,
      sold: 89,
      rating: 5.0,
      reviews: 45,
      tags: ["autographed", "limited", "collectible"],
      featured: true,
      exclusive: false,
      limitedEdition: true,
      customizable: true,
      shippingCost: 4.99,
      estimatedDelivery: "2-4 business days",
      inWishlist: true
    },
    {
      id: "3",
      creatorId: "creator3",
      creatorName: "Isabella Star",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      name: "Crystal Jewelry Set",
      description: "Handcrafted crystal jewelry set including necklace, earrings, and bracelet. Each piece is unique.",
      price: 89.99,
      category: "accessories",
      images: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop",
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=800&fit=crop"
      ],
      stock: 20,
      sold: 56,
      rating: 4.9,
      reviews: 34,
      tags: ["handmade", "crystal", "jewelry"],
      colors: ["Gold", "Silver", "Rose Gold"],
      featured: false,
      exclusive: true,
      limitedEdition: false,
      customizable: true,
      shippingCost: 6.99,
      estimatedDelivery: "5-7 business days",
      inWishlist: false
    },
    {
      id: "4",
      creatorId: "creator1",
      creatorName: "Emma Rose",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      name: "Digital Art Collection",
      description: "Exclusive digital art collection with 10 high-resolution artworks. Instant download after purchase.",
      price: 24.99,
      category: "digital",
      images: [
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=800&fit=crop"
      ],
      stock: -1, // Unlimited digital copies
      sold: 234,
      rating: 4.7,
      reviews: 89,
      tags: ["digital", "art", "download"],
      featured: false,
      exclusive: false,
      limitedEdition: false,
      customizable: false,
      shippingCost: 0,
      estimatedDelivery: "Instant",
      inWishlist: false
    },
    {
      id: "5",
      creatorId: "creator2",
      creatorName: "Sophia Luna",
      creatorAvatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      name: "Collectible Figurine",
      description: "Limited edition collectible figurine, numbered and signed. Only 500 pieces available worldwide.",
      price: 149.99,
      category: "collectibles",
      images: [
        "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&h=800&fit=crop"
      ],
      stock: 10,
      sold: 45,
      rating: 5.0,
      reviews: 23,
      tags: ["collectible", "limited", "signed"],
      featured: true,
      exclusive: true,
      limitedEdition: true,
      customizable: false,
      shippingCost: 9.99,
      estimatedDelivery: "7-10 business days",
      inWishlist: false
    }
  ];

  const mockOrders: Order[] = orders || [
    {
      id: "order1",
      orderNumber: "ORD-2024-001",
      date: "2024-01-15",
      status: "delivered",
      items: [
        {
          id: "cart1",
          product: mockProducts[0],
          quantity: 2,
          selectedSize: "L",
          selectedColor: "Black"
        }
      ],
      subtotal: 59.98,
      shipping: 5.99,
      total: 65.97,
      trackingNumber: "1Z999AA10123456784",
      estimatedDelivery: "January 20, 2024",
      shippingAddress: {
        name: "John Doe",
        address: "123 Main St",
        city: "Los Angeles",
        state: "CA",
        zip: "90001",
        country: "USA"
      }
    }
  ];

  const addToCartMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      const response = await apiRequest("POST", "/api/cart", item);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
        title: "Failed to add to cart",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("POST", `/api/wishlist/${productId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchandise"] });
      toast({
        title: "Wishlist updated",
        description: "Item has been updated in your wishlist",
      });
    },
  });

  const handleAddToCart = (product: Product) => {
    const cartItem: CartItem = {
      id: `cart-${Date.now()}`,
      product,
      quantity,
      selectedSize,
      selectedColor
    };
    
    setCart([...cart, cartItem]);
    setShowQuickView(false);
    setQuantity(1);
    setSelectedSize("");
    setSelectedColor("");
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    });
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "apparel": return <Shirt className="w-4 h-4" />;
      case "accessories": return <Gem className="w-4 h-4" />;
      case "prints": return <Image className="w-4 h-4" />;
      case "digital": return <Camera className="w-4 h-4" />;
      case "collectibles": return <Sparkles className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "delivered": return "text-green-500";
      case "shipped": return "text-blue-500";
      case "processing": return "text-yellow-500";
      case "pending": return "text-gray-400";
      case "cancelled": return "text-red-500";
      default: return "text-gray-400";
    }
  };

  const filteredProducts = mockProducts.filter(product => {
    if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    return true;
  }).sort((a, b) => {
    switch(sortBy) {
      case "popular": return b.sold - a.sold;
      case "newest": return 0; // Would sort by date in real implementation
      case "price-low": return a.price - b.price;
      case "price-high": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      default: return 0;
    }
  });

  const cartSubtotal = cart.reduce((sum, item) => 
    sum + (item.product.salePrice || item.product.price) * item.quantity, 0
  );
  const cartShipping = cart.reduce((sum, item) => 
    Math.max(sum, item.product.shippingCost), 0
  );
  const cartTotal = cartSubtotal + cartShipping;

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center" data-testid="text-merchandise-title">
                <ShoppingBag className="w-8 h-8 mr-3 text-primary" />
                Creator Merchandise
              </h1>
              <p className="text-gray-400">Exclusive products from your favorite creators</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowCart(true)}
                data-testid="button-cart"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
              </Button>
              <Link href="/orders">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Package className="w-4 h-4 mr-2" />
                  My Orders
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Banner */}
        <Card className="bg-gradient-to-r from-primary to-secondary mb-8">
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Limited Edition Collection
                </h2>
                <p className="text-white/90 mb-4">
                  Exclusive items available for a limited time only
                </p>
                <Button className="bg-white text-primary hover:bg-gray-100">
                  Shop Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="hidden md:block">
                <Sparkles className="w-24 h-24 text-white/20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                  data-testid="input-search"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="apparel">Apparel</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="prints">Prints</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
                <SelectItem value="collectibles">Collectibles</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="shop" data-testid="tab-shop">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </TabsTrigger>
            <TabsTrigger value="featured" data-testid="tab-featured">
              <Star className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="exclusive" data-testid="tab-exclusive">
              <Sparkles className="w-4 h-4 mr-2" />
              Exclusive
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="w-4 h-4 mr-2" />
              My Orders
            </TabsTrigger>
          </TabsList>

          {/* Shop Tab */}
          <TabsContent value="shop" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700 overflow-hidden group">
                  <div className="relative aspect-square">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.salePrice && (
                      <Badge className="absolute top-2 left-2 bg-red-600 text-white">
                        Sale
                      </Badge>
                    )}
                    {product.limitedEdition && (
                      <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
                        Limited
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        className="bg-white text-black hover:bg-gray-200"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowQuickView(true);
                        }}
                        data-testid={`button-quickview-${product.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Quick View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-white/20 text-white hover:bg-white/30"
                        onClick={() => toggleWishlistMutation.mutate(product.id)}
                      >
                        <Heart className={`w-4 h-4 ${product.inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={product.creatorAvatar} alt={product.creatorName} />
                        <AvatarFallback>{product.creatorName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-400">{product.creatorName}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1">{product.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      {product.salePrice ? (
                        <>
                          <span className="text-xl font-bold text-green-500">
                            ${product.salePrice}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            ${product.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-white">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm text-gray-400">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-400">
                        {getCategoryIcon(product.category)}
                        <span className="text-xs">{product.sold} sold</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                <p>No products found matching your criteria</p>
              </div>
            )}
          </TabsContent>

          {/* Featured Tab */}
          <TabsContent value="featured" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockProducts.filter(p => p.featured).map((product) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700">
                  <div className="relative h-48">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-white mb-2">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">
                        ${product.salePrice || product.price}
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowQuickView(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Exclusive Tab */}
          <TabsContent value="exclusive" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockProducts.filter(p => p.exclusive).map((product) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700 border-2 border-yellow-600/50">
                  <div className="relative h-48">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
                      <Zap className="w-3 h-3 mr-1" />
                      Exclusive
                    </Badge>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-white mb-2">{product.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-white">
                        ${product.salePrice || product.price}
                      </span>
                      <span className="text-sm text-gray-400">
                        {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                      </span>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                      disabled={product.stock === 0}
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowQuickView(true);
                      }}
                    >
                      {product.stock > 0 ? 'Get Exclusive Access' : 'Sold Out'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {mockOrders.length > 0 ? (
              <div className="space-y-4">
                {mockOrders.map((order) => (
                  <Card key={order.id} className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">Order #{order.orderNumber}</CardTitle>
                          <CardDescription className="text-gray-400">
                            Placed on {new Date(order.date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="text-white font-medium">{item.product.name}</p>
                              <p className="text-sm text-gray-400">
                                Qty: {item.quantity}
                                {item.selectedSize && ` • Size: ${item.selectedSize}`}
                                {item.selectedColor && ` • Color: ${item.selectedColor}`}
                              </p>
                            </div>
                            <p className="text-white font-medium">
                              ${((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Subtotal</span>
                          <span className="text-white">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-400">Shipping</span>
                          <span className="text-white">${order.shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold mt-2">
                          <span className="text-white">Total</span>
                          <span className="text-white">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      {order.trackingNumber && (
                        <div className="mt-4 p-3 bg-gray-700 rounded">
                          <p className="text-sm text-gray-400">Tracking Number</p>
                          <p className="text-white font-mono">{order.trackingNumber}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4" />
                <p>No orders yet</p>
                <p className="text-sm mt-2">Start shopping to see your orders here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick View Modal */}
      {showQuickView && selectedProduct && (
        <Dialog open={showQuickView} onOpenChange={setShowQuickView}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedProduct.name}</DialogTitle>
              <DialogDescription className="text-gray-400">
                by {selectedProduct.creatorName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="relative aspect-square mb-2">
                  <img
                    src={selectedProduct.images[currentImageIndex]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded"
                  />
                  {selectedProduct.images.length > 1 && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white"
                        onClick={() => setCurrentImageIndex((prev) => 
                          prev === 0 ? selectedProduct.images.length - 1 : prev - 1
                        )}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white"
                        onClick={() => setCurrentImageIndex((prev) => 
                          (prev + 1) % selectedProduct.images.length
                        )}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                {selectedProduct.images.length > 1 && (
                  <div className="flex space-x-2">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-16 h-16 rounded overflow-hidden border-2 ${
                          currentImageIndex === idx ? 'border-primary' : 'border-gray-600'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-gray-300 mb-4">{selectedProduct.description}</p>
                
                <div className="flex items-center space-x-2 mb-4">
                  {selectedProduct.salePrice ? (
                    <>
                      <span className="text-2xl font-bold text-green-500">
                        ${selectedProduct.salePrice}
                      </span>
                      <span className="text-lg text-gray-400 line-through">
                        ${selectedProduct.price}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      ${selectedProduct.price}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-400">
                      {selectedProduct.rating} ({selectedProduct.reviews} reviews)
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {selectedProduct.sold} sold
                  </span>
                </div>

                {selectedProduct.sizes && (
                  <div className="mb-4">
                    <Label className="text-white mb-2 block">Size</Label>
                    <div className="flex space-x-2">
                      {selectedProduct.sizes.map((size) => (
                        <Button
                          key={size}
                          variant={selectedSize === size ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSize(size)}
                          className={selectedSize === size ? "" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.colors && (
                  <div className="mb-4">
                    <Label className="text-white mb-2 block">Color</Label>
                    <div className="flex space-x-2">
                      {selectedProduct.colors.map((color) => (
                        <Button
                          key={color}
                          variant={selectedColor === color ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedColor(color)}
                          className={selectedColor === color ? "" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <Label className="text-white mb-2 block">Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-white w-12 text-center">{quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={selectedProduct.stock !== -1 && quantity >= selectedProduct.stock}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Truck className="w-4 h-4" />
                    <span>
                      Shipping: ${selectedProduct.shippingCost === 0 ? 'Free' : selectedProduct.shippingCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Delivery: {selectedProduct.estimatedDelivery}</span>
                  </div>
                  {selectedProduct.stock !== -1 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Package className="w-4 h-4" />
                      <span>{selectedProduct.stock} in stock</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                    onClick={() => handleAddToCart(selectedProduct)}
                    disabled={
                      (selectedProduct.sizes && !selectedSize) ||
                      (selectedProduct.colors && !selectedColor) ||
                      (selectedProduct.stock !== -1 && selectedProduct.stock === 0)
                    }
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => toggleWishlistMutation.mutate(selectedProduct.id)}
                  >
                    <Heart className={`w-4 h-4 ${selectedProduct.inWishlist ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Shopping Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="bg-gray-800 border-gray-700 text-white w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">Shopping Cart</SheetTitle>
            <SheetDescription className="text-gray-400">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-280px)] my-4">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.id} className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{item.product.name}</h4>
                          <p className="text-xs text-gray-400">
                            {item.selectedSize && `Size: ${item.selectedSize}`}
                            {item.selectedColor && ` • ${item.selectedColor}`}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">
                                ${((item.product.salePrice || item.product.price) * item.quantity).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-400 h-6 px-2"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                <p>Your cart is empty</p>
                <p className="text-sm mt-2">Add items to get started</p>
              </div>
            )}
          </ScrollArea>

          {cart.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">${cartShipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}