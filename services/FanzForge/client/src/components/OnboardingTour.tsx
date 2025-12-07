import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'none';
  actionText?: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ steps, isActive, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const targetElement = document.querySelector(steps[currentStep].target) as HTMLElement;
    if (targetElement) {
      setHighlightedElement(targetElement);
      
      // Calculate tooltip position
      const rect = targetElement.getBoundingClientRect();
      const position = steps[currentStep].position;
      
      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
      }

      setTooltipPosition({ top, left });

      // Scroll to element if needed
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });

      // Add highlight class
      targetElement.classList.add('tour-highlight');
      
      return () => {
        targetElement.classList.remove('tour-highlight');
      };
    }
  }, [currentStep, steps, isActive]);

  useEffect(() => {
    if (!isActive) return;

    // Prevent scrolling on body when tour is active
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isActive]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setHighlightedElement(null);
    onComplete();
  };

  const handleSkip = () => {
    setHighlightedElement(null);
    onSkip();
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isActive || !currentStepData) return null;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50">
        {/* Overlay */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          style={{
            background: highlightedElement ? `
              radial-gradient(circle at ${highlightedElement.getBoundingClientRect().left + highlightedElement.getBoundingClientRect().width / 2}px ${highlightedElement.getBoundingClientRect().top + highlightedElement.getBoundingClientRect().height / 2}px, 
              transparent ${Math.max(highlightedElement.getBoundingClientRect().width, highlightedElement.getBoundingClientRect().height) / 2 + 10}px, 
              rgba(0, 0, 0, 0.6) ${Math.max(highlightedElement.getBoundingClientRect().width, highlightedElement.getBoundingClientRect().height) / 2 + 20}px)
            ` : 'rgba(0, 0, 0, 0.6)'
          }}
        />

        {/* Tooltip */}
        <AnimatePresence>
          {currentStepData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute z-60"
              style={{
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: `translate(${
                  currentStepData.position === 'left' ? '-100%' : 
                  currentStepData.position === 'right' ? '0%' : '-50%'
                }, ${
                  currentStepData.position === 'top' ? '-100%' : 
                  currentStepData.position === 'bottom' ? '0%' : '-50%'
                })`
              }}
            >
              <Card className="w-80 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      Step {currentStep + 1} of {steps.length}
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSkip}
                          className="h-6 w-6 p-0"
                          data-testid="button-skip-tour"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Skip tour</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                  <Progress value={progress} className="w-full h-2" />
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentStepData.content}
                  </p>
                  
                  {currentStepData.action === 'click' && (
                    <div className="flex items-center space-x-2 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <i className="fas fa-mouse-pointer text-xs text-primary-foreground"></i>
                      </div>
                      <span className="text-sm font-medium">
                        {currentStepData.actionText || 'Click the highlighted element to continue'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      {steps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleStepClick(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentStep ? 'bg-primary' : 
                            index < currentStep ? 'bg-primary/60' : 'bg-muted'
                          }`}
                          data-testid={`tour-step-${index}`}
                        />
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      {currentStep > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrevious}
                              data-testid="button-tour-previous"
                            >
                              <i className="fas fa-arrow-left mr-2"></i>
                              Previous
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Go to previous step</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            onClick={handleNext}
                            data-testid="button-tour-next"
                          >
                            {currentStep === steps.length - 1 ? (
                              <>
                                <i className="fas fa-check mr-2"></i>
                                Finish
                              </>
                            ) : (
                              <>
                                Next
                                <i className="fas fa-arrow-right ml-2"></i>
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{currentStep === steps.length - 1 ? 'Complete the tour' : 'Go to next step'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow pointer */}
              <div 
                className={`absolute w-0 h-0 ${
                  currentStepData.position === 'top' ? 'top-full border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-background' :
                  currentStepData.position === 'bottom' ? 'bottom-full border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-background' :
                  currentStepData.position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-background' :
                  'right-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-background'
                } ${
                  currentStepData.position === 'top' || currentStepData.position === 'bottom' ? 'left-1/2 transform -translate-x-1/2' : ''
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CSS for highlight effect */}
      <style>{`
        .tour-highlight {
          position: relative !important;
          z-index: 51 !important;
          box-shadow: 0 0 0 4px rgba(var(--primary), 0.3), 0 0 20px rgba(var(--primary), 0.2) !important;
          border-radius: 8px !important;
          animation: tour-pulse 2s infinite !important;
        }
        
        @keyframes tour-pulse {
          0%, 100% { 
            box-shadow: 0 0 0 4px rgba(var(--primary), 0.3), 0 0 20px rgba(var(--primary), 0.2);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(var(--primary), 0.5), 0 0 30px rgba(var(--primary), 0.4);
          }
        }
      `}</style>
    </TooltipProvider>
  );
}