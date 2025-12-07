import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";

export default function FloatingButtons() {
  const { toast } = useToast();
  const { id: projectId } = useParams();

  const deployMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/deploy", {
        projectId,
        environment: "preview"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deployment Started",
        description: "Your project is being deployed to preview environment.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: "Failed to start deployment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeploy = () => {
    deployMutation.mutate();
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="lg"
            onClick={handleDeploy}
            disabled={deployMutation.isPending}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all animate-float"
            data-testid="fab-deploy"
          >
            {deployMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-rocket"></i>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Deploy to Production</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="lg"
            variant="outline"
            className="w-10 h-10 bg-secondary text-secondary-foreground rounded-full shadow-lg hover:shadow-xl transition-all border-secondary"
            data-testid="fab-help"
          >
            <i className="fas fa-question"></i>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Help & Documentation</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            size="lg"
            variant="outline"
            className="w-10 h-10 bg-accent text-accent-foreground rounded-full shadow-lg hover:shadow-xl transition-all border-accent"
            data-testid="fab-share"
          >
            <i className="fas fa-share-alt"></i>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Share Project</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
