import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { PostWithAuthor, User } from "@shared/schema";
import { Search, TrendingUp, Users, Hash } from "lucide-react";

const trendingTopics = [
  { topic: "#CyberPunk2024", category: "Technology", postCount: "15.2K" },
  { topic: "#NeuralNetworks", category: "AI", postCount: "8.7K" },
  { topic: "#VirtualReality", category: "Gaming", postCount: "12.4K" },
  { topic: "#FuturisticUI", category: "Design", postCount: "6.1K" },
  { topic: "#QuantumComputing", category: "Science", postCount: "4.2K" },
  { topic: "#SpaceX", category: "Space", postCount: "9.8K" },
];

export default function Explore() {
  const { data: posts = [] } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  const { data: suggestedUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/suggested"],
  });

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        <main className="flex-1 lg:ml-64 max-w-full lg:max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Search Section */}
          <div className="post-card p-6 rounded-xl mb-6">
            <h2 className="text-2xl font-bold text-cyber-blue mb-4 neon-text">
              Explore the Universe
            </h2>
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder="Search for topics, users, or posts..."
                className="cyber-input w-full rounded-full px-4 py-3 pl-12 text-white placeholder-gray-400"
                data-testid="explore-search"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue hover:text-black transition-colors rounded-full"
                data-testid="filter-trending"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </Button>
              <Button
                size="sm"
                className="bg-electric-purple/20 text-electric-purple hover:bg-electric-purple hover:text-black transition-colors rounded-full"
                data-testid="filter-people"
              >
                <Users className="w-4 h-4 mr-2" />
                People
              </Button>
              <Button
                size="sm"
                className="bg-neon-pink/20 text-neon-pink hover:bg-neon-pink hover:text-black transition-colors rounded-full"
                data-testid="filter-topics"
              >
                <Hash className="w-4 h-4 mr-2" />
                Topics
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="post-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-electric-purple mb-4 neon-text">
                  Trending Posts
                </h3>
                <div className="space-y-4">
                  {posts.slice(0, 5).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sidebar Content */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <div className="post-card scan-line p-4 rounded-xl">
                <h3 className="text-lg font-bold text-cyber-blue mb-4 neon-text">
                  Trending Topics
                </h3>
                <div className="space-y-3">
                  {trendingTopics.map((trend, index) => (
                    <div
                      key={trend.topic}
                      className="hover:bg-gray-800/50 p-3 rounded-lg cursor-pointer transition-colors"
                      data-testid={`trend-${trend.topic.replace('#', '')}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">#{index + 1} · Trending in {trend.category}</p>
                          <p className="font-semibold text-white">{trend.topic}</p>
                          <p className="text-xs text-gray-400">{trend.postCount} posts</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-cyber-blue" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Who to Follow */}
              <div className="post-card p-4 rounded-xl">
                <h3 className="text-lg font-bold text-electric-purple mb-4 neon-text">
                  Who to Follow
                </h3>
                <div className="space-y-4">
                  {suggestedUsers.slice(0, 3).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full border border-neon-pink overflow-hidden">
                          <img
                            src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
                            alt={user.displayName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{user.displayName}</h4>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black text-xs font-bold px-3 py-1 rounded-full border-cyber-blue hover:shadow-neon-cyan transition-all duration-300"
                        data-testid={`follow-${user.username}`}
                      >
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}