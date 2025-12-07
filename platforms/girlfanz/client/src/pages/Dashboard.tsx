import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Image, Heart } from "lucide-react";
import { MediaUpload } from "@/components/media/MediaUpload";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentMedia, isLoading: mediaLoading } = useQuery({
    queryKey: ["/api/media"],
  });

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Earnings",
      value: `$${((stats?.totalEarnings || 0) / 100).toLocaleString()}`,
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Active Fans",
      value: (stats?.fanCount || 0).toLocaleString(),
      icon: Users,
      color: "text-gf-pink",
    },
    {
      title: "Content Posts",
      value: (stats?.contentPosts || 0).toLocaleString(),
      icon: Image,
      color: "text-gf-violet",
    },
    {
      title: "Engagement",
      value: `${stats?.engagement || 0}%`,
      icon: Heart,
      color: "text-gf-cyan",
    },
  ];

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Dashboard Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="glass-overlay border-gf-smoke/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gf-smoke text-sm">{stat.title}</p>
                          <p className={`font-display font-bold text-2xl ${stat.color}`} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                            {stat.value}
                          </p>
                        </div>
                        <Icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Content Upload Section */}
            <MediaUpload />

            {/* Recent Content Grid */}
            <Card className="glass-overlay border-gf-smoke/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-bold text-2xl text-gf-snow">Your Recent Content</h2>
                  <button className="text-gf-pink hover:text-gf-violet transition-colors">
                    View All
                  </button>
                </div>

                {mediaLoading ? (
                  <div className="text-center py-8 text-gf-smoke">Loading content...</div>
                ) : recentMedia && recentMedia.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {recentMedia.slice(0, 3).map((content: any) => (
                      <Card key={content.id} className="glass-overlay border-gf-smoke/20 overflow-hidden group cursor-pointer">
                        <div className="relative">
                          <div className="w-full h-48 bg-gradient-to-br from-gf-pink/20 to-gf-violet/20 flex items-center justify-center">
                            <Image className="h-16 w-16 text-gf-smoke" />
                          </div>
                          <div className="absolute inset-0 bg-gf-pink/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-4xl text-gf-snow">▶</div>
                          </div>
                          <div className="absolute top-3 right-3 bg-success text-xs px-2 py-1 rounded-full">
                            {content.status}
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <p className="text-gf-snow text-sm mb-2" data-testid={`content-title-${content.id}`}>
                            {content.title || "Untitled"}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gf-smoke">
                            <span data-testid={`content-views-${content.id}`}>
                              {content.views || 0} views
                            </span>
                            <span data-testid={`content-earnings-${content.id}`}>
                              {content.price ? `$${(content.price / 100).toFixed(2)}` : "Free"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gf-smoke">
                    No content yet. Upload your first post to get started!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
