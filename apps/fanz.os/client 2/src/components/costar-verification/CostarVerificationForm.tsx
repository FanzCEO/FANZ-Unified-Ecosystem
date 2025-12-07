import { useState, useEffect } from 'react';
import { useParams, useHistory } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';

// Complete costar form schema matching the attached document
const costarFormSchema = z.object({
  // Personal Information
  legalName: z.string().min(1, 'Legal name is required'),
  stageName: z.string().optional(),
  maidenName: z.string().optional(),
  previousLegalName: z.string().optional(),
  otherKnownNames: z.string().optional(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  age: z.number().min(18, 'Must be 18 or older'),
  
  // Identification
  idType: z.enum(['drivers_license', 'passport', 'social_security', 'other']),
  idNumber: z.string().min(1, 'ID number is required'),
  idState: z.string().optional(),
  idCountry: z.string().default('US'),
  
  // Contact Information
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  cellPhone: z.string().optional(),
  homePhone: z.string().optional(),
  
  // Content Information
  primaryCreatorName: z.string().min(1, 'Primary creator name is required'),
  contentCreationDate: z.string().min(1, 'Content creation date is required'),
  
  // Legal Certifications - All required
  is18OrOlder: z.boolean().refine(val => val === true, 'Must certify you are 18 or older'),
  disclosedAllNames: z.boolean().refine(val => val === true, 'Must certify you disclosed all names'),
  providedAccurateId: z.boolean().refine(val => val === true, 'Must certify accurate ID provided'),
  noIllegalActs: z.boolean().refine(val => val === true, 'Must certify no illegal acts'),
  freeWillParticipation: z.boolean().refine(val => val === true, 'Must certify free will participation'),
  
  // Signatures
  costarSignature: z.string().min(1, 'Co-star signature is required'),
  primaryCreatorSignature: z.string().min(1, 'Primary creator signature is required'),
  signatureDate: z.string().min(1, 'Signature date is required'),
  
  // File upload URL (will be set by object uploader)
  idImageUrl: z.string().min(1, 'ID image is required')
});

type CostarFormData = z.infer<typeof costarFormSchema>;

interface FormInfo {
  invitation: {
    id: string;
    costarName: string;
    costarEmail: string;
    primaryCreatorId: string;
  };
  primaryCreatorInfo: {
    displayName: string;
    username: string;
    profileImageUrl?: string;
  };
  isValid: boolean;
}

export function CostarVerificationForm() {
  const { token } = useParams();
  const [, setLocation] = useHistory();
  const { toast } = useToast();
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number>(0);

  const form = useForm<CostarFormData>({
    resolver: zodResolver(costarFormSchema),
    defaultValues: {
      idCountry: 'US',
      is18OrOlder: false,
      disclosedAllNames: false,
      providedAccurateId: false,
      noIllegalActs: false,
      freeWillParticipation: false,
    }
  });

  useEffect(() => {
    if (token) {
      loadFormInfo();
    }
  }, [token]);

  // Calculate age when date of birth changes
  useEffect(() => {
    const dateOfBirth = form.watch('dateOfBirth');
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      setCalculatedAge(age);
      form.setValue('age', age);
    }
  }, [form.watch('dateOfBirth')]);

  const loadFormInfo = async () => {
    try {
      const response = await fetch(`/api/compliance/costar-form/${token}`);
      if (!response.ok) throw new Error('Failed to load form');
      
      const info = await response.json();
      if (!info.isValid) {
        toast({
          title: 'Invalid Link',
          description: 'This verification link has expired or is invalid.',
          variant: 'destructive'
        });
        setLocation('/');
        return;
      }
      
      setFormInfo(info);
      
      // Pre-fill some form fields
      form.setValue('costarName', info.invitation.costarName);
      form.setValue('primaryCreatorName', info.primaryCreatorInfo.displayName);
      
    } catch (error) {
      console.error('Error loading form info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification form',
        variant: 'destructive'
      });
      setLocation('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest('/api/objects/upload', { method: 'POST' });
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    if (result.successful?.[0]?.uploadURL) {
      form.setValue('idImageUrl', result.successful[0].uploadURL);
      toast({
        title: 'Success',
        description: 'ID image uploaded successfully',
      });
    }
  };

  const onSubmit = async (data: CostarFormData) => {
    try {
      setIsSubmitting(true);

      // Validate age
      if (data.age < 18) {
        toast({
          title: 'Age Verification Failed',
          description: 'You must be 18 or older to complete this verification',
          variant: 'destructive'
        });
        return;
      }

      const response = await apiRequest(`/api/compliance/costar-complete/${token}`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          dateOfBirth: new Date(data.dateOfBirth),
          contentCreationDate: new Date(data.contentCreationDate),
          signatureDate: new Date(data.signatureDate),
        }),
      });

      toast({
        title: 'Success!',
        description: 'Your verification form has been submitted successfully. You will receive a confirmation email shortly.',
      });

      // Redirect to success page
      setLocation('/costar/verification-submitted');
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit verification form',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="loading-form">
        <div>Loading verification form...</div>
      </div>
    );
  }

  if (!formInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen" data-testid="form-not-found">
        <div>Form not found or expired</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="costar-verification-form">
      <Card>
        <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl">Adult Co-Star Model Release: 2257 and Agreement</CardTitle>
          <p className="text-sm opacity-90">Fanz™ Unlimited Network LLC</p>
          <p className="text-xs mt-2">
            This form is required for compliance with 18 U.S.C. § 2257 for content collaboration with{' '}
            <strong>{formInfo.primaryCreatorInfo.displayName}</strong>
          </p>
        </CardHeader>

        <CardContent className="space-y-8 p-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Important Information</h3>
            <p className="text-sm text-blue-700 mt-1">
              This form is required by federal law and ensures all participants in adult content are 18+ years old.
              Your information is encrypted and stored securely for compliance purposes only.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Co-Star Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="legalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Legal Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full legal name" {...field} data-testid="input-legal-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage Name (if any)</FormLabel>
                        <FormControl>
                          <Input placeholder="Stage name" {...field} data-testid="input-stage-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maidenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maiden Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Maiden name" {...field} data-testid="input-maiden-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="previousLegalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Previous Legal Name (if any)</FormLabel>
                        <FormControl>
                          <Input placeholder="Previous legal name" {...field} data-testid="input-previous-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="otherKnownNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Names Known By</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any other names you have been known by" 
                          {...field} 
                          data-testid="textarea-other-names"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-birth-date" />
                        </FormControl>
                        <FormMessage />
                        {calculatedAge > 0 && (
                          <p className="text-sm text-gray-600">Age: {calculatedAge} years old</p>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Identification</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="idType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-id-type">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="drivers_license">Driver's License</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="social_security">Social Security</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="idNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="ID number" {...field} data-testid="input-id-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="idState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} data-testid="input-id-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Contact Information</h3>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP code" {...field} data-testid="input-zip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cellPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Cell phone" {...field} data-testid="input-cell-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="homePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Home phone" {...field} data-testid="input-home-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Content Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Primary Creator Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryCreatorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Creator Name *</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-gray-100" data-testid="input-creator-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contentCreationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Content Creation *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-content-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ID Upload */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Document Upload</h3>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Please upload a clear photo of your government-issued ID. This will be encrypted and stored securely.
                  </p>
                  
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full"
                  >
                    <div className="flex items-center gap-2" data-testid="upload-id-button">
                      <span>📄</span>
                      <span>Upload Government ID</span>
                    </div>
                  </ObjectUploader>
                  
                  {form.formState.errors.idImageUrl && (
                    <p className="text-sm text-red-600">ID image is required</p>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Certification and Agreement</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is18OrOlder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-18-older"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I certify that I am 18 years of age or older *</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="disclosedAllNames"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-disclosed-names"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I certify I have disclosed all other names I have been known by *</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="providedAccurateId"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-accurate-id"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I certify I have provided accurate identification *</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="noIllegalActs"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-no-illegal"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I certify I will not engage in any illegal acts *</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="freeWillParticipation"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-free-will"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I certify I am entering this agreement freely and without coercion *</FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Signatures */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Signatures</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="costarSignature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Signature *</FormLabel>
                        <FormControl>
                          <Input placeholder="Type your full name as signature" {...field} data-testid="input-costar-signature" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="signatureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-signature-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="primaryCreatorSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Creator Signature *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Primary creator must sign here" 
                          {...field} 
                          data-testid="input-creator-signature"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Legal Notice */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h4 className="font-semibold text-yellow-800">Sworn Statement</h4>
                <p className="text-sm text-yellow-700 mt-2">
                  <strong>UNDER 28 U.S.C. § 1746 AND PENALTIES OF PERJURY:</strong><br />
                  By submitting this form, you swear that the foregoing information is true and correct.
                  You also confirm that each identification document provided is valid, lawfully obtained,
                  and has not been forged or altered.
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting || calculatedAge < 18}
                  className="w-full md:w-auto px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-pink-600"
                  data-testid="button-submit-verification"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Verification Form'}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}