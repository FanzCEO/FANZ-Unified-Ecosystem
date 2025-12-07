import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  User,
  CreditCard,
  FileText,
  Clock,
} from "lucide-react";

type VerificationStep = "info" | "photo" | "id" | "selfie" | "review" | "pending";

export default function VerificationSignup() {
  const [currentStep, setCurrentStep] = useState<VerificationStep>("info");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    profilePhoto: null as File | null,
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    documentType: "drivers_license",
  });

  const steps = [
    { id: "info", name: "Basic Info", icon: User },
    { id: "photo", name: "Profile Photo", icon: Camera },
    { id: "id", name: "ID Verification", icon: CreditCard },
    { id: "selfie", name: "Selfie Verification", icon: Camera },
    { id: "review", name: "Review", icon: FileText },
  ];

  const handleFileUpload = (field: string, file: File) => {
    setFormData({ ...formData, [field]: file });
  };

  const handleSubmit = () => {
    // Simulate submission
    setCurrentStep("pending");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "info":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
            <p className="text-muted-foreground mb-6">
              All information is encrypted and used only for age verification.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-input border-border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-input border-border"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-input border-border"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth *</label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-input border-border"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                You must be 18 or older to use FANZ
              </p>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <div className="flex gap-2">
                <Shield className="w-5 h-5 text-accent flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Privacy Guaranteed</p>
                  <p>
                    Your personal information is encrypted and will never be shared publicly.
                    We use VerifyMy for secure age verification.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep("photo")}
              variant="gradient"
              className="w-full neon-glow"
              size="lg"
            >
              Continue to Profile Photo
            </Button>
          </div>
        );

      case "photo":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Profile Photo</h2>
            <p className="text-muted-foreground mb-6">
              Upload a clear photo of yourself. This will be your profile picture.
            </p>

            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
              {formData.profilePhoto ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary">
                    <img
                      src={URL.createObjectURL(formData.profilePhoto)}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formData.profilePhoto.name}
                  </p>
                  <Button
                    variant="neon-outline"
                    onClick={() => handleFileUpload("profilePhoto", null!)}
                  >
                    Change Photo
                  </Button>
                </div>
              ) : (
                <>
                  <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <p className="mb-4">Click to upload or drag and drop</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload("profilePhoto", e.target.files[0])}
                    className="hidden"
                    id="profile-photo"
                  />
                  <label htmlFor="profile-photo">
                    <Button variant="gradient" className="neon-glow" as Child>
                      <span className="cursor-pointer inline-flex items-center px-6 py-2">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    JPG, PNG or GIF (Max 5MB)
                  </p>
                </>
              )}
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Photo Guidelines:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Clear, well-lit photo of your face</li>
                <li>• No sunglasses or face coverings</li>
                <li>• No filters or heavy editing</li>
                <li>• Face should be clearly visible</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("info")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("id")}
                variant="gradient"
                className="flex-1 neon-glow"
                disabled={!formData.profilePhoto}
              >
                Continue to ID Verification
              </Button>
            </div>
          </div>
        );

      case "id":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">ID Verification</h2>
            <p className="text-muted-foreground mb-6">
              Upload a government-issued ID to verify your age and identity.
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">Document Type</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-md"
              >
                <option value="drivers_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="id_card">National ID Card</option>
              </select>
            </div>

            {/* Front of ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Front of ID *</label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6">
                {formData.idFront ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-sm text-center">{formData.idFront.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileUpload("idFront", null!)}
                      className="w-full"
                    >
                      Replace
                    </Button>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload("idFront", e.target.files[0])}
                      className="hidden"
                      id="id-front"
                    />
                    <label htmlFor="id-front" className="cursor-pointer">
                      <p className="text-sm text-center text-primary hover:text-primary/80">
                        Click to upload front of ID
                      </p>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Back of ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Back of ID *</label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-6">
                {formData.idBack ? (
                  <div className="space-y-2">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                    <p className="text-sm text-center">{formData.idBack.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileUpload("idBack", null!)}
                      className="w-full"
                    >
                      Replace
                    </Button>
                  </div>
                ) : (
                  <>
                    <CreditCard className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files && handleFileUpload("idBack", e.target.files[0])}
                      className="hidden"
                      id="id-back"
                    />
                    <label htmlFor="id-back" className="cursor-pointer">
                      <p className="text-sm text-center text-primary hover:text-primary/80">
                        Click to upload back of ID
                      </p>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• All information on ID must be clearly visible</li>
                    <li>• ID must be current and not expired</li>
                    <li>• No screenshots - original photos only</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("photo")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("selfie")}
                variant="gradient"
                className="flex-1 neon-glow"
                disabled={!formData.idFront || !formData.idBack}
              >
                Continue to Selfie
              </Button>
            </div>
          </div>
        );

      case "selfie":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Selfie Verification</h2>
            <p className="text-muted-foreground mb-6">
              Take a selfie holding your ID next to your face for verification.
            </p>

            <div className="border-2 border-dashed border-primary/30 rounded-lg p-8">
              {formData.selfie ? (
                <div className="space-y-4">
                  <img
                    src={URL.createObjectURL(formData.selfie)}
                    alt="Selfie preview"
                    className="w-full max-w-sm mx-auto rounded-lg"
                  />
                  <p className="text-sm text-center text-muted-foreground">
                    {formData.selfie.name}
                  </p>
                  <Button
                    variant="neon-outline"
                    onClick={() => handleFileUpload("selfie", null!)}
                    className="w-full"
                  >
                    Retake Selfie
                  </Button>
                </div>
              ) : (
                <>
                  <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => e.target.files && handleFileUpload("selfie", e.target.files[0])}
                    className="hidden"
                    id="selfie"
                  />
                  <label htmlFor="selfie">
                    <Button variant="gradient" className="neon-glow w-full" as Child>
                      <span className="cursor-pointer inline-flex items-center justify-center w-full px-6 py-3">
                        <Camera className="w-5 h-5 mr-2" />
                        Take Selfie
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Selfie Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Hold your ID next to your face</li>
                <li>• Your face and ID should both be clearly visible</li>
                <li>• Good lighting - no shadows</li>
                <li>• Look directly at the camera</li>
                <li>• No filters or editing</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("id")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("review")}
                variant="gradient"
                className="flex-1 neon-glow"
                disabled={!formData.selfie}
              >
                Review Submission
              </Button>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Review Your Submission</h2>
            <p className="text-muted-foreground mb-6">
              Please review all information before submitting for moderation.
            </p>

            <Card className="bg-muted/20 border-border">
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{formData.firstName} {formData.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold">{formData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">{formData.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Profile Photo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">ID Verification (Front & Back)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Selfie Verification</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <p className="text-sm">
                <strong>What happens next?</strong>
              </p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>1. Your submission will be reviewed by our moderation team</li>
                <li>2. Age and identity will be verified through VerifyMy</li>
                <li>3. You'll receive an email with your approval status (24-48 hours)</li>
                <li>4. If approved, you'll get an access code to enter FANZ</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("selfie")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                variant="gradient"
                className="flex-1 neon-glow"
              >
                Submit for Review
              </Button>
            </div>
          </div>
        );

      case "pending":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 mb-4">
              <Clock className="w-10 h-10 text-accent animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Verification Submitted!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your application has been submitted for review. Our moderation team will verify
              your information within 24-48 hours.
            </p>

            <Card className="bg-primary/10 border-primary/30 max-w-md mx-auto">
              <CardContent className="p-6">
                <p className="text-sm font-semibold mb-3">Next Steps:</p>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Check your email for updates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access code will be sent upon approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You can return to the access gate to enter your code</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button
              variant="neon-outline"
              onClick={() => window.location.href = "/access-gate"}
            >
              Return to Access Gate
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden p-4">
      <div className="scan-line"></div>

      <div className="max-w-3xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary neon-text mb-2">
            FANZ Verification
          </h1>
          <p className="text-muted-foreground">
            Secure, private, and compliant age verification
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep !== "pending" && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = steps.findIndex((s) => s.id === currentStep) > index;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isActive
                            ? "border-primary bg-primary/20 text-primary neon-glow"
                            : isCompleted
                            ? "border-green-500 bg-green-500/20 text-green-500"
                            : "border-border bg-muted/20 text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <p
                        className={`text-xs mt-2 text-center ${
                          isActive ? "text-primary font-semibold" : "text-muted-foreground"
                        }`}
                      >
                        {step.name}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 ${
                          isCompleted ? "bg-green-500" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Content */}
        <Card className="bg-card/90 border-border neon-card backdrop-blur-xl">
          <CardContent className="p-8">{renderStepContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
