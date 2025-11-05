import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, XCircle, Clock, Shield, FileText, User, Camera } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const ageVerificationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  ssn4: z.string().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "ZIP code is required"),
    country: z.string().default("US")
  })
});

const identityVerificationSchema = z.object({
  documentType: z.enum(["drivers_license", "passport", "id_card"]),
  frontImageUrl: z.string().min(1, "Front image is required"),
  backImageUrl: z.string().optional(),
  selfieImageUrl: z.string().min(1, "Selfie is required"),
  documentNumber: z.string().optional()
});

type AgeVerificationForm = z.infer<typeof ageVerificationSchema>;
type IdentityVerificationForm = z.infer<typeof identityVerificationSchema>;

interface VerificationStatus {
  ageVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  lastVerification?: any;
}

export function Verification() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("status");

  // Get verification status
  const { data: verificationStatus, isLoading: statusLoading } = useQuery<VerificationStatus>({
    queryKey: ["/api/verification/status"],
  });

  // Age verification form
  const ageForm = useForm<AgeVerificationForm>({
    resolver: zodResolver(ageVerificationSchema),
    defaultValues: {
      address: {
        country: "US"
      }
    }
  });

  // Identity verification form
  const identityForm = useForm<IdentityVerificationForm>({
    resolver: zodResolver(identityVerificationSchema),
  });

  // Age verification mutation
  const ageVerificationMutation = useMutation({
    mutationFn: (data: AgeVerificationForm) => 
      apiRequest("/api/verification/age", "POST", data),
    onSuccess: (result: any) => {
      toast({
        title: "Age verification submitted",
        description: `Transaction ID: ${result.transactionId}. Status: ${result.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
      setCurrentTab("status");
    },
    onError: (error) => {
      toast({
        title: "Age verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Identity verification mutation
  const identityVerificationMutation = useMutation({
    mutationFn: (data: IdentityVerificationForm) => 
      apiRequest("/api/verification/identity", "POST", data),
    onSuccess: (result: any) => {
      toast({
        title: "Identity verification submitted",
        description: `Transaction ID: ${result.transactionId}. Status: ${result.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/verification/status"] });
      setCurrentTab("status");
    },
    onError: (error) => {
      toast({
        title: "Identity verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    }
  };

  if (statusLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Account Verification
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete age and identity verification to access all platform features
          </p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="age" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Age Verification
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Identity Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Status
                </CardTitle>
                <CardDescription>
                  Current status of your account verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Age Verification</p>
                      <p className="text-sm text-muted-foreground">Verify you are 18 or older</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(verificationStatus?.ageVerified ? 'verified' : 'pending')}
                    <Badge className={getStatusColor(verificationStatus?.ageVerified ? 'verified' : 'pending')}>
                      {verificationStatus?.ageVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Identity Verification</p>
                      <p className="text-sm text-muted-foreground">Verify your identity with documents</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(verificationStatus?.kycStatus || 'pending')}
                    <Badge className={getStatusColor(verificationStatus?.kycStatus || 'pending')}>
                      {verificationStatus?.kycStatus || 'Pending'}
                    </Badge>
                  </div>
                </div>

                {verificationStatus?.lastVerification && (
                  <Alert>
                    <AlertDescription>
                      Last verification attempt: {new Date(verificationStatus.lastVerification.createdAt).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="age" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Verification</CardTitle>
                <CardDescription>
                  Verify that you are 18 years or older using database verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...ageForm}>
                  <form onSubmit={ageForm.handleSubmit((data) => ageVerificationMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={ageForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ageForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={ageForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-date-of-birth" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={ageForm.control}
                        name="ssn4"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last 4 digits of SSN (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="1234" maxLength={4} data-testid="input-ssn4" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ageForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1-555-123-4567" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Address</Label>
                      
                      <FormField
                        control={ageForm.control}
                        name="address.street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-street" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={ageForm.control}
                          name="address.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={ageForm.control}
                          name="address.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="CA" data-testid="input-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={ageForm.control}
                        name="address.zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={ageVerificationMutation.isPending}
                      data-testid="button-submit-age-verification"
                    >
                      {ageVerificationMutation.isPending ? "Verifying..." : "Submit Age Verification"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>
                  Upload government-issued ID and selfie for identity verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...identityForm}>
                  <form onSubmit={identityForm.handleSubmit((data) => identityVerificationMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={identityForm.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-document-type">
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="drivers_license">Driver's License</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="id_card">State ID Card</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={identityForm.control}
                      name="frontImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Front of Document</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input {...field} placeholder="Upload front image URL" data-testid="input-front-image" />
                              <Button type="button" variant="outline" size="sm">
                                <Camera className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {identityForm.watch("documentType") === "drivers_license" && (
                      <FormField
                        control={identityForm.control}
                        name="backImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Back of Driver's License</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input {...field} placeholder="Upload back image URL" data-testid="input-back-image" />
                                <Button type="button" variant="outline" size="sm">
                                  <Camera className="h-4 w-4" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={identityForm.control}
                      name="selfieImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Selfie Photo</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input {...field} placeholder="Upload selfie URL" data-testid="input-selfie-image" />
                              <Button type="button" variant="outline" size="sm">
                                <Camera className="h-4 w-4" />
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={identityForm.control}
                      name="documentNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Number (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="License/ID number" data-testid="input-document-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your documents are encrypted and processed securely by our verification partner.
                        Images are deleted after verification is complete.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={identityVerificationMutation.isPending}
                      data-testid="button-submit-identity-verification"
                    >
                      {identityVerificationMutation.isPending ? "Verifying..." : "Submit Identity Verification"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}