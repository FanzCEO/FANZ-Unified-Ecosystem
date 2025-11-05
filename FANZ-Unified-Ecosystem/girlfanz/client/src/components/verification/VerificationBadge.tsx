import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function VerificationBadge({ 
  userId, 
  size = 'md', 
  showText = false,
  className = ''
}: VerificationBadgeProps) {
  // If userId is provided, fetch that user's verification status
  // Otherwise fetch current user's status
  const endpoint = userId 
    ? `/api/verification/status/${userId}`
    : '/api/verification/status';

  const { data: status } = useQuery({
    queryKey: [endpoint],
  });

  if (!status?.verified) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const BadgeContent = () => {
    if (showText) {
      return (
        <Badge 
          variant="default" 
          className={`bg-blue-500 hover:bg-blue-600 ${className}`}
          data-testid="badge-verified-with-text"
        >
          <CheckCircle className={`${sizeClasses[size]} mr-1`} />
          <span className={textSizeClasses[size]}>Verified</span>
        </Badge>
      );
    }

    return (
      <div 
        className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white p-0.5 ${className}`}
        data-testid="badge-verified-icon"
      >
        <CheckCircle className={sizeClasses[size]} />
      </div>
    );
  };

  const validUntilDate = status.validUntil 
    ? new Date(status.validUntil).toLocaleDateString()
    : null;

  const tooltipContent = (
    <div className="space-y-1">
      <div className="font-medium flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Identity Verified
      </div>
      {status.verifiedAt && (
        <p className="text-xs">
          Verified on {new Date(status.verifiedAt).toLocaleDateString()}
        </p>
      )}
      {validUntilDate && (
        <p className="text-xs">
          Valid until {validUntilDate}
        </p>
      )}
      {status.provider && (
        <p className="text-xs text-muted-foreground">
          Verified by {status.provider}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <BadgeContent />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}