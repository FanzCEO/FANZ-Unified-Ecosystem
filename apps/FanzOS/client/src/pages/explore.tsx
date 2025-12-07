import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  TrendingUp,
  Star,
  Users,
  Heart,
  Filter,
  SlidersHorizontal,
  Play,
  Image,
  Crown,
  Sparkles,
  Flame,
  Award,
  DollarSign,
  Eye,
  MessageCircle
} from "lucide-react";
import { Link } from "wouter";

interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage: string;
  bio: string;
  category: string;
  subscriberCount: number;
  postCount: number;
  price: number;
  rating: number;
  isVerified: boolean;
  isOnline: boolean;
  tags: string[];
  recentMedia?: {
    type: "image" | "video";
    thumbnail: string;
  }[];
}

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("trending");

  // Fetch creators
  const { data: creators, isLoading } = useQuery<Creator[]>({
    queryKey: ["/api/creators", { category: selectedCategory, sort: sortBy, price: priceRange, search: searchQuery }],
  });

  // Mock data for demonstration
  const mockCreators: Creator[] = creators || [
    {
      id: "1",
      name: "Emma Rose",
      username: "emmarose",
      avatar: "https://images.unsplash.com/photo-1494790108344-b2ee30e40a34?w=100&h=100&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
      bio: "Model & Content Creator | Fashion & Lifestyle",
      category: "Model",
      subscriberCount: 45678,
      postCount: 234,
      price: 9.99,
      rating: 4.8,
      isVerified: true,
      isOnline: true,
      tags: ["fashion", "lifestyle", "exclusive"],
      recentMedia: [
        { type: "image", thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop" },
        { type: "video", thumbnail: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop" },
        { type: "image", thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop" },
      ],
    },
    {
      id: "2",
      name: "Sophia Luna",
      username: "sophialuna",
      avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&h=100&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=300&fit=crop",
      bio: "Fitness Coach | Wellness Expert",
      category: "Fitness",
      subscriberCount: 32456,
      postCount: 456,
      price: 14.99,
      rating: 4.9,
      isVerified: true,
      isOnline: false,
      tags: ["fitness", "wellness", "motivation"],
      recentMedia: [
        { type: "video", thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=200&h=200&fit=crop" },
        { type: "image", thumbnail: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=200&h=200&fit=crop" },
        { type: "video", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop" },
      ],
    },
    {
      id: "3",
      name: "Isabella Star",
      username: "isabellastar",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=300&fit=crop",
      bio: "Artist & Creative | Digital Art & Photography",
      category: "Artist",
      subscriberCount: 23456,
      postCount: 345,
      price: 19.99,
      rating: 4.7,
      isVerified: false,
      isOnline: true,
      tags: ["art", "photography", "creative"],
      recentMedia: [
        { type: "image", thumbnail: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop" },
        { type: "image", thumbnail: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=200&h=200&fit=crop" },
        { type: "image", thumbnail: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=200&h=200&fit=crop" },
      ],
    },
    {
      id: "4",
      name: "Luna Belle",
      username: "lunabelle",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=300&fit=crop",
      bio: "Dancer & Performer | Entertainment",
      category: "Performer",
      subscriberCount: 56789,
      postCount: 567,
      price: 12.99,
      rating: 4.9,
      isVerified: true,
      isOnline: true,
      tags: ["dance", "performance", "entertainment"],
    },
    {
      id: "5",
      name: "Aria Fox",
      username: "ariafox",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?w=800&h=300&fit=crop",
      bio: "Gamer & Streamer | Gaming Content",
      category: "Gaming",
      subscriberCount: 87654,
      postCount: 789,
      price: 9.99,
      rating: 4.8,
      isVerified: true,
      isOnline: false,
      tags: ["gaming", "streaming", "esports"],
    },
  ];

  const categories: Category[] = [
    { id: "all", name: "All", icon: Sparkles, count: 1234 },
    { id: "model", name: "Model", icon: Star, count: 456 },
    { id: "fitness", name: "Fitness", icon: Heart, count: 234 },
    { id: "artist", name: "Artist", icon: Image, count: 167 },
    { id: "performer", name: "Performer", icon: Play, count: 89 },
    { id: "gaming", name: "Gaming", icon: Award, count: 145 },
  ];

  const filteredCreators = mockCreators.filter(creator => {
    if (selectedCategory !== "all" && creator.category.toLowerCase() !== selectedCategory) {
      return false;
    }
    if (searchQuery && !creator.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !creator.username.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      if (creator.price < min || (max && creator.price > max)) {
        return false;
      }
    }
    return true;
  });

  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return b.subscriberCount - a.subscriberCount;
      case "newest":
        return b.postCount - a.postCount;
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="text-explore-title">
            Explore Creators
          </h1>
          <p className="text-gray-400">Discover amazing content creators from around the world</p>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search creators by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600 pl-12 text-white text-lg"
                  data-testid="input-search-creators"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white" data-testid="select-price">
                    <SelectValue placeholder="Price range" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="0-10">$0 - $10</SelectItem>
                    <SelectItem value="10-20">$10 - $20</SelectItem>
                    <SelectItem value="20-50">$20 - $50</SelectItem>
                    <SelectItem value="50-999">$50+</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 overflow-x-auto pb-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    flex items-center space-x-2 whitespace-nowrap
                    ${selectedCategory === category.id 
                      ? "bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                    }
                  `}
                  data-testid={`category-${category.id}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-1">
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Featured Section */}
        <Tabs defaultValue="featured" className="mb-8">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="featured" data-testid="tab-featured">
              <Flame className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="trending" data-testid="tab-trending">
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="new" data-testid="tab-new">
              <Sparkles className="w-4 h-4 mr-2" />
              New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="mt-6">
            {/* Featured Carousel/Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCreators.slice(0, 3).map((creator) => (
                <Card key={creator.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:border-primary transition-colors">
                  <div className="relative h-32">
                    <img
                      src={creator.coverImage}
                      alt={creator.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-secondary">
                      Featured
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarImage src={creator.avatar} alt={creator.name} />
                        <AvatarFallback>{creator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-white">{creator.name}</p>
                          {creator.isVerified && (
                            <Badge variant="secondary" className="bg-blue-900 text-blue-400">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">@{creator.username}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">{creator.bio}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">${creator.price}/month</span>
                      <Link href={`/creator/${creator.id}`}>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                          data-testid={`button-view-featured-${creator.id}`}
                        >
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Main Creator Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-700 rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-700 rounded mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-3/4" />
                  </CardContent>
                </div>
              </Card>
            ))
          ) : (
            sortedCreators.map((creator) => (
              <Card
                key={creator.id}
                className="bg-gray-800 border-gray-700 overflow-hidden hover:border-primary transition-all hover:scale-105"
              >
                {/* Cover Image with Recent Media */}
                <div className="relative h-48">
                  <img
                    src={creator.coverImage}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Online Status */}
                  {creator.isOnline && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Live
                    </div>
                  )}

                  {/* Category Badge */}
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                    {creator.category}
                  </Badge>

                  {/* Recent Media Preview */}
                  {creator.recentMedia && (
                    <div className="absolute bottom-2 left-2 right-2 flex space-x-1">
                      {creator.recentMedia.slice(0, 3).map((media, index) => (
                        <div key={index} className="relative flex-1 h-12 rounded overflow-hidden">
                          <img
                            src={media.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          {media.type === "video" && (
                            <Play className="absolute inset-0 m-auto w-4 h-4 text-white" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Creator Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={creator.avatar} alt={creator.name} />
                      <AvatarFallback>{creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-white truncate">{creator.name}</p>
                        {creator.isVerified && (
                          <Badge variant="secondary" className="bg-blue-900 text-blue-400 flex-shrink-0">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">@{creator.username}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-300 mb-3 line-clamp-2">{creator.bio}</p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {creator.subscriberCount.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {creator.postCount} posts
                    </span>
                    <span className="flex items-center">
                      <Star className="w-3 h-3 mr-1 text-yellow-500" />
                      {creator.rating}
                    </span>
                  </div>

                  {/* Tags */}
                  {creator.tags && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {creator.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div>
                      <span className="text-xl font-bold text-white">${creator.price}</span>
                      <span className="text-xs text-gray-400">/month</span>
                    </div>
                    <Link href={`/creator/${creator.id}`}>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600"
                        data-testid={`button-view-${creator.id}`}
                      >
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {sortedCreators.length > 0 && (
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-white"
              data-testid="button-load-more"
            >
              Load More Creators
            </Button>
          </div>
        )}

        {/* No Results */}
        {sortedCreators.length === 0 && !isLoading && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No creators found</h3>
              <p className="text-gray-400">Try adjusting your filters or search query</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}