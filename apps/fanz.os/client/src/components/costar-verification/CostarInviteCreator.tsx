import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Copy, QrCode, Mail } from 'lucide-react';

const inviteSchema = z.object({
  costarName: z.string().min(1, 'Co-star name is required'),
  costarEmail: z.string().email('Valid email is required'),
  contentCreationDate: z.string().optional(),
  postId: z.string().optional()
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InvitationResult {
  inviteId: string;
  verificationUrl: string;
  qrCode: string;
  clipboardLink: string;
  message: string;
}

export function CostarInviteCreator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      costarName: '',
      costarEmail: '',
      contentCreationDate: '',
      postId: ''
    }
  });

  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsLoading(true);

      const response = await apiRequest('/api/compliance/costar-verify', {
        method: 'POST',
        body: JSON.stringify(data)
      });

      setInvitationResult(response);
      
      toast({
        title: 'Success!',
        description: 'Co-star verification invitation sent successfully. QR code generated and email sent.',
      });

      // Reset form
      form.reset();
      
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create co-star invitation',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Verification link copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive'
      });
    }
  };

  const downloadQRCode = () => {
    if (!invitationResult?.qrCode) return;
    
    const link = document.createElement('a');
    link.href = invitationResult.qrCode;
    link.download = `costar-verification-qr-${invitationResult.inviteId}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card data-testid="costar-invite-creator">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Create Co-Star Verification Invitation
          </CardTitle>
          <p className="text-sm text-gray-600">
            Send a 2257 compliance verification form to your co-star via email with QR code
          </p>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="costarName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Co-Star Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter co-star's full name" 
                          {...field} 
                          data-testid="input-costar-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costarEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Co-Star Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="costar@example.com" 
                          {...field} 
                          data-testid="input-costar-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contentCreationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Creation Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field} 
                          data-testid="input-content-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Post ID (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Post ID if applicable"
                          {...field} 
                          data-testid="input-post-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full"
                data-testid="button-create-invitation"
              >
                {isLoading ? 'Creating Invitation...' : 'Create & Send Invitation'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Invitation Result */}
      {invitationResult && (
        <Card className="border-green-200 bg-green-50" data-testid="invitation-result">
          <CardHeader className="bg-green-100">
            <CardTitle className="text-green-800">Invitation Created Successfully!</CardTitle>
            <p className="text-sm text-green-700">{invitationResult.message}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Link:</label>
              <div className="flex gap-2">
                <Input 
                  value={invitationResult.verificationUrl} 
                  readOnly 
                  className="font-mono text-xs"
                  data-testid="verification-url"
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(invitationResult.verificationUrl)}
                  data-testid="button-copy-link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => setShowQRDialog(true)}
                variant="outline"
                className="flex items-center gap-2"
                data-testid="button-show-qr"
              >
                <QrCode className="w-4 h-4" />
                View QR Code
              </Button>
              
              <Button 
                onClick={downloadQRCode}
                variant="outline"
                data-testid="button-download-qr"
              >
                Download QR Code
              </Button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-100 p-3 rounded">
              <strong>Next Steps:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Your co-star will receive an email with the verification link</li>
                <li>They can also scan the QR code to access the form</li>
                <li>Once submitted, the form will go to admin review</li>
                <li>You'll be notified when the verification is approved or denied</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md" data-testid="qr-code-dialog">
          <DialogHeader>
            <DialogTitle>Co-Star Verification QR Code</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              {invitationResult?.qrCode && (
                <img 
                  src={invitationResult.qrCode} 
                  alt="Verification QR Code"
                  className="border rounded"
                  data-testid="qr-code-image"
                />
              )}
            </div>
            
            <p className="text-sm text-center text-gray-600">
              Your co-star can scan this QR code to access the verification form
            </p>
            
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={downloadQRCode}
                data-testid="button-download-qr-modal"
              >
                Download QR Code
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setShowQRDialog(false)}
                data-testid="button-close-qr-modal"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}