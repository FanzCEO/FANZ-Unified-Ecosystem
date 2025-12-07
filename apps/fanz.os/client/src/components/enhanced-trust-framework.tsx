
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Users, 
  FileCheck,
  Lock,
  Eye,
  Phone,
  Mail,
  MessageSquare,
  Heart
} from "lucide-react";

export function TrustSafetyDashboard() {
  const [verificationLevel, setVerificationLevel] = useState(85);
  const [safetyScore, setSafetyScore] = useState(92);

  const verificationChecks = [
    { name: "Government ID", status: "verified", icon: FileCheck, color: "green" },
    { name: "Age Verification", status: "verified", icon: CheckCircle, color: "green" },
    { name: "Biometric Match", status: "verified", icon: Eye, color: "green" },
    { name: "Phone Number", status: "verified", icon: Phone, color: "green" },
    { name: "Email Address", status: "verified", icon: Mail, color: "green" },
    { name: "Social Media", status: "pending", icon: MessageSquare, color: "yellow" },
    { name: "Bank Account", status: "verified", icon: Lock, color: "green" },
    { name: "Address", status: "pending", icon: Clock, color: "yellow" }
  ];

  const safetyFeatures = [
    {
      title: "Content Protection",
      description: "DRM, watermarking, and screenshot prevention",
      status: "active",
      effectiveness: 94
    },
    {
      title: "AI Moderation", 
      description: "Real-time content analysis and filtering",
      status: "active",
      effectiveness: 98
    },
    {
      title: "Fraud Detection",
      description: "Advanced payment and account security",
      status: "active", 
      effectiveness: 91
    },
    {
      title: "Privacy Controls",
      description: "Data encryption and access management",
      status: "active",
      effectiveness: 96
    }
  ];

  const complianceStatus = [
    { law: "18 USC 2257", status: "compliant", lastAudit: "2024-01-15" },
    { law: "GDPR", status: "compliant", lastAudit: "2024-01-10" },
    { law: "CCPA", status: "compliant", lastAudit: "2024-01-12" },
    { law: "PIPEDA", status: "review", lastAudit: "2024-01-08" },
    { law: "UK Age Verification", status: "compliant", lastAudit: "2024-01-14" }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trust Score */}
        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Shield className="w-5 h-5 mr-2" />
              Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{verificationLevel}%</div>
            <Progress value={verificationLevel} className="mb-2" />
            <p className="text-green-200 text-sm">Excellent verification level</p>
          </CardContent>
        </Card>

        {/* Safety Score */}
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <CheckCircle className="w-5 h-5 mr-2" />
              Safety Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">{safetyScore}%</div>
            <Progress value={safetyScore} className="mb-2" />
            <p className="text-blue-200 text-sm">Outstanding safety measures</p>
          </CardContent>
        </Card>

        {/* Active Protection */}
        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Lock className="w-5 h-5 mr-2" />
              Active Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">24/7</div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <p className="text-purple-200 text-sm">All systems active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {verificationChecks.map((check) => (
              <div key={check.name} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800">
                <check.icon className={`w-5 h-5 ${
                  check.color === 'green' ? 'text-green-400' : 
                  check.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                }`} />
                <div>
                  <p className="text-sm font-medium text-white">{check.name}</p>
                  <Badge 
                    variant={check.status === 'verified' ? 'default' : 'secondary'}
                    className={check.status === 'verified' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}
                  >
                    {check.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Features */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Active Safety Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safetyFeatures.map((feature) => (
              <div key={feature.title} className="flex items-center justify-between p-4 rounded-lg bg-gray-800">
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">{feature.effectiveness}%</div>
                    <div className="text-xs text-gray-400">Effectiveness</div>
                  </div>
                  <Badge className="bg-green-900 text-green-300">
                    {feature.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Legal Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {complianceStatus.map((item) => (
              <div key={item.law} className="flex items-center justify-between p-3 rounded-lg bg-gray-800">
                <div>
                  <span className="font-medium text-white">{item.law}</span>
                  <span className="text-gray-400 text-sm ml-2">
                    Last audit: {new Date(item.lastAudit).toLocaleDateString()}
                  </span>
                </div>
                <Badge 
                  className={
                    item.status === 'compliant' 
                      ? 'bg-green-900 text-green-300' 
                      : 'bg-yellow-900 text-yellow-300'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Support */}
      <Card className="bg-red-900 border-red-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Heart className="w-5 h-5 mr-2" />
            Crisis Support & Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">24/7 Crisis Hotlines</h4>
              <div className="text-sm text-red-200">
                <p>National Suicide Prevention: 988</p>
                <p>Crisis Text Line: Text HOME to 741741</p>
                <p>RAINN National Sexual Assault: 1-800-656-4673</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-white">Platform Support</h4>
              <div className="space-y-2">
                <Button size="sm" className="w-full bg-red-700 hover:bg-red-600">
                  Emergency Support Chat
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  Report Safety Concern
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
