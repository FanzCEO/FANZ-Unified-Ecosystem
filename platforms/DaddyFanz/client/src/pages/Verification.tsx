import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Shield, Check, AlertCircle, FileText, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Verification() {
  const { toast } = useToast();
  const [step, setStep] = useState<'overview' | 'age' | 'kyc' | 'complete'>('overview');
  const [formData, setFormData] = useState({
    documentType: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    businessType: '',
    businessName: '',
    taxId: ''
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Uploaded",
        description: `${type} document uploaded successfully.`,
      });
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Verification Submitted",
      description: "Your verification documents have been submitted for review. You'll be notified within 24-48 hours.",
    });
    setStep('complete');
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="neon-heading text-4xl font-bold mb-4" data-testid="heading-verification">
            Creator Verification
          </h1>
          <p className="text-df-fog text-lg max-w-2xl mx-auto">
            Complete your age and identity verification to unlock creator features and ensure compliance with adult content regulations.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { key: 'overview', label: 'Overview', icon: FileText },
              { key: 'age', label: 'Age Verification', icon: Shield },
              { key: 'kyc', label: 'Identity Verification', icon: Camera },
              { key: 'complete', label: 'Complete', icon: Check }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.key;
              const isCompleted = ['overview', 'age'].includes(stepItem.key) && step === 'complete';
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive 
                      ? 'border-df-cyan bg-df-cyan text-df-ink' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-df-ink'
                        : 'border-df-steel text-df-fog'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-df-steel'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overview Step */}
        {step === 'overview' && (
          <div className="space-y-6">
            <Card className="card-df">
              <CardHeader>
                <CardTitle className="text-xl neon-subheading">
                  <Shield className="inline h-6 w-6 mr-2" />
                  Verification Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Age Verification */}
                  <div className="bg-df-ink border border-df-steel rounded-md p-4">
                    <h3 className="text-df-cyan font-semibold mb-3">Age Verification (18+)</h3>
                    <div className="text-df-fog text-sm space-y-2">
                      <p>• Government-issued photo ID</p>
                      <p>• Must show date of birth clearly</p>
                      <p>• Accepted: Driver's License, Passport, State ID</p>
                      <p>• Required for all content creators</p>
                    </div>
                    <Badge variant="outline" className="mt-3 border-df-gold text-df-gold">
                      Required
                    </Badge>
                  </div>

                  {/* KYC Verification */}
                  <div className="bg-df-ink border border-df-steel rounded-md p-4">
                    <h3 className="text-df-cyan font-semibold mb-3">Identity Verification (KYC)</h3>
                    <div className="text-df-fog text-sm space-y-2">
                      <p>• Full legal name and address</p>
                      <p>• Business information (if applicable)</p>
                      <p>• Tax identification number</p>
                      <p>• Required for payments and withdrawals</p>
                    </div>
                    <Badge variant="outline" className="border-df-gold text-df-gold">
                      Required
                    </Badge>
                  </div>
                </div>

                <div className="bg-df-brick border border-df-steel rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-df-gold mt-0.5 flex-shrink-0" />
                    <div className="text-df-fog text-sm">
                      <p className="font-medium text-df-snow mb-2">Important Information:</p>
                      <ul className="space-y-1">
                        <li>• All information is encrypted and stored securely</li>
                        <li>• Verification typically takes 24-48 hours</li>
                        <li>• You'll be notified via email once approved</li>
                        <li>• Required by law for adult content platforms</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => window.history.back()}>
                    Back to Settings
                  </Button>
                  <Button 
                    className="btn-primary" 
                    onClick={() => setStep('age')}
                    data-testid="button-start-verification"
                  >
                    Start Verification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Age Verification Step */}
        {step === 'age' && (
          <Card className="card-df">
            <CardHeader>
              <CardTitle className="text-xl neon-subheading">
                Age Verification (18+)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="document-type" className="text-df-snow">
                    Document Type
                  </Label>
                  <Select 
                    value={formData.documentType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                  >
                    <SelectTrigger className="input-df" data-testid="select-document-type">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="state_id">State ID</SelectItem>
                      <SelectItem value="national_id">National ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dob" className="text-df-snow">
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="input-df"
                    data-testid="input-date-of-birth"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-df-steel rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-df-fog mx-auto mb-2" />
                <p className="text-df-fog mb-2">Upload front side of your ID</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'ID Front')}
                  className="hidden"
                  id="id-front"
                />
                <label htmlFor="id-front">
                  <Button variant="outline" className="cursor-pointer" data-testid="button-upload-id-front">
                    Choose File
                  </Button>
                </label>
              </div>

              <div className="border-2 border-dashed border-df-steel rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-df-fog mx-auto mb-2" />
                <p className="text-df-fog mb-2">Upload back side of your ID</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'ID Back')}
                  className="hidden"
                  id="id-back"
                />
                <label htmlFor="id-back">
                  <Button variant="outline" className="cursor-pointer" data-testid="button-upload-id-back">
                    Choose File
                  </Button>
                </label>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('overview')}>
                  Back
                </Button>
                <div className="flex gap-2">
                  {/* Testing Skip Option - Remove in Production */}
                  <Button 
                    variant="outline"
                    onClick={() => setStep('complete')}
                    data-testid="button-skip-verification-testing"
                    className="text-xs opacity-75"
                  >
                    Skip (Testing)
                  </Button>
                  <Button 
                    className="btn-primary" 
                    onClick={() => setStep('kyc')}
                    data-testid="button-continue-kyc"
                  >
                    Continue to KYC
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KYC Step */}
        {step === 'kyc' && (
          <Card className="card-df">
            <CardHeader>
              <CardTitle className="text-xl neon-subheading">
                Identity Verification (KYC)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="first-name" className="text-df-snow">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input-df"
                    data-testid="input-first-name"
                  />
                </div>

                <div>
                  <Label htmlFor="last-name" className="text-df-snow">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input-df"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-df-snow">
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="input-df"
                  data-testid="input-address"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="city" className="text-df-snow">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="input-df"
                    data-testid="input-city"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-df-snow">
                    State/Province
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="input-df"
                    data-testid="input-state"
                  />
                </div>

                <div>
                  <Label htmlFor="zip" className="text-df-snow">
                    ZIP Code
                  </Label>
                  <Input
                    id="zip"
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="input-df"
                    data-testid="input-zip-code"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country" className="text-df-snow">
                  Country
                </Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger className="input-df" data-testid="select-country">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Business Information */}
              <div className="bg-df-ink border border-df-steel rounded-md p-4">
                <h3 className="text-df-cyan font-semibold mb-4">Business Information (Optional)</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business-type" className="text-df-snow">
                      Business Type
                    </Label>
                    <Select 
                      value={formData.businessType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
                    >
                      <SelectTrigger className="input-df">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="business-name" className="text-df-snow">
                      Business Name
                    </Label>
                    <Input
                      id="business-name"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      className="input-df"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax-id" className="text-df-snow">
                      Tax ID / EIN
                    </Label>
                    <Input
                      id="tax-id"
                      value={formData.taxId}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                      className="input-df"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('age')}>
                  Back
                </Button>
                <Button 
                  className="btn-primary" 
                  onClick={handleSubmit}
                  data-testid="button-submit-verification"
                >
                  Submit Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <Card className="card-df text-center">
            <CardContent className="pt-6">
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-df-ink" />
                </div>
                <h2 className="text-2xl font-bold text-df-snow mb-4" data-testid="heading-verification-complete">
                  Verification Submitted
                </h2>
                <p className="text-df-fog mb-6">
                  Your verification documents have been submitted successfully. Our team will review them within 24-48 hours and notify you via email.
                </p>
                <Button 
                  className="btn-primary" 
                  onClick={() => window.history.back()}
                  data-testid="button-back-to-dashboard"
                >
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}