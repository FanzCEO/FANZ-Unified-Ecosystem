import { Bell, MessageSquare, Search, Rocket, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Link } from "wouter";
import { AuthModal } from "@/components/auth-modal";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
  });

  const signoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/auth/signout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Signed out successfully",
        description: "See you in the cyber realm! 👋",
      });
    },
  });

  const isAuthenticated = user && !error;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-cyber-blue/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" data-testid="logo">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyber-blue to-electric-purple rounded-lg flex items-center justify-center shadow-neon-cyan">
                <Rocket className="text-sm sm:text-xl text-black" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-cyber-blue neon-text animate-glow">
                Fanz World
              </h1>
            </div>
          </Link>
          
          {/* Search Bar - Hidden on small screens */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Search users, posts, galaxies..."
                className="cyber-input w-full rounded-full px-4 py-2 pl-10 text-white placeholder-gray-400 focus:outline-none transition-all duration-300"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2 rounded-full bg-gray-800/50 hover:bg-cyber-blue/20 hover:shadow-neon-cyan transition-all duration-300"
              data-testid="mobile-search-button"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-blue" />
            </Button>
            
            {isAuthenticated ? (
              <>
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative p-2 rounded-full bg-gray-800/50 hover:bg-cyber-blue/20 hover:shadow-neon-cyan transition-all duration-300"
                    data-testid="notifications-button"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-cyber-blue" />
                    <span className="absolute -top-1 -right-1 bg-neon-pink text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-black font-bold text-[10px] sm:text-xs">
                      3
                    </span>
                  </Button>
                </Link>
                
                <Link href="/messages">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex p-2 rounded-full bg-gray-800/50 hover:bg-electric-purple/20 hover:shadow-neon-purple transition-all duration-300"
                    data-testid="messages-button"
                  >
                    <MessageSquare className="w-5 h-5 text-electric-purple" />
                  </Button>
                </Link>
                
                <Link href="/profile">
                  <div 
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-cyber-blue shadow-neon-cyan overflow-hidden hover:shadow-glow cursor-pointer transition-all duration-300"
                    data-testid="user-avatar"
                  >
                    <img
                      src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signoutMutation.mutate()}
                  className="hidden sm:flex text-gray-400 hover:text-cyber-blue transition-colors"
                  data-testid="signout-button"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="neon-button bg-gradient-to-r from-cyber-blue to-electric-purple text-black font-bold px-4 py-2 rounded-xl border-cyber-blue hover:shadow-neon-cyan transition-all duration-300"
                data-testid="signin-button"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Enter
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
      />
    </header>
  );
}
