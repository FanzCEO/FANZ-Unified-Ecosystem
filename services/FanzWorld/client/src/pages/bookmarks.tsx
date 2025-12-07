import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { MobileNav } from "@/components/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";
import { Bookmark as BookmarkIcon } from "lucide-react";

export default function Bookmarks() {
  const { data: bookmarks = [], isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/bookmarks"],
  });

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64 max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto p-3 sm:p-4 lg:p-6">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-3 sm:space-x-4 mb-2">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 border border-cyber-blue/30">
                <BookmarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyber-blue" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-cyber-blue">
                Bookmarks
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400 ml-12 sm:ml-16">
              Your saved posts for later reading
            </p>
          </div>
          
          {/* Content */}
          <div className="space-y-4 sm:space-y-6 mb-20 lg:mb-0">
            {isLoading ? (
              <div className="space-y-4 sm:space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="post-card p-4 sm:p-6 rounded-xl animate-pulse">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700"></div>
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div className="h-3 sm:h-4 bg-gray-700 rounded w-1/3"></div>
                        <div className="h-16 sm:h-20 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="post-card p-6 sm:p-8 rounded-xl text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyber-blue/20 to-electric-purple/20 border border-cyber-blue/30">
                    <BookmarkIcon className="w-8 h-8 text-cyber-blue" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-cyber-blue mb-2">
                  No bookmarks yet
                </h3>
                <p className="text-sm sm:text-base text-gray-400 max-w-md mx-auto">
                  When you bookmark posts, they'll appear here for easy access later. 
                  Look for the bookmark icon on posts to save them!
                </p>
              </div>
            ) : (
              bookmarks.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}