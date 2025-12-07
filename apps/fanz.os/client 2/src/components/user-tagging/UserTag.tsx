import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Shield, Eye } from 'lucide-react';

interface UserTagInfo {
  userInfo: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    isVerified: boolean;
    costarVerifications?: any[];
  };
  canViewDetails: boolean;
  costarForms: any[];
}

interface UserTagProps {
  username: string;
  className?: string;
  onClick?: () => void;
}

export function UserTag({ username, className = '', onClick }: UserTagProps) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [tagInfo, setTagInfo] = useState<UserTagInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleTagClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    if (isAdmin) {
      await loadUserTagInfo();
      setShowDialog(true);
    }
  };

  const loadUserTagInfo = async () => {
    try {
      setIsLoading(true);
      const info = await apiRequest(`/api/users/${username}/tag-info`);
      setTagInfo(info);
    } catch (error) {
      console.error('Error loading user tag info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <span 
        className={`tagged-user inline-flex items-center gap-1 cursor-pointer hover:bg-blue-50 px-1 rounded ${className}`}
        onClick={handleTagClick}
        data-testid={`user-tag-${username}`}
      >
        <span className="text-blue-600 font-medium">@{username}</span>
        
        {isAdmin && tagInfo?.userInfo.costarVerifications && tagInfo.userInfo.costarVerifications.length > 0 ? (
          <span className="verified-costar-badge text-yellow-500" title="Has co-star verifications">⭐</span>
        ) : (
          <img 
            src="/assets/fanz-logo-small.png" 
            alt="Fanz Verified Co-Star" 
            className="brand-logo-small w-4 h-4 opacity-70"
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </span>

      {/* Admin Details Dialog */}
      {isAdmin && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="user-tag-details-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                User Tag Details: @{username}
              </DialogTitle>
            </DialogHeader>

            {isLoading ? (
              <div className="flex justify-center py-8" data-testid="loading-tag-info">
                Loading user information...
              </div>
            ) : tagInfo ? (
              <div className="space-y-6">
                
                {/* User Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      {tagInfo.userInfo.profileImageUrl ? (
                        <img 
                          src={tagInfo.userInfo.profileImageUrl} 
                          alt={`${tagInfo.userInfo.displayName}'s profile`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div>
                        <div className="font-medium">{tagInfo.userInfo.displayName}</div>
                        <div className="text-sm text-gray-600">@{tagInfo.userInfo.username}</div>
                        {tagInfo.userInfo.isVerified && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Co-star Verifications */}
                {tagInfo.canViewDetails && tagInfo.costarForms && tagInfo.costarForms.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Co-Star Verifications ({tagInfo.costarForms.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tagInfo.costarForms.map((form, index) => (
                          <div 
                            key={form.id || index} 
                            className="border rounded-lg p-3 space-y-2"
                            data-testid={`costar-form-${index}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {form.role === 'creator' ? 'As Creator' : 'As Co-Star'}
                                </div>
                                {form.costarName && (
                                  <div className="text-sm text-gray-600">
                                    Co-star: {form.costarName}
                                  </div>
                                )}
                                {form.primaryCreatorName && (
                                  <div className="text-sm text-gray-600">
                                    Creator: {form.primaryCreatorName}
                                  </div>
                                )}
                                {form.contentCreationDate && (
                                  <div className="text-xs text-gray-500">
                                    Content Date: {formatDate(form.contentCreationDate)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  className={`${getStatusColor(form.status)} text-white`}
                                  data-testid={`status-badge-${form.status}`}
                                >
                                  {form.status}
                                </Badge>
                                {form.formCompletedAt && (
                                  <div className="text-xs text-gray-500">
                                    Submitted: {formatDate(form.formCompletedAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {form.reviewNotes && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Review Notes:</strong> {form.reviewNotes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {tagInfo.canViewDetails && (!tagInfo.costarForms || tagInfo.costarForms.length === 0) && (
                  <Card>
                    <CardContent className="text-center py-6 text-gray-500">
                      No co-star verifications found for this user
                    </CardContent>
                  </Card>
                )}

                {/* Admin Actions */}
                {tagInfo.canViewDetails && (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDialog(false)}
                      data-testid="button-close-dialog"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500" data-testid="user-not-found">
                User not found
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}