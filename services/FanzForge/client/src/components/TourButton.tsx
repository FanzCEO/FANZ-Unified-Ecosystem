import { Button } from "@/components/ui/button";
import { useTour } from "@/hooks/useTour";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TourButton() {
  const { startTour, resetTour } = useTour();

  const handleStartTour = () => {
    resetTour();
    setTimeout(() => {
      startTour();
    }, 100);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStartTour}
          className="fixed bottom-20 right-6 z-40"
          data-testid="button-restart-tour"
        >
          <i className="fas fa-question-circle mr-2"></i>
          Take Tour
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start the onboarding tour</p>
      </TooltipContent>
    </Tooltip>
  );
}