import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, MessageCircle } from "lucide-react";
import type { VideoWithCreator } from "@shared/schema";

interface VideoCardProps {
  video: VideoWithCreator;
  onPlay?: (videoId: string) => void;
  onSendDM?: (creatorId: string) => void;
}

export default function VideoCard({ video, onPlay, onSendDM }: VideoCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayClick = () => {
    onPlay?.(video.id);
  };

  const handleDMClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSendDM?.(video.creator.id);
  };

  return (
    <div
      className="video-thumbnail bg-card rounded-lg overflow-hidden cursor-pointer"
      onClick={handlePlayClick}
      data-testid={`video-card-${video.id}`}
    >
      <div className="relative">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover"
          data-testid={`img-video-thumbnail-${video.id}`}
        />
        <Badge
          className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs"
          data-testid={`badge-quality-${video.id}`}
        >
          {video.quality}
        </Badge>
        <Badge
          className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs"
          data-testid={`badge-duration-${video.id}`}
        >
          {formatDuration(video.duration)}
        </Badge>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Play className="text-white h-12 w-12" />
        </div>
      </div>
      <div className="p-4">
        <h3
          className="font-medium mb-2"
          data-testid={`text-video-title-${video.id}`}
        >
          {video.title}
        </h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          {video.tags?.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs"
              data-testid={`badge-tag-${video.id}-${tag}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-xs text-muted-foreground"
            data-testid={`text-creator-name-${video.id}`}
          >
            by STAR {video.creator.displayName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDMClick}
            className="text-accent hover:text-accent-foreground text-sm font-medium p-2"
            data-testid={`button-dm-${video.id}`}
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            DM
          </Button>
        </div>
        <div
          className="text-xs text-muted-foreground mt-2"
          data-testid={`text-video-stats-${video.id}`}
        >
          {(video.views || 0).toLocaleString()} views •{" "}
          {(video.likes || 0).toLocaleString()} likes
        </div>
      </div>
    </div>
  );
}
