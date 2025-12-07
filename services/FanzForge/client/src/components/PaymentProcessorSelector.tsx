import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, ExternalLink, Crown, Shield, Clock, CreditCard, TrendingDown, Euro, Banknote } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentProcessor {
  id: string;
  name: string;
  version: string;
  type: string;
  manifest: {
    displayName: string;
    description: string;
    category: string;
    fees: string;
    features: string[];
    difficulty: string;
    setupTime: string;
    integrationComplexity: string;
    supportedRegions: string[];
    apiDocumentation: string;
    complianceLevel: string;
    chargebackProtection: boolean;
    recurringBilling: boolean;
    ageVerification: boolean;
    discreteBilling: boolean;
    icon: string;
    color: string;
    adultFriendly: boolean;
    recommended: boolean;
    requirements?: string[];
    specialFeatures?: string[];
    useCase?: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface PaymentProcessorSelectorProps {
  selectedProcessors: string[];
  onSelectionChange: (processors: string[]) => void;
  allowMultiple?: boolean;
}

const getProcessorIcon = (iconName: string) => {
  const icons = {
    'credit-card': CreditCard,
    'clock': Clock,
    'shield-check': Shield,
    'euro': Euro,
    'trending-down': TrendingDown,
    'crown': Crown,
    'banknote': Banknote,
  };
  return icons[iconName as keyof typeof icons] || CreditCard;
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

export function PaymentProcessorSelector({ 
  selectedProcessors, 
  onSelectionChange, 
  allowMultiple = false 
}: PaymentProcessorSelectorProps) {
  const { data: processors = [], isLoading } = useQuery<PaymentProcessor[]>({
    queryKey: ['/api/plugins/type/payment'],
  });

  const handleProcessorToggle = (processorId: string) => {
    if (allowMultiple) {
      const newSelection = selectedProcessors.includes(processorId)
        ? selectedProcessors.filter(id => id !== processorId)
        : [...selectedProcessors, processorId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(selectedProcessors.includes(processorId) ? [] : [processorId]);
    }
  };

  const recommendedProcessors = processors.filter(p => p.manifest.recommended);
  const otherProcessors = processors.filter(p => !p.manifest.recommended);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendedProcessors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Recommended for Beginners</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedProcessors.map((processor) => (
              <ProcessorCard
                key={processor.id}
                processor={processor}
                isSelected={selectedProcessors.includes(processor.id)}
                onToggle={() => handleProcessorToggle(processor.id)}
              />
            ))}
          </div>
        </div>
      )}

      {otherProcessors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Advanced Options</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherProcessors.map((processor) => (
              <ProcessorCard
                key={processor.id}
                processor={processor}
                isSelected={selectedProcessors.includes(processor.id)}
                onToggle={() => handleProcessorToggle(processor.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ProcessorCardProps {
  processor: PaymentProcessor;
  isSelected: boolean;
  onToggle: () => void;
}

function ProcessorCard({ processor, isSelected, onToggle }: ProcessorCardProps) {
  const IconComponent = getProcessorIcon(processor.manifest.icon);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary shadow-md ring-2 ring-primary/20' 
            : 'hover:shadow-md border-gray-200 dark:border-gray-700'
        }`}
        onClick={onToggle}
        data-testid={`card-processor-${processor.name.toLowerCase()}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${processor.manifest.color}20`, color: processor.manifest.color }}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {processor.manifest.displayName}
                  {isSelected ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {processor.manifest.category} • {processor.manifest.fees}
                </CardDescription>
              </div>
            </div>
            {processor.manifest.recommended && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                <Crown className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{processor.manifest.description}</p>
          
          <div className="flex flex-wrap gap-2">
            <Badge className={getDifficultyColor(processor.manifest.difficulty)}>
              {processor.manifest.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {processor.manifest.setupTime}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Features:</h4>
            <div className="flex flex-wrap gap-1">
              {processor.manifest.features.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {processor.manifest.features.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{processor.manifest.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {processor.manifest.requirements && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-orange-600">Requirements:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                {processor.manifest.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-orange-500 rounded-full" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Compliance: {processor.manifest.complianceLevel}
            </span>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" asChild>
              <a 
                href={processor.manifest.apiDocumentation} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Docs <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}