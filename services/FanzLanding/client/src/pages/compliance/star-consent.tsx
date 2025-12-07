import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { starConsentSchema, type StarConsentForm } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  IdCard,
  DollarSign,
  Users,
  PenTool,
  Shield,
  Upload,
  Calendar,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function StarConsentForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showCostarSection, setShowCostarSection] = useState(false);

  const form = useForm<StarConsentForm>({
    resolver: zodResolver(starConsentSchema),
    defaultValues: {
      creatorName: "",
      creatorStageName: "",
      creatorEmail: "",
      creatorIdType: "drivers_license",
      creatorIdNumber: "",
      creatorIdStateCountry: "",
      creatorDob: "",
      compensationTerms: "",
      hasCostar: false,
      ageVerification: false,
      contentConsent: false,
      platformConsent: false,
      withdrawalUnderstanding: false,
      legalAgreement: false,
      digitalSignature: "",
    },
  });

  const consentMutation = useMutation({
    mutationFn: async (data: StarConsentForm) => {
      const forensicData = {
        ...data,
        ipAddress: "", // Captured server-side
        userAgent: navigator.userAgent,
        deviceFingerprint: generateDeviceFingerprint(),
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/compliance/star-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(forensicData),
      });
      if (!response.ok) {
        throw new Error("Consent form submission failed");
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Consent Form Submitted",
        description:
          "Your STAR consent form has been submitted. Next, please upload your required documents.",
      });
      navigate("/compliance/documents");
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

  const generateDeviceFingerprint = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx!.textBaseline = "top";
    ctx!.font = "14px Arial";
    ctx!.fillText("STAR consent fingerprint", 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join("|");

    return btoa(fingerprint).substring(0, 32);
  };

  const onSubmit = (data: StarConsentForm) => {
    consentMutation.mutate(data);
  };

  const watchedValues = form.watch();
  const allConsentChecked =
    watchedValues.ageVerification &&
    watchedValues.contentConsent &&
    watchedValues.platformConsent &&
    watchedValues.withdrawalUnderstanding &&
    watchedValues.legalAgreement;

  // Auto-fill current date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    // We don't auto-fill the signature date as it should be manually entered
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-background to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              <FileText className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              STAR Consent Form
            </CardTitle>
            <CardDescription className="text-lg">
              Complete the consent form to start creating content with full USC
              2257 compliance
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Legal Notice */}
        <Card className="border-2 border-orange-500/20 bg-orange-500/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-orange-400">
                Informed Consent to Comply with MasterCard's Revised Standards
              </h3>
              <p className="text-sm text-muted-foreground">
                For New Specialty Merchant Registration Requirements for Adult
                Content Merchants
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                This Consent Agreement ("Agreement") is a legally binding
                document between the undersigned participants and Fanz Unlimited
                LLC ("Company," "we," "us," or "our"). By signing this
                Agreement, you acknowledge and agree to the terms and conditions
                outlined below regarding your participation in the creation,
                distribution, and use of adult content on platforms owned and
                operated by Fanz Unlimited LLC.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Consent Form */}
        <Card className="border-2 border-purple-500/20 bg-card/95 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Section 1: Creator Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-purple-400">
                    <IdCard className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      1. Content Creator Information
                    </h3>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="creatorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Legal Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your full legal name"
                                {...field}
                                data-testid="input-creator-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creatorStageName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stage Name (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your stage name"
                                {...field}
                                data-testid="input-stage-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="creatorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              {...field}
                              data-testid="input-creator-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 2: Age Verification & ID Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Calendar className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      2. Age Verification & Identification
                    </h3>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 space-y-6">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <strong>2.1 Age Confirmation:</strong> All parties
                        involved in the content creation hereby confirm that
                        they are 18 years of age or older.
                      </p>
                      <p>
                        <strong>2.2 Identification Documentation:</strong> A
                        copy of a valid government-issued ID is required and
                        will be uploaded for age verification purposes.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="creatorIdType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Type of ID Produced *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-2 md:grid-cols-4 gap-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="passport"
                                  id="passport"
                                />
                                <label
                                  htmlFor="passport"
                                  className="text-sm cursor-pointer"
                                >
                                  Passport
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="citizenship"
                                  id="citizenship"
                                />
                                <label
                                  htmlFor="citizenship"
                                  className="text-sm cursor-pointer"
                                >
                                  Citizenship
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="drivers_license"
                                  id="drivers_license"
                                />
                                <label
                                  htmlFor="drivers_license"
                                  className="text-sm cursor-pointer"
                                >
                                  Driver's License
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="military_card"
                                  id="military_card"
                                />
                                <label
                                  htmlFor="military_card"
                                  className="text-sm cursor-pointer"
                                >
                                  Military Card
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="creatorIdNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Number *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter ID number"
                                {...field}
                                data-testid="input-id-number"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creatorIdStateCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Country *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter state or country"
                                {...field}
                                data-testid="input-id-state-country"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="creatorDob"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-creator-dob"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section 3: Scope of Use */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-green-400">
                    <Shield className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">3. Scope of Use</h3>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <strong>3.1 Content Usage:</strong> The content may be
                        used on specific platforms owned and operated by Fanz
                        Unlimited LLC, including potential use in marketing
                        materials.
                      </p>
                      <p>
                        <strong>3.2 Duration of Consent:</strong> For the life
                        of the company and/or its platforms.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Compensation Terms */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-orange-400">
                    <DollarSign className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      4. Compensation Terms
                    </h3>
                  </div>

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="compensationTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compensation Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter compensation details if applicable..."
                              className="min-h-[100px]"
                              {...field}
                              data-testid="textarea-compensation"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-muted-foreground">
                            Any compensation provided in exchange for
                            participation and consent.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Co-Star Section Toggle */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span className="text-sm font-medium">
                        Does this scene include a co-star?
                      </span>
                    </div>
                    <Switch
                      checked={showCostarSection}
                      onCheckedChange={setShowCostarSection}
                      data-testid="switch-costar-toggle"
                    />
                  </div>

                  {showCostarSection && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-purple-400 mb-4">
                        Co-Star Information
                      </h4>
                      <p className="text-sm text-yellow-400 mb-4">
                        Note: Co-star information collection would be
                        implemented with additional form fields for co-star
                        details, consent, and documentation similar to the
                        creator section.
                      </p>
                    </div>
                  )}
                </div>

                {/* Final Consent Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-red-400">
                    <PenTool className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">
                      5. Final Consent & Digital Signature
                    </h3>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 space-y-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ageVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-age-verification"
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
                        name="contentConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-content-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                I consent to the creation, use, editing, and
                                distribution of adult content featuring my
                                likeness
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="platformConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-platform-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                I understand this content will be distributed on
                                Fanz Unlimited LLC platforms and potentially
                                used in marketing materials
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="withdrawalUnderstanding"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-withdrawal-understanding"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                I understand I have the right to withdraw
                                consent during recording, but not after content
                                is distributed
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="legalAgreement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-background/50 rounded-lg border">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-legal-agreement"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                I acknowledge this is a legally binding
                                agreement and I have read and understood all
                                terms
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="digitalSignature"
                      render={({ field }) => (
                        <FormItem className="pt-4 border-t border-border">
                          <FormLabel>Digital Signature *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Type your full legal name as digital signature"
                              {...field}
                              data-testid="input-digital-signature"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-muted-foreground">
                            By typing your name, you are providing a legally
                            binding digital signature
                          </p>
                        </FormItem>
                      )}
                    />

                    <div className="text-center pt-4">
                      <Badge
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-400"
                      >
                        Date: {new Date().toLocaleDateString()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={
                    consentMutation.isPending ||
                    !allConsentChecked ||
                    !watchedValues.digitalSignature
                  }
                  data-testid="button-submit-consent"
                >
                  {consentMutation.isPending ? (
                    "Submitting Consent Form..."
                  ) : (
                    <>
                      <PenTool className="w-4 h-4 mr-2" />
                      Submit Consent Form
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Legal Protection Notice */}
        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Shield className="w-8 h-8 text-green-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Legal Protection & Compliance
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  This consent form ensures full compliance with USC 2257
                  record-keeping requirements and MasterCard's revised standards
                  for adult content merchants. All information is encrypted and
                  stored securely with immutable audit trails.
                </p>
                <div className="text-xs text-green-300 space-y-1">
                  <div>
                    ✓ Forensic tracking (IP, timestamp, device fingerprint)
                  </div>
                  <div>✓ SHA-256 file hashing for integrity</div>
                  <div>✓ Immutable audit trail</div>
                  <div>✓ AES-256 encryption at rest</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
