import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Users, 
  GraduationCap,
  PlayCircle,
  Star
} from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Tutorial {
  id: string;
  title: string;
  summary: string;
  roleTarget: 'fan' | 'creator' | 'admin' | 'all';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  coverImageUrl?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface TutorialStep {
  id: string;
  tutorialId: string;
  stepNumber: number;
  title: string;
  body: string;
  mediaUrl?: string;
  checklist?: string;
  createdAt: string;
}

interface TutorialProgress {
  id: string;
  tutorialId: string;
  userId: string;
  completedStep: number;
  startedAt: string;
  completedAt?: string;
}

export default function TutorialDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const tutorialId = params.id;

  const [currentStep, setCurrentStep] = useState(0);

  // Fetch tutorial details
  const { data: tutorialData, isLoading: tutorialLoading } = useQuery<{ tutorial: Tutorial }>({
    queryKey: ['/api/tutorials', tutorialId],
    queryFn: () => fetch(`/api/tutorials/${tutorialId}`).then(res => res.json()),
    enabled: !!tutorialId,
  });

  // Fetch tutorial steps
  const { data: stepsData, isLoading: stepsLoading } = useQuery<{ steps: TutorialStep[] }>({
    queryKey: ['/api/tutorials', tutorialId, 'steps'],
    queryFn: () => fetch(`/api/tutorials/${tutorialId}/steps`).then(res => res.json()),
    enabled: !!tutorialId,
  });

  // Fetch user progress (if authenticated)
  const { data: progressData } = useQuery<{ progress: TutorialProgress }>({
    queryKey: ['/api/tutorials', tutorialId, 'progress'],
    queryFn: () => fetch(`/api/tutorials/${tutorialId}/progress`).then(res => res.json()),
    enabled: isAuthenticated && !!tutorialId,
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: (stepIndex: number) => 
      apiRequest('PUT', `/api/tutorials/${tutorialId}/progress`, { stepIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tutorials', tutorialId, 'progress'] });
    },
  });

  const tutorial = tutorialData?.tutorial;
  const steps = stepsData?.steps || [];
  const progress = progressData?.progress;

  // Set current step based on progress
  if (progress && currentStep === 0) {
    setCurrentStep(progress.completedStep);
  }

  const handleStepComplete = () => {
    if (isAuthenticated) {
      const nextStep = currentStep + 1;
      updateProgressMutation.mutate(nextStep);
      if (nextStep < steps.length) {
        setCurrentStep(nextStep);
      }
    } else {
      // For non-authenticated users, just move to next step locally
      if (currentStep + 1 < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-600';
      case 'intermediate':
        return 'bg-yellow-600';
      case 'advanced':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'creator':
        return 'text-pink-400 border-pink-600';
      case 'fan':
        return 'text-blue-400 border-blue-600';
      case 'admin':
        return 'text-purple-400 border-purple-600';
      default:
        return 'text-cyan-400 border-cyan-600';
    }
  };

  if (tutorialLoading || stepsLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gf-snow mb-4">Tutorial not found</h1>
        <Button 
          onClick={() => setLocation('/tutorials')}
          className="bg-gf-gradient hover:shadow-glow-pink"
          data-testid="button-back-to-tutorials"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tutorials
        </Button>
      </div>
    );
  }

  const progressPercentage = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;
  const isCompleted = currentStep >= steps.length - 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/tutorials')}
          className="text-gf-smoke hover:text-gf-snow mb-4"
          data-testid="button-back-to-tutorials"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tutorials
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-gf-snow mb-2" data-testid="text-tutorial-title">
              {tutorial.title}
            </h1>
            <p className="text-gf-smoke text-base sm:text-lg mb-4">{tutorial.summary}</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <Badge 
                variant="outline" 
                className={getRoleColor(tutorial.roleTarget)}
                data-testid={`badge-role-${tutorial.roleTarget}`}
              >
                <Users className="w-3 h-3 mr-1" />
                {tutorial.roleTarget}
              </Badge>
              
              <Badge 
                className={`${getDifficultyColor(tutorial.difficulty)} text-white`}
                data-testid={`badge-difficulty-${tutorial.difficulty}`}
              >
                <GraduationCap className="w-3 h-3 mr-1" />
                {tutorial.difficulty}
              </Badge>
              
              <Badge variant="outline" className="text-gf-smoke border-gf-smoke">
                <Clock className="w-3 h-3 mr-1" />
                {tutorial.estimatedMinutes} min
              </Badge>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="glass-overlay rounded-lg p-4 w-full lg:min-w-[250px] lg:w-auto">
            <div className="text-center mb-3">
              <div className="text-2xl font-bold text-gf-pink" data-testid="text-progress-percentage">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-sm text-gf-smoke">Progress</div>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-3 mb-2" 
              data-testid="progress-bar"
            />
            <div className="text-xs text-gf-smoke text-center">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Content */}
      {steps.length > 0 && (
        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="glass-overlay border-gf-violet/30">
              <CardHeader>
                <CardTitle className="text-gf-snow flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-gf-pink" />
                  Tutorial Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full text-left p-2 sm:p-3 rounded-lg transition-colors ${
                        index === currentStep 
                          ? 'bg-gf-gradient text-gf-snow' 
                          : 'bg-gf-dark/30 text-gf-smoke hover:bg-gf-dark/50'
                      }`}
                      data-testid={`button-step-${index + 1}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          index <= currentStep 
                            ? 'bg-gf-pink text-white' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {index < currentStep ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium truncate">{step.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="glass-overlay border-gf-violet/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gf-snow text-base sm:text-lg" data-testid="text-current-step-title">
                    Step {currentStep + 1}: {steps[currentStep]?.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousStep}
                        className="border-gf-violet text-gf-violet hover:bg-gf-violet/10"
                        data-testid="button-previous-step"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                    )}
                    {currentStep < steps.length - 1 ? (
                      <Button
                        size="sm"
                        onClick={handleStepComplete}
                        className="bg-gf-gradient hover:shadow-glow-pink"
                        data-testid="button-complete-step"
                      >
                        Complete Step
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleStepComplete}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-complete-tutorial"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete Tutorial
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gf-smoke leading-relaxed text-lg" data-testid="text-step-content">
                    {steps[currentStep]?.body}
                  </p>
                  
                  {steps[currentStep]?.mediaUrl && (
                    <div className="mt-6">
                      <img 
                        src={steps[currentStep].mediaUrl} 
                        alt={`Step ${currentStep + 1} illustration`}
                        className="rounded-lg shadow-lg max-w-full h-auto"
                        data-testid="img-step-media"
                      />
                    </div>
                  )}
                </div>

                {isCompleted && (
                  <div className="mt-8 p-6 bg-green-600/20 border border-green-600/50 rounded-lg text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-green-400 mb-2">Tutorial Completed!</h3>
                    <p className="text-gf-smoke mb-4">
                      Congratulations! You've successfully completed this tutorial.
                    </p>
                    <Button 
                      onClick={() => setLocation('/tutorials')}
                      className="bg-gf-gradient hover:shadow-glow-pink"
                      data-testid="button-explore-more-tutorials"
                    >
                      Explore More Tutorials
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {steps.length === 0 && (
        <Card className="glass-overlay border-gf-violet/30 text-center py-12">
          <CardContent>
            <GraduationCap className="w-16 h-16 text-gf-smoke mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gf-snow mb-2">No Steps Available</h3>
            <p className="text-gf-smoke">
              This tutorial is still being prepared. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}