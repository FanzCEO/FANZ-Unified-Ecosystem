import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Shield, Camera, FileText, CheckCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import IDUpload from './IDUpload';
import SelfieCapture from './SelfieCapture';
import VerificationStatus from './VerificationStatus';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mandatory?: boolean;
  userType?: 'creator' | 'co-star';
}

type VerificationStep = 'intro' | 'document' | 'selfie' | 'processing' | 'complete' | 'failed';

export default function VerificationModal({ 
  open, 
  onClose, 
  onSuccess,
  mandatory = false,
  userType = 'creator'
}: VerificationModalProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('intro');
  const [documentData, setDocumentData] = useState<{
    type: string;
    frontImage: string;
    backImage?: string;
  } | null>(null);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check existing verification status
  const { data: verificationStatus } = useQuery({
    queryKey: ['/api/verification/status'],
    enabled: open,
  });

  // Create verification session
  const createSessionMutation = useMutation({
    mutationFn: () => apiRequest('/api/verification/session', {
      method: 'POST',
      body: { userType }
    }),
    onSuccess: (data) => {
      setVerificationId(data.sessionId);
      setCurrentStep('document');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start verification process',
        variant: 'destructive'
      });
    }
  });

  // Submit verification
  const submitVerificationMutation = useMutation({
    mutationFn: () => {
      if (!documentData || !selfieData || !verificationId) {
        throw new Error('Missing verification data');
      }
      
      return apiRequest(`/api/verification/submit/${verificationId}`, {
        method: 'POST',
        body: {
          documentType: documentData.type,
          frontImageBase64: documentData.frontImage,
          backImageBase64: documentData.backImage,
          selfieImageBase64: selfieData,
        }
      });
    },
    onSuccess: (data) => {
      if (data.status === 'verified') {
        setCurrentStep('complete');
        queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
        
        setTimeout(() => {
          onSuccess?.();
          if (!mandatory) onClose();
        }, 2000);
      } else if (data.status === 'rejected') {
        setCurrentStep('failed');
      } else {
        // Review required
        setCurrentStep('processing');
      }
    },
    onError: () => {
      setCurrentStep('failed');
      toast({
        title: 'Verification Failed',
        description: 'Unable to verify your identity. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Check verification result
  const { data: verificationResult } = useQuery({
    queryKey: [`/api/verification/result/${verificationId}`],
    enabled: currentStep === 'processing' && !!verificationId,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  useEffect(() => {
    if (verificationResult?.status === 'verified') {
      setCurrentStep('complete');
      queryClient.invalidateQueries({ queryKey: ['/api/verification/status'] });
      
      setTimeout(() => {
        onSuccess?.();
        if (!mandatory) onClose();
      }, 2000);
    } else if (verificationResult?.status === 'rejected') {
      setCurrentStep('failed');
    }
  }, [verificationResult]);

  // Skip if already verified
  useEffect(() => {
    if (verificationStatus?.verified && verificationStatus?.validUntil) {
      const validUntil = new Date(verificationStatus.validUntil);
      if (validUntil > new Date()) {
        setCurrentStep('complete');
      }
    }
  }, [verificationStatus]);

  const handleDocumentUpload = (data: any) => {
    setDocumentData(data);
    setCurrentStep('selfie');
  };

  const handleSelfieCapture = (selfie: string) => {
    setSelfieData(selfie);
    setCurrentStep('processing');
    submitVerificationMutation.mutate();
  };

  const getStepProgress = () => {
    const steps: Record<VerificationStep, number> = {
      intro: 0,
      document: 33,
      selfie: 66,
      processing: 90,
      complete: 100,
      failed: 0,
    };
    return steps[currentStep];
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2" data-testid="text-verification-title">
                {userType === 'creator' ? 'Creator Verification' : 'Co-Star Verification'}
              </h3>
              <p className="text-muted-foreground">
                Complete a quick identity verification to access all features
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="flex items-start gap-3 pt-4">
                  <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Step 1: Upload ID Document</h4>
                    <p className="text-sm text-muted-foreground">
                      Take a photo of your passport, driver's license, or national ID
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-3 pt-4">
                  <Camera className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Step 2: Take a Selfie</h4>
                    <p className="text-sm text-muted-foreground">
                      We'll match your selfie with your ID photo
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start gap-3 pt-4">
                  <CheckCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">Step 3: Instant Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Get verified in under 2 minutes with AI-powered approval
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your information is encrypted and securely stored in compliance with 18 U.S.C. §2257
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              {!mandatory && (
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
              <Button 
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
                className="flex-1"
                data-testid="button-start-verification"
              >
                Start Verification
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'document':
        return (
          <IDUpload
            onUpload={handleDocumentUpload}
            onBack={() => setCurrentStep('intro')}
          />
        );

      case 'selfie':
        return (
          <SelfieCapture
            onCapture={handleSelfieCapture}
            onBack={() => setCurrentStep('document')}
          />
        );

      case 'processing':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <Clock className="h-16 w-16 text-primary animate-pulse" />
                <div className="absolute inset-0 animate-spin">
                  <div className="h-full w-full rounded-full border-4 border-primary/20 border-t-primary" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-processing">
                Verifying Your Identity
              </h3>
              <p className="text-muted-foreground">
                This usually takes less than 30 seconds...
              </p>
            </div>
            <Progress value={90} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Please don't close this window
            </p>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-verification-complete">
                Verification Complete!
              </h3>
              <p className="text-muted-foreground">
                Your identity has been verified successfully
              </p>
            </div>
            {verificationStatus?.validUntil && (
              <Alert>
                <AlertDescription>
                  Your verification is valid until {new Date(verificationStatus.validUntil).toLocaleDateString()}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'failed':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2" data-testid="text-verification-failed">
                Verification Failed
              </h3>
              <p className="text-muted-foreground">
                We couldn't verify your identity. Please try again.
              </p>
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure your ID is clearly visible and your selfie matches the photo on your ID.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                data-testid="button-close"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  setCurrentStep('intro');
                  setDocumentData(null);
                  setSelfieData(null);
                  setVerificationId(null);
                }}
                className="flex-1"
                data-testid="button-retry"
              >
                Try Again
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={mandatory ? undefined : onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-verification">
        <DialogHeader>
          <DialogTitle>Identity Verification</DialogTitle>
          <DialogDescription>
            Secure, fast verification powered by VerifyMy
          </DialogDescription>
        </DialogHeader>

        {currentStep !== 'intro' && currentStep !== 'failed' && (
          <Progress value={getStepProgress()} className="mb-4" />
        )}

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}