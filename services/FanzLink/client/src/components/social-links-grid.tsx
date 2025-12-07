import { Button } from "@/components/ui/button";
import { ExternalLink, Plus } from "lucide-react";
import { 
  SiInstagram, 
  SiYoutube, 
  SiTiktok, 
  SiX, 
  SiLinkedin, 
  SiTwitch 
} from "react-icons/si";
import { type SocialLink } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface SocialLinksGridProps {
  socialLinks: SocialLink[];
  userId: string;
}

const getPlatformIcon = (platform: string) => {
  const icons = {
    Instagram: SiInstagram,
    YouTube: SiYoutube,
    TikTok: SiTiktok,
    Twitter: SiX,
    LinkedIn: SiLinkedin,
    Twitch: SiTwitch,
  };
  return icons[platform as keyof typeof icons] || ExternalLink;
};

const getPlatformColor = (platform: string) => {
  const colors = {
    Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
    YouTube: "bg-red-500",
    TikTok: "bg-black dark:bg-white",
    Twitter: "bg-blue-500",
    LinkedIn: "bg-blue-600",
    Twitch: "bg-purple-600",
  };
  return colors[platform as keyof typeof colors] || "bg-gray-500";
};

const getPlatformHoverColor = (platform: string) => {
  const colors = {
    Instagram: "group-hover:text-pink-500",
    YouTube: "group-hover:text-red-500",
    TikTok: "group-hover:text-black dark:group-hover:text-white",
    Twitter: "group-hover:text-blue-500",
    LinkedIn: "group-hover:text-blue-600",
    Twitch: "group-hover:text-purple-600",
  };
  return colors[platform as keyof typeof colors] || "group-hover:text-gray-500";
};

export function SocialLinksGrid({ socialLinks, userId }: SocialLinksGridProps) {
  const handleSocialClick = async (platform: string, url: string) => {
    // Track click
    try {
      await apiRequest("POST", "/api/track-click", {
        userId,
        platform,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics", userId] });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
    
    // Open link
    window.open(url, '_blank');
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect With Me</h2>
        <Button 
          variant="ghost" 
          className="text-fanz-purple hover:text-fanz-pink transition-colors duration-200"
          data-testid="button-add-link"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialLinks.map((link) => {
          const IconComponent = getPlatformIcon(link.platform);
          const colorClass = getPlatformColor(link.platform);
          const hoverColorClass = getPlatformHoverColor(link.platform);
          
          return (
            <div
              key={link.id}
              onClick={() => handleSocialClick(link.platform, link.url)}
              className="card-hover bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg border border-gray-200 dark:border-dark-border flex items-center space-x-4 group cursor-pointer"
              data-testid={`link-social-${link.platform.toLowerCase()}`}
            >
              <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <IconComponent className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white" data-testid={`text-platform-${link.platform.toLowerCase()}`}>
                  {link.platform}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm" data-testid={`text-username-${link.platform.toLowerCase()}`}>
                  {link.username}
                </p>
              </div>
              <div className={`text-gray-400 ${hoverColorClass} transition-colors duration-200`}>
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
