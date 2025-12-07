import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { kycSchema, type KycForm } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  IdCard,
  MapPin,
  FileText,
  Shield,
  Check,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function KYCForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [deviceFingerprint, setDeviceFingerprint] = useState("");

  const form = useForm<KycForm>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      ageConsent: false,
      compliance2257: false,
      platformPolicies: false,
      ndaAgreement: false,
      ipAssignment: false,
    },
  });

  // Generate device fingerprint on component mount
  useEffect(() => {
    const generateFingerprint = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx!.textBaseline = "top";
      ctx!.font = "14px Arial";
      ctx!.fillText("Device fingerprint", 2, 2);

      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
      ].join("|");

      setDeviceFingerprint(btoa(fingerprint).substring(0, 32));
    };

    generateFingerprint();

    // Get geolocation if possible
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {}, // We don't store the actual coordinates for privacy
        () => {}, // Ignore errors
      );
    }
  }, []);

  const kycMutation = useMutation({
    mutationFn: async (data: KycForm) => {
      // Add forensic data
      const forensicData = {
        ...data,
        ipAddress: "", // Will be captured server-side
        userAgent: navigator.userAgent,
        deviceFingerprint,
        geolocation: "", // Would be captured if user consents
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/compliance/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forensicData),
      });
      if (!response.ok) {
        throw new Error("KYC submission failed");
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: "KYC Information Submitted",
        description:
          "Your identity verification is being processed. Next, we'll collect your consent forms.",
      });
      navigate("/compliance/star-consent");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description:
          error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: KycForm) => {
    kycMutation.mutate(data);
  };

  const validateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return false;

    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      return age - 1 >= 18;
    }

    return age >= 18;
  };

  const watchedValues = form.watch();
  const isStep1Complete =
    watchedValues.firstName &&
    watchedValues.lastName &&
    validateAge(watchedValues.dateOfBirth);
  const isStep2Complete =
    watchedValues.streetAddress &&
    watchedValues.city &&
    watchedValues.state &&
    watchedValues.postalCode &&
    watchedValues.country;
  const isStep3Complete =
    watchedValues.ageConsent &&
    watchedValues.compliance2257 &&
    watchedValues.platformPolicies &&
    watchedValues.ndaAgreement &&
    watchedValues.ipAssignment;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900 via-background to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Progress Header */}
        <Card className="border-2 border-cyan-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              <IdCard className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              Identity Verification
            </CardTitle>
            <CardDescription className="text-lg">
              Complete your KYC (Know Your Customer) verification to ensure
              platform compliance
            </CardDescription>

            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-8 mt-6">
              <div
                className={`flex flex-col items-center ${isStep1Complete ? "text-green-400" : currentStep === 1 ? "text-cyan-400" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${isStep1Complete ? "bg-green-500 border-green-500" : currentStep === 1 ? "bg-cyan-500 border-cyan-500" : "border-muted-foreground"}`}
                >
                  {isStep1Complete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>1</span>
                  )}
                </div>
                <span className="text-sm mt-1">Personal Info</span>
              </div>

              <ChevronRight className="text-muted-foreground" />

              <div
                className={`flex flex-col items-center ${isStep2Complete ? "text-green-400" : currentStep === 2 ? "text-cyan-400" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${isStep2Complete ? "bg-green-500 border-green-500" : currentStep === 2 ? "bg-cyan-500 border-cyan-500" : "border-muted-foreground"}`}
                >
                  {isStep2Complete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>2</span>
                  )}
                </div>
                <span className="text-sm mt-1">Address</span>
              </div>

              <ChevronRight className="text-muted-foreground" />

              <div
                className={`flex flex-col items-center ${isStep3Complete ? "text-green-400" : currentStep === 3 ? "text-cyan-400" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${isStep3Complete ? "bg-green-500 border-green-500" : currentStep === 3 ? "bg-cyan-500 border-cyan-500" : "border-muted-foreground"}`}
                >
                  {isStep3Complete ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>3</span>
                  )}
                </div>
                <span className="text-sm mt-1">Agreements</span>
              </div>
            </div>

            <Progress value={(currentStep / 3) * 100} className="mt-4" />
          </CardHeader>
        </Card>

        {/* KYC Form */}
        <Card className="border-2 border-cyan-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
            <CardDescription>
              All information is encrypted with AES-256 and stored securely in
              our FanzHubVault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Step 1: Personal Details */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-purple-400">
                    <IdCard className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">Personal Details</h3>
                    {isStep1Complete && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-400"
                      >
                        Complete
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                              data-testid="input-kyc-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                              data-testid="input-kyc-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            data-testid="input-kyc-dob"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-yellow-400 flex items-center">
                          <Shield className="w-4 h-4 mr-1" />
                          You must be 18 or older to use this platform
                        </p>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Step 2: Address Information */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center space-x-2 text-green-400">
                    <MapPin className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      Address Information
                    </h3>
                    {isStep2Complete && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-400"
                      >
                        Complete
                      </Badge>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="streetAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your street address"
                            {...field}
                            data-testid="input-kyc-address"
                          />
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
                            <Input
                              placeholder="City"
                              {...field}
                              data-testid="input-kyc-city"
                            />
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
                          <FormLabel>State/Province *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="State/Province"
                              {...field}
                              data-testid="input-kyc-state"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Postal Code"
                              {...field}
                              data-testid="input-kyc-postal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your country"
                            {...field}
                            data-testid="input-kyc-country"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Step 3: Required Agreements */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="flex items-center space-x-2 text-orange-400">
                    <FileText className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      Required Agreements
                    </h3>
                    {isStep3Complete && (
                      <Badge
                        variant="secondary"
                        className="bg-green-500/20 text-green-400"
                      >
                        Complete
                      </Badge>
                    )}
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="ageConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kyc-age-consent"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              I confirm that I am at least 18 years of age and
                              have provided valid identification
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compliance2257"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kyc-2257-compliance"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              I understand and agree to comply with USC 2257
                              record-keeping requirements
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="platformPolicies"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kyc-platform-policies"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              I agree to the{" "}
                              <a
                                href="/policies"
                                className="text-cyan-400 hover:text-cyan-300 underline"
                              >
                                platform policies
                              </a>{" "}
                              and{" "}
                              <a
                                href="/terms"
                                className="text-cyan-400 hover:text-cyan-300 underline"
                              >
                                terms of service
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ndaAgreement"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kyc-nda"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              I agree to the Non-Disclosure Agreement and
                              confidentiality terms
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ipAssignment"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-kyc-ip-assignment"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              I understand and agree to intellectual property
                              assignment terms
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
                  disabled={
                    kycMutation.isPending ||
                    !isStep1Complete ||
                    !isStep2Complete ||
                    !isStep3Complete
                  }
                  data-testid="button-submit-kyc"
                >
                  {kycMutation.isPending ? (
                    "Processing Verification..."
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Complete KYC Verification
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-green-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Your Data is Protected
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We use enterprise-grade encryption and security measures to
                  protect your personal information. Your data is never shared
                  with third parties without your explicit consent.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>AES-256 encryption at rest</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>TLS 1.2+ in transit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Immutable audit trails</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>2257 compliant storage</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
