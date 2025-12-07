import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, Eye, Calendar, User, IdCard, Phone, MapPin } from 'lucide-react';

interface CostarVerificationDetails {
  id: string;
  primaryCreatorId: string;
  costarUserId?: string;
  costarEmail: string;
  costarName: string;
  status: 'pending' | 'approved' | 'rejected';
  formCompletedAt?: string;
  createdAt: string;
  complianceRecord?: {
    id: string;
    legalName: string;
    stageName?: string;
    maidenName?: string;
    previousLegalName?: string;
    otherKnownNames?: string;
    dateOfBirth: string;
    age: number;
    idType: string;
    idNumber: string;
    idState?: string;
    idCountry: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    cellPhone?: string;
    homePhone?: string;
    idImageUrl: string;
    formData?: any;
  };
  primaryCreator?: {
    id: string;
    displayName: string;
    username: string;
    email: string;
  };
}

interface PendingVerification {
  id: string;
  costarName: string;
  costarEmail: string;
  primaryCreatorName: string;
  formCompletedAt: string;
  status: string;
}

export function CostarVerificationReview() {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<CostarVerificationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      setIsLoading(true);
      const verifications = await apiRequest('/api/admin/costar-verifications/pending');
      setPendingVerifications(verifications);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load pending verifications',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerificationDetails = async (verificationId: string) => {
    try {
      const details = await apiRequest(`/api/admin/costar-verifications/${verificationId}`);
      setSelectedVerification(details);
      setShowDetailsDialog(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load verification details',
        variant: 'destructive'
      });
    }
  };

  const reviewVerification = async (verificationId: string, status: 'approved' | 'rejected') => {
    try {
      setIsReviewing(true);

      await apiRequest(`/api/admin/costar-verifications/${verificationId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes || undefined
        })
      });

      toast({
        title: 'Success',
        description: `Verification ${status} successfully`
      });

      // Refresh the list
      await loadPendingVerifications();
      setShowDetailsDialog(false);
      setReviewNotes('');
      setSelectedVerification(null);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to review verification',
        variant: 'destructive'
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIdTypeLabel = (idType: string) => {
    const types: Record<string, string> = {
      drivers_license: "Driver's License",
      passport: 'Passport',
      social_security: 'Social Security',
      other: 'Other'
    };
    return types[idType] || idType;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="loading-verifications">
        <div>Loading pending verifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="costar-verification-review">
      <Card>
        <CardHeader>
          <CardTitle>Co-Star Verification Review</CardTitle>
          <p className="text-sm text-gray-600">
            Review and approve/deny co-star 2257 compliance verifications
          </p>
        </CardHeader>

        <CardContent>
          {pendingVerifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500" data-testid="no-pending-verifications">
              No pending verifications to review
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((verification) => (
                <Card key={verification.id} className="border-l-4 border-l-yellow-500" data-testid={`verification-${verification.id}`}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{verification.costarName}</span>
                          <Badge variant="outline" data-testid={`status-${verification.status}`}>
                            {verification.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Email: {verification.costarEmail}</div>
                          <div>Primary Creator: {verification.primaryCreatorName}</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Submitted: {formatDate(verification.formCompletedAt)}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => loadVerificationDetails(verification.id)}
                        variant="outline"
                        size="sm"
                        data-testid={`button-review-${verification.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="verification-details-dialog">
          <DialogHeader>
            <DialogTitle>Co-Star Verification Details</DialogTitle>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{selectedVerification.costarName}</h3>
                  <p className="text-sm text-gray-600">{selectedVerification.costarEmail}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {selectedVerification.formCompletedAt && formatDate(selectedVerification.formCompletedAt)}
                  </p>
                </div>
                <Badge variant={selectedVerification.status === 'pending' ? 'default' : 
                              selectedVerification.status === 'approved' ? 'success' : 'destructive'}>
                  {selectedVerification.status}
                </Badge>
              </div>

              {/* Primary Creator Info */}
              {selectedVerification.primaryCreator && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Primary Creator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Name:</strong> {selectedVerification.primaryCreator.displayName}</div>
                    <div><strong>Username:</strong> @{selectedVerification.primaryCreator.username}</div>
                    <div><strong>Email:</strong> {selectedVerification.primaryCreator.email}</div>
                  </CardContent>
                </Card>
              )}

              {/* Compliance Record Details */}
              {selectedVerification.complianceRecord && (
                <div className="space-y-4">
                  
                  {/* Personal Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><strong>Legal Name:</strong> {selectedVerification.complianceRecord.legalName}</div>
                      {selectedVerification.complianceRecord.stageName && (
                        <div><strong>Stage Name:</strong> {selectedVerification.complianceRecord.stageName}</div>
                      )}
                      {selectedVerification.complianceRecord.maidenName && (
                        <div><strong>Maiden Name:</strong> {selectedVerification.complianceRecord.maidenName}</div>
                      )}
                      {selectedVerification.complianceRecord.previousLegalName && (
                        <div><strong>Previous Legal Name:</strong> {selectedVerification.complianceRecord.previousLegalName}</div>
                      )}
                      <div><strong>Date of Birth:</strong> {new Date(selectedVerification.complianceRecord.dateOfBirth).toLocaleDateString()}</div>
                      <div><strong>Age:</strong> {selectedVerification.complianceRecord.age} years old</div>
                    </CardContent>
                  </Card>

                  {/* Identification */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <IdCard className="w-4 h-4" />
                        Identification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><strong>ID Type:</strong> {getIdTypeLabel(selectedVerification.complianceRecord.idType)}</div>
                      <div><strong>ID Number:</strong> {selectedVerification.complianceRecord.idNumber.replace(/(.{4})/g, '$1-')}</div>
                      {selectedVerification.complianceRecord.idState && (
                        <div><strong>State:</strong> {selectedVerification.complianceRecord.idState}</div>
                      )}
                      <div><strong>Country:</strong> {selectedVerification.complianceRecord.idCountry}</div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div><strong>Address:</strong> {selectedVerification.complianceRecord.address}</div>
                      <div>
                        <strong>City, State ZIP:</strong> {selectedVerification.complianceRecord.city}, {selectedVerification.complianceRecord.state} {selectedVerification.complianceRecord.zipCode}
                      </div>
                      {(selectedVerification.complianceRecord.cellPhone || selectedVerification.complianceRecord.homePhone) && (
                        <div className="flex items-center gap-4">
                          <Phone className="w-4 h-4" />
                          {selectedVerification.complianceRecord.cellPhone && <span>Cell: {selectedVerification.complianceRecord.cellPhone}</span>}
                          {selectedVerification.complianceRecord.homePhone && <span>Home: {selectedVerification.complianceRecord.homePhone}</span>}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ID Document */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Uploaded ID Document</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedVerification.complianceRecord.idImageUrl ? (
                        <div className="space-y-2">
                          <img 
                            src={selectedVerification.complianceRecord.idImageUrl} 
                            alt="ID Document"
                            className="max-w-md border rounded shadow-sm"
                            data-testid="id-document-image"
                          />
                          <p className="text-xs text-gray-500">
                            Click to view full size. This document is encrypted and stored securely.
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No ID document available</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Other Known Names */}
                  {selectedVerification.complianceRecord.otherKnownNames && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Other Known Names</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{selectedVerification.complianceRecord.otherKnownNames}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Review Section */}
              <Card className="border-t-4 border-t-blue-500">
                <CardHeader>
                  <CardTitle className="text-base">Admin Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Review Notes (optional)</label>
                    <Textarea
                      placeholder="Add any notes about this verification..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="min-h-[100px]"
                      data-testid="review-notes"
                    />
                  </div>

                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => reviewVerification(selectedVerification.id, 'rejected')}
                      disabled={isReviewing}
                      data-testid="button-reject"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {isReviewing ? 'Processing...' : 'Reject'}
                    </Button>

                    <Button
                      onClick={() => reviewVerification(selectedVerification.id, 'approved')}
                      disabled={isReviewing}
                      data-testid="button-approve"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {isReviewing ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}