import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Shield, Clock } from 'lucide-react';

export function CostarVerificationSuccess() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl" data-testid="verification-success-page">
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center bg-green-100 rounded-t-lg">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            Verification Submitted Successfully!
          </CardTitle>
          <p className="text-green-700 mt-2">
            Your 2257 co-star verification form has been received
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              What happens next?
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-l-4 border-l-blue-500">
                <Clock className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <div className="font-medium">Under Review</div>
                  <div className="text-sm text-gray-600">
                    Our compliance team will review your submission within 24-48 hours
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-l-4 border-l-green-500">
                <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium">Email Notification</div>
                  <div className="text-sm text-gray-600">
                    You'll receive an email notification once the review is complete
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-l-4 border-l-purple-500">
                <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <div className="font-medium">Secure Storage</div>
                  <div className="text-sm text-gray-600">
                    Your information is encrypted and stored securely for compliance purposes
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your verification will be linked to the content creator who invited you</li>
              <li>• Records are maintained for 7 years for legal compliance</li>
              <li>• Both you and the primary creator will be notified of the approval status</li>
              <li>• If you have any questions, contact our compliance team</li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Thank you for completing this important compliance requirement.
            </p>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Questions? Email us at{' '}
                <a href="mailto:compliance@fanzunlimited.com" className="text-blue-600 hover:underline">
                  compliance@fanzunlimited.com
                </a>
              </p>
              
              <Link href="/">
                <Button variant="outline" data-testid="button-return-home">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}