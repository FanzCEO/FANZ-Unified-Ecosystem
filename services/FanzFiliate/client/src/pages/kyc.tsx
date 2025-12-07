import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Clock, Upload, FileText, Shield, DollarSign, Eye } from "lucide-react";
import type { User } from "@shared/schema";

const kycTiers = [
  {
    tier: 0,
    name: "View Only",
    description: "Browse offers and marketplace",
    limit: "View only access",
    requirements: "Email verification only",
    icon: Eye,
    color: "text-muted-foreground",
    bgColor: "bg-muted/20",
  },
  {
    tier: 1,
    name: "Basic Verification",
    description: "Start earning with basic verification",
    limit: "Up to $500 total earnings",
    requirements: "Government ID + Address proof",
    icon: DollarSign,
    color: "text-chart-3",
    bgColor: "bg-chart-3/20",
  },
  {
    tier: 2,
    name: "Full Verification", 
    description: "Unlimited earning potential",
    limit: "Unlimited earnings",
    requirements: "Full KYC + Enhanced verification",
    icon: Shield,
    color: "text-accent",
    bgColor: "bg-accent/20",
  },
];

const requiredDocuments = [
  {
    id: "government_id",
    name: "Government ID",
    description: "Passport, Driver's License, or National ID",
    required: true,
    tier: 1,
  },
  {
    id: "address_proof",
    name: "Proof of Address",
    description: "Utility bill, bank statement (last 3 months)",
    required: true,
    tier: 1,
  },
  {
    id: "selfie_verification",
    name: "Selfie with ID",
    description: "Clear photo holding your government ID",
    required: true,
    tier: 2,
  },
  {
    id: "bank_verification",
    name: "Bank Verification",
    description: "Bank statement or payment method verification",
    required: true,
    tier: 2,
  },
];

export default function KYC() {
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  // Mock current user data - in real app this would come from auth context
  const currentUser: User = {
    id: "aff-1",
    ssoUserId: "sso-aff-1", 
    email: "john@example.com",
    username: "johnaffiliate",
    name: "John Affiliate",
    role: "affiliate",
    kycStatus: "approved",
    kycTier: 2,
    kycVerifiedAt: new Date("2024-11-15"),
    isActive: true,
    createdAt: new Date("2024-10-01"),
    updatedAt: new Date(),
  };

  const handleDocumentUpload = (docId: string) => {
    setUploadingDoc(docId);
    // Simulate upload process
    setTimeout(() => {
      setUploadingDoc(null);
      console.log("Document uploaded:", docId);
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-accent" />;
      case 'in_review':
        return <Clock className="w-5 h-5 text-chart-3" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      unverified: "bg-muted text-muted-foreground",
      initiated: "bg-chart-4 text-background", 
      in_review: "bg-chart-3 text-background",
      approved: "bg-accent text-accent-foreground",
      failed: "bg-destructive text-destructive-foreground",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.unverified}>
        {status === 'in_review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const currentTier = kycTiers.find(tier => tier.tier === currentUser.kycTier) || kycTiers[0];
  const progressPercentage = ((currentUser.kycTier) / 2) * 100;

  return (
    <div className="p-6 space-y-6" data-testid="kyc-page">
      <div>
        <h2 className="text-2xl font-bold">KYC Verification</h2>
        <p className="text-muted-foreground">Manage your identity verification and compliance status</p>
      </div>

      {/* Current Status Overview */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon(currentUser.kycStatus)}
            Verification Status
            {getStatusBadge(currentUser.kycStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-muted-foreground text-sm">Current Tier</p>
              <div className="flex items-center gap-2 mt-1">
                <currentTier.icon className={`w-5 h-5 ${currentTier.color}`} />
                <span className="font-semibold text-lg">Tier {currentUser.kycTier}: {currentTier.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{currentTier.limit}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm">Verification Progress</p>
              <div className="mt-2">
                <Progress value={progressPercentage} className="w-full" data-testid="kyc-progress" />
                <p className="text-sm text-muted-foreground mt-1">{progressPercentage.toFixed(0)}% Complete</p>
              </div>
            </div>
            
            <div>
              <p className="text-muted-foreground text-sm">Verified Since</p>
              <p className="font-medium mt-1" data-testid="verification-date">
                {currentUser.kycVerifiedAt ? 
                  new Date(currentUser.kycVerifiedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric' 
                  }) : 
                  'Not verified'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Tiers Explanation */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Verification Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kycTiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrentTier = tier.tier === currentUser.kycTier;
              const isCompleted = tier.tier <= currentUser.kycTier;
              
              return (
                <div
                  key={tier.tier}
                  className={`border rounded-lg p-4 transition-all ${
                    isCurrentTier ? 'border-primary bg-primary/5 neon-glow' : 
                    isCompleted ? 'border-accent bg-accent/5' : 'border-border'
                  }`}
                  data-testid={`tier-${tier.tier}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${tier.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${tier.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Tier {tier.tier}</h3>
                        {isCompleted && <CheckCircle className="w-4 h-4 text-accent" />}
                      </div>
                      <p className="font-medium text-sm">{tier.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        <p className="text-xs font-medium">Earning Limit:</p>
                        <p className="text-xs text-muted-foreground">{tier.limit}</p>
                        <p className="text-xs font-medium mt-2">Requirements:</p>
                        <p className="text-xs text-muted-foreground">{tier.requirements}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      {currentUser.kycTier < 2 && (
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <p className="text-muted-foreground">
              Upload the following documents to increase your verification tier
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requiredDocuments
                .filter(doc => doc.tier <= currentUser.kycTier + 1)
                .map((doc) => (
                <div
                  key={doc.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  data-testid={`document-${doc.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {doc.name}
                          {doc.required && <Badge className="bg-chart-5 text-background text-xs">Required</Badge>}
                        </h4>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Required for Tier {doc.tier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id={`file-${doc.id}`}
                        onChange={() => handleDocumentUpload(doc.id)}
                      />
                      <Label
                        htmlFor={`file-${doc.id}`}
                        className="cursor-pointer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={uploadingDoc === doc.id}
                          data-testid={`upload-${doc.id}`}
                        >
                          {uploadingDoc === doc.id ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Information */}
      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Compliance & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-accent mt-0.5" />
              <div>
                <h4 className="font-medium text-accent">Adult Industry Compliance</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  As an adult-industry affiliate platform, we maintain strict compliance with 2257 record-keeping requirements 
                  and age verification standards. All verification data is securely stored in FanzHubVault.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Data Protection</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• SSL encrypted document transmission</li>
                <li>• GDPR/CCPA compliant data handling</li>
                <li>• Secure document storage with SHA256 hashing</li>
                <li>• Regular compliance audits</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Verification Process</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Powered by VerifyMy identity verification</li>
                <li>• AI-powered document authentication</li>
                <li>• Manual review for enhanced verification</li>
                <li>• Real-time fraud detection</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              By completing verification, you agree to our Terms of Service and Privacy Policy. 
              Document retention follows industry standards and regulatory requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
