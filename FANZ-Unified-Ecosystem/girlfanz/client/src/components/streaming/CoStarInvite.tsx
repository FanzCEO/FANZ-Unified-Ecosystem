import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Shield, 
  Send,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface CoStar {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
  status: 'pending' | 'accepted' | 'rejected' | 'joined';
  joinedAt?: string;
}

interface CoStarInviteProps {
  sessionId: string;
  streamId: string;
  coStars: CoStar[];
  onCoStarAdded: (coStar: CoStar) => void;
}

export default function CoStarInvite({ 
  sessionId, 
  streamId, 
  coStars, 
  onCoStarAdded 
}: CoStarInviteProps) {
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingInvites, setPendingInvites] = useState<CoStar[]>([]);

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      // First check if user is verified
      const verificationResponse = await apiRequest('/api/verification/check', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!verificationResponse.isVerified) {
        throw new Error('User must be verified before joining a stream');
      }

      // Send the invite
      const response = await apiRequest('/api/streams/invite-costar', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          streamId,
          email,
        }),
      });

      return response;
    },
    onSuccess: (data) => {
      const newInvite: CoStar = {
        id: data.inviteId,
        userId: data.userId,
        name: data.name || inviteEmail,
        avatarUrl: data.avatarUrl,
        isVerified: true,
        status: 'pending',
      };
      
      setPendingInvites(prev => [...prev, newInvite]);
      setInviteEmail('');
      
      toast({
        title: "Invite sent",
        description: `Invitation sent to ${data.name || inviteEmail}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invite failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Accept co-star mutation
  const acceptCoStarMutation = useMutation({
    mutationFn: async (coStarId: string) => {
      const response = await apiRequest('/api/streams/accept-costar', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          coStarId,
        }),
      });
      return response;
    },
    onSuccess: (data, coStarId) => {
      const coStar = pendingInvites.find(cs => cs.id === coStarId);
      if (coStar) {
        const acceptedCoStar = { ...coStar, status: 'accepted' as const };
        setPendingInvites(prev => prev.filter(cs => cs.id !== coStarId));
        onCoStarAdded(acceptedCoStar);
        
        toast({
          title: "Co-star accepted",
          description: `${coStar.name} can now join your stream`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept co-star",
        variant: "destructive",
      });
    },
  });

  // Reject co-star mutation
  const rejectCoStarMutation = useMutation({
    mutationFn: async (coStarId: string) => {
      const response = await apiRequest('/api/streams/reject-costar', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          coStarId,
        }),
      });
      return response;
    },
    onSuccess: (data, coStarId) => {
      setPendingInvites(prev => prev.filter(cs => cs.id !== coStarId));
      
      toast({
        title: "Co-star rejected",
        description: "The invitation has been declined",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject co-star",
        variant: "destructive",
      });
    },
  });

  // Remove co-star mutation
  const removeCoStarMutation = useMutation({
    mutationFn: async (coStarId: string) => {
      const response = await apiRequest('/api/streams/remove-costar', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          coStarId,
        }),
      });
      return response;
    },
    onSuccess: (data, coStarId) => {
      toast({
        title: "Co-star removed",
        description: "The co-star has been removed from the stream",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove co-star",
        variant: "destructive",
      });
    },
  });

  const handleSendInvite = () => {
    if (inviteEmail.trim()) {
      sendInviteMutation.mutate(inviteEmail.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Send Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Co-Star
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={sendInviteMutation.isPending}
              data-testid="input-costar-email"
            />
            <Button
              onClick={handleSendInvite}
              disabled={!inviteEmail || sendInviteMutation.isPending}
              data-testid="button-send-invite"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Only verified users can join as co-stars</span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`pending-invite-${invite.id}`}
              >
                <div className="flex items-center gap-3">
                  {invite.avatarUrl ? (
                    <img
                      src={invite.avatarUrl}
                      alt={invite.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      {invite.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium">{invite.name}</p>
                    <div className="flex items-center gap-2">
                      {invite.isVerified ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acceptCoStarMutation.mutate(invite.id)}
                    disabled={acceptCoStarMutation.isPending}
                    data-testid={`button-accept-${invite.id}`}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectCoStarMutation.mutate(invite.id)}
                    disabled={rejectCoStarMutation.isPending}
                    data-testid={`button-reject-${invite.id}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Co-Stars */}
      {coStars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Co-Stars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {coStars.map((coStar) => (
              <div
                key={coStar.id}
                className="flex items-center justify-between p-3 border rounded-lg"
                data-testid={`active-costar-${coStar.id}`}
              >
                <div className="flex items-center gap-3">
                  {coStar.avatarUrl ? (
                    <img
                      src={coStar.avatarUrl}
                      alt={coStar.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      {coStar.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium">{coStar.name}</p>
                    <div className="flex items-center gap-2">
                      {coStar.status === 'joined' ? (
                        <Badge className="bg-green-600 text-xs">
                          <span className="animate-pulse mr-1">●</span>
                          Live
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Accepted
                        </Badge>
                      )}
                      {coStar.isVerified && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {coStar.status === 'joined' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeCoStarMutation.mutate(coStar.id)}
                    disabled={removeCoStarMutation.isPending}
                    data-testid={`button-remove-${coStar.id}`}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Verification Warning */}
      {coStars.some(cs => !cs.isVerified) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-900">
                Verification Required
              </p>
              <p className="text-sm text-yellow-700">
                Some co-stars are not verified. They will need to complete age verification before joining the stream.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}