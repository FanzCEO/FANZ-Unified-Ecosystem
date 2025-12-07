import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Search, TrendingUp, Crown, Heart, Sparkles, Users, Filter, Star, Zap } from "lucide-react";

const communities = [
  { id: "all", name: "All Creators", icon: Users, color: "primary" },
  { id: "boyfanz", name: "BoyFanz", icon: Crown, color: "blue-500" },
  { id: "girlfanz", name: "GirlFanz", icon: Heart, color: "pink-500" },
  { id: "pupfanz", name: "PupFanz", icon: Sparkles, color: "purple-500" },
  { id: "fitness", name: "Fitness", icon: TrendingUp, color: "green-500" },
  { id: "gaming", name: "Gaming", icon: Zap, color: "yellow-500" },
];

const sortOptions = [
  { id: "trending", name: "Trending", icon: TrendingUp },
  { id: "newest", name: "Newest", icon: Sparkles },
  { id: "subscribers", name: "Most Subscribers", icon: Users },
  { id: "verified", name: "Verified", icon: Star },
];

export default function Explore() {
  const [selectedCommunity, setSelectedCommunity] = useState("all");
  const [sortBy, setSortBy] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: creators, isLoading } = useQuery({
    queryKey: ["/api/creators"],
    retry: false,
  });

  const filteredCreators = (creators || []).filter((creator: any) => {
    const matchesCommunity = selectedCommunity === "all" || creator.community === selectedCommunity;
    const matchesSearch = !searchQuery ||
      creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCommunity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      <div className="scan-line"></div>
      <Sidebar />
      <MobileNav />

      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="neon-card border-b border-primary/20 backdrop-blur-sm bg-black/50 px-4 lg:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary neon-text text-glow-animated mb-2">
              Explore Creators
            </h1>
            <p className="text-secondary text-sm lg:text-base">
              Discover amazing creators across the FANZ network
            </p>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-card/50 border-border neon-border rounded-xl"
              />
            </div>

            {/* Community Filters */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {communities.map((community) => {
                const Icon = community.icon;
                const isSelected = selectedCommunity === community.id;
                return (
                  <Button
                    key={community.id}
                    onClick={() => setSelectedCommunity(community.id)}
                    variant={isSelected ? "gradient" : "neon-outline"}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap transition-all ${
                      isSelected ? "neon-glow scale-105" : "hover:scale-105"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {community.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = sortBy === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.name}
                </button>
              );
            })}
          </div>

          {/* Featured Creators Banner */}
          <div className="mb-8 neon-card rounded-xl p-6 gradient-bg relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                Featured Creators
              </h2>
              <p className="text-sm opacity-90 mb-4">
                Top verified creators handpicked for you
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredCreators.slice(0, 4).map((creator: any) => (
                  <Card key={creator.id} className="bg-black/40 border-primary/20 backdrop-blur">
                    <CardContent className="p-4">
                      <img
                        src={creator.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`}
                        alt={creator.displayName}
                        className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary"
                      />
                      <h3 className="text-sm font-semibold text-center truncate">{creator.displayName}</h3>
                      <p className="text-xs text-muted-foreground text-center">@{creator.username}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Creators Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3 mx-auto"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCreators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCreators.map((creator: any) => (
                <Card
                  key={creator.id}
                  className="bg-card border-border neon-card cursor-pointer group"
                  onClick={() => window.location.href = `/creator/${creator.username}`}
                >
                  <CardContent className="p-0">
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                      {creator.coverImageUrl && (
                        <img
                          src={creator.coverImageUrl}
                          alt={creator.displayName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                      {creator.isVerified && (
                        <div className="absolute top-2 right-2 bg-primary text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>

                    {/* Profile Section */}
                    <div className="p-4 relative">
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                        <img
                          src={creator.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`}
                          alt={creator.displayName}
                          className="w-20 h-20 rounded-full border-4 border-card object-cover"
                        />
                      </div>

                      <div className="mt-10 text-center">
                        <h3 className="font-bold text-lg truncate">{creator.displayName}</h3>
                        <p className="text-sm text-muted-foreground mb-2">@{creator.username}</p>

                        {creator.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {creator.bio}
                          </p>
                        )}

                        {/* Stats */}
                        <div className="flex justify-center gap-4 mb-4 text-xs">
                          <div className="text-center">
                            <div className="font-bold text-primary">1.2K</div>
                            <div className="text-muted-foreground">Fans</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-secondary">324</div>
                            <div className="text-muted-foreground">Posts</div>
                          </div>
                        </div>

                        {/* Subscribe Button */}
                        <Button
                          variant="gradient"
                          className="w-full neon-glow"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/creator/${creator.username}`;
                          }}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Subscribe ${creator.subscriptionPrice || "9.99"}/mo
                        </Button>

                        {creator.freeTrialDays > 0 && (
                          <p className="text-xs text-accent mt-2">
                            ✨ {creator.freeTrialDays} days free trial
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-muted/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No creators found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <Button onClick={() => {
                setSelectedCommunity("all");
                setSearchQuery("");
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
