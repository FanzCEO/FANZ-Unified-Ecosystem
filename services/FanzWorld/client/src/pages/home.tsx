import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { PostCard } from "@/components/post-card";
import { CreatePost } from "@/components/create-post";
import { TrendingSidebar } from "@/components/trending-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { PostWithAuthor } from "@shared/schema";

export default function Home() {
  const { data: posts = [], isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  return (
    <div className="min-h-screen bg-black text-white cyber-grid">
      <Header />
      
      <div className="flex flex-col lg:flex-row pt-14 sm:pt-16 pb-16 lg:pb-0">
        {/* Desktop Sidebars */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 lg:ml-64 xl:mr-80 max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto p-3 sm:p-4 lg:p-6">
          <CreatePost />
          
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
            ) : posts.length === 0 ? (
              <div className="post-card p-6 sm:p-8 rounded-xl text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-cyber-blue mb-2">
                  Welcome to Fanz World
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  The future of social connection starts here. Create your first post to get started!
                </p>
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </main>
        
        {/* Desktop Trending Sidebar */}
        <div className="hidden xl:block">
          <TrendingSidebar />
        </div>
      </div>
      
      {/* Mobile Create Post Button */}
      <button 
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-cyber-blue to-electric-purple rounded-full shadow-neon-cyan hover:shadow-neon-pink transition-all duration-300 hover:scale-110 lg:hidden z-40 flex items-center justify-center"
        data-testid="mobile-create-post"
      >
        <span className="text-black text-xl font-bold">+</span>
      </button>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
