import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Shield, 
  Calendar,
  RefreshCw,
  FileText,
  Camera
} from 'lucide-react';

interface VerificationStatusProps {
  onVerify?: () => void;
  compact?: boolean;
}

export default function VerificationStatus({ onVerify, compact = false }: VerificationStatusProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/verification/status'],
    refetchInterval: (data) => {
      // Poll if verification is in progress
      if (data?.status === 'processing' || data?.status === 'pending') {
        return 5000; // Poll every 5 seconds
      }
      return false;
    }
  });

  const { data: history } = useQuery({
    queryKey: ['/api/verification/history'],
    enabled: !compact
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (verificationStatus?: string) => {
    switch (verificationStatus) {
      case 'verified':
        return 'text-green-500';
      case 'processing':
        return 'text-yellow-500';
      case 'rejected':
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (verificationStatus?: string) => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="h-5 w-5" />;
      case 'processing':
        return <Clock className="h-5 w-5 animate-spin" />;
      case 'rejected':
      case 'failed':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (verificationStatus?: string) => {
    switch (verificationStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">Not Verified</Badge>;
    }
  };

  const daysUntilExpiry = status?.validUntil 
    ? Math.floor((new Date(status.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const needsReverification = status?.status === 'expired' || 
    (status?.status === 'verified' && daysUntilExpiry < 30);

  if (compact) {
    return (
      <div className="flex items-center gap-2" data-testid="verification-status-compact">
        <div className={getStatusColor(status?.status)}>
          {getStatusIcon(status?.status)}
        </div>
        {getStatusBadge(status?.status)}
        {status?.status === 'verified' && status?.validUntil && (
          <span className="text-xs text-muted-foreground">
            Valid until {new Date(status.validUntil).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card data-testid="card-verification-status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Verification
          </CardTitle>
          <CardDescription>
            Your verification status and compliance information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status</span>
              {getStatusBadge(status?.status)}
            </div>

            {status?.status === 'processing' && (
              <>
                <Progress value={75} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Your verification is being processed. This usually takes 1-2 minutes.
                </p>
              </>
            )}

            {status?.status === 'verified' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Identity verified successfully</span>
                </div>
                
                {status.validUntil && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Verified On</p>
                      <p className="text-sm font-medium">
                        {new Date(status.verifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Valid Until</p>
                      <p className="text-sm font-medium">
                        {new Date(status.validUntil).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {needsReverification && (
                  <Alert className="border-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your verification {daysUntilExpiry > 0 ? `expires in ${daysUntilExpiry} days` : 'has expired'}. 
                      Please reverify to maintain access.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {status?.status === 'rejected' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your verification was rejected. {status.rejectionReason || 'Please try again with clearer documents.'}
                </AlertDescription>
              </Alert>
            )}

            {(!status || status.status === 'none') && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Complete identity verification to unlock all creator features and ensure compliance.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Verification Details */}
          {status?.status === 'verified' && status.details && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium">Verification Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Document Type</p>
                    <p className="text-sm">{status.details.documentType || 'ID Document'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Liveness Check</p>
                    <p className="text-sm">Passed</p>
                  </div>
                </div>
              </div>
              {status.details.confidence && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Confidence Score</p>
                  <Progress value={status.details.confidence} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{status.details.confidence}%</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {(status?.status === 'none' || status?.status === 'rejected' || needsReverification) && (
              <Button 
                onClick={onVerify}
                className="flex-1"
                data-testid="button-start-verification"
              >
                <Shield className="h-4 w-4 mr-2" />
                {needsReverification ? 'Reverify Identity' : 'Start Verification'}
              </Button>
            )}
            
            {status?.status === 'verified' && !needsReverification && (
              <Button 
                variant="outline" 
                className="flex-1"
                disabled
                data-testid="button-verified"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Verified
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={getStatusColor(item.status)}>
                      {getStatusIcon(item.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {item.type === 'identity' ? 'Identity Verification' : 'Age Verification'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}