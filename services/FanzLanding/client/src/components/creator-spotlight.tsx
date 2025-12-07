import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreatorWithStats } from "@shared/schema";

interface CreatorSpotlightProps {
  network: string;
}

export default function CreatorSpotlight({ network }: CreatorSpotlightProps) {
  const { data: creators, isLoading } = useQuery<CreatorWithStats[]>({
    queryKey: ["/api/creators/network", network],
  });

  const getStatusBadge = (creator: CreatorWithStats, index: number) => {
    if (creator.isVerified) {
      return (
        <Badge className="bg-accent text-accent-foreground text-xs">
          Verified
        </Badge>
      );
    }
    if (index === 0) {
      return (
        <Badge className="bg-orange-500 text-white text-xs">New Drop</Badge>
      );
    }
    if ((creator.followers || 0) > 2000) {
      return <Badge className="bg-green-500 text-white text-xs">Popular</Badge>;
    }
    if ((creator.followers || 0) > 1000) {
      return <Badge className="bg-primary text-white text-xs">Rising</Badge>;
    }
    return <Badge className="bg-purple-500 text-white text-xs">Trending</Badge>;
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 gradient-text">
            ⭐ Featured STARZ ⭐
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
                <Skeleton className="h-5 w-14 mx-auto rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gradient-to-b from-purple-900/20 to-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 gradient-text">
          ⭐ Featured STARZ ⭐
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {creators?.map((creator, index) => (
            <div
              key={creator.id}
              className="text-center space-y-2"
              data-testid={`creator-spotlight-${creator.id}`}
            >
              <img
                src={
                  creator.avatar ||
                  `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face`
                }
                alt={`Creator ${creator.displayName}`}
                className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-primary hover:scale-110 transition-transform cursor-pointer"
                data-testid={`img-creator-${creator.id}`}
              />
              <div>
                <h3
                  className="font-medium text-sm"
                  data-testid={`text-creator-name-${creator.id}`}
                >
                  {creator.displayName}
                </h3>
                <p
                  className="text-xs text-muted-foreground"
                  data-testid={`text-creator-bio-${creator.id}`}
                >
                  {creator.bio}
                </p>
                {getStatusBadge(creator, index)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
