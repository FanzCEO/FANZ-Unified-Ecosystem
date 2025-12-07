import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle, Info, Calendar, Clock, Download, FileText, Shield, User, Camera, Lock, ChevronRight, ExternalLink, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "pending" | "warning" | "expired";
  category: string;
  completedAt?: string;
  expiresAt?: string;
  documents?: string[];
}

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complianceScore, setComplianceScore] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const complianceItems: ComplianceItem[] = [
    {
      id: "age-verification",
      title: "Age Verification",
      description: "Government ID verification completed",
      status: "completed",
      category: "Identity",
      completedAt: "2024-10-24",
      documents: ["id-verification.pdf"]
    },
    {
      id: "2257-compliance",
      title: "2257 Record Keeping",
      description: "Age and identity records for all content",
      status: user?.role === "creator" ? "pending" : "completed",
      category: "Content",
      documents: ["2257-records.pdf"]
    },
    {
      id: "tax-documents",
      title: "Tax Documentation",
      description: "W-9 or W-8BEN form submission",
      status: user?.role === "creator" ? "warning" : "completed",
      category: "Financial",
      expiresAt: "2025-12-31",
      documents: ["w9-form.pdf"]
    },
    {
      id: "user-agreement",
      title: "User Agreement",
      description: "Platform terms and conditions",
      status: "completed",
      category: "Legal",
      completedAt: "2024-10-24",
      documents: ["user-agreement.pdf"]
    },
    {
      id: "content-policy",
      title: "Content Policy Acknowledgment",
      description: "Prohibited content guidelines",
      status: "completed",
      category: "Content",
      completedAt: "2024-10-24",
      documents: ["content-policy.pdf"]
    },
    {
      id: "privacy-consent",
      title: "Privacy & Data Consent",
      description: "GDPR and CCPA compliance",
      status: "completed",
      category: "Privacy",
      completedAt: "2024-10-24",
      documents: ["privacy-consent.pdf"]
    }
  ];

  useEffect(() => {
    const completed = complianceItems.filter(item => item.status === "completed").length;
    const score = Math.round((completed / complianceItems.length) * 100);
    setComplianceScore(score);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "expired":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "warning":
        return "bg-orange-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const groupedItems = complianceItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ComplianceItem[]>);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation unreadCount={0} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Compliance Dashboard
              </h1>
              <p className="text-gray-400">
                Monitor your compliance status and manage legal requirements
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/legal-library">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Legal Library
                </Button>
              </Link>
              <Link href="/legal-vault">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                  <Lock className="w-4 h-4 mr-2" />
                  Legal Vault
                </Button>
              </Link>
            </div>
          </div>

          {/* Compliance Score */}
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Overall Compliance Score</h3>
                  <p className="text-gray-400 text-sm">Based on {complianceItems.length} requirements</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-white">{complianceScore}%</span>
                  <p className="text-sm text-gray-400">
                    {complianceItems.filter(i => i.status === "completed").length} of {complianceItems.length} completed
                  </p>
                </div>
              </div>
              <Progress value={complianceScore} className="h-3" />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>Non-compliant</span>
                <span>Partial</span>
                <span>Fully Compliant</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-green-500">
                      {complianceItems.filter(i => i.status === "completed").length}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {complianceItems.filter(i => i.status === "pending").length}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Warnings</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {complianceItems.filter(i => i.status === "warning").length}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Expired</p>
                    <p className="text-2xl font-bold text-red-500">
                      {complianceItems.filter(i => i.status === "expired").length}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary">
              Overview
            </TabsTrigger>
            <TabsTrigger value="requirements" className="data-[state=active]:bg-primary">
              Requirements
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-primary">
              Documents
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Action Items */}
            {complianceItems.filter(i => i.status !== "completed").length > 0 && (
              <Alert className="bg-yellow-900/20 border-yellow-500">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                  You have {complianceItems.filter(i => i.status !== "completed").length} compliance items that need attention.
                </AlertDescription>
              </Alert>
            )}

            {/* Categories Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <Card key={category} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">{category} Compliance</CardTitle>
                    <CardDescription>
                      {items.filter(i => i.status === "completed").length} of {items.length} requirements met
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(item.status)}
                            <div>
                              <p className="text-sm font-medium text-white">{item.title}</p>
                              <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                          </div>
                          {item.status !== "completed" && (
                            <Button size="sm" variant="outline" className="text-xs">
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Compliance Requirements</CardTitle>
                <CardDescription>Complete list of platform compliance requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {complianceItems.map(item => (
                      <Card key={item.id} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(item.status)}
                              <div>
                                <h4 className="font-semibold text-white">{item.title}</h4>
                                <Badge variant="outline" className="mt-1">{item.category}</Badge>
                              </div>
                            </div>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              {item.completedAt && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Completed: {new Date(item.completedAt).toLocaleDateString()}
                                </span>
                              )}
                              {item.expiresAt && (
                                <span className="flex items-center text-yellow-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Expires: {new Date(item.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {item.status !== "completed" && (
                              <Button size="sm" className="text-xs">
                                Complete Now
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compliance Documents</CardTitle>
                <CardDescription>All your submitted compliance documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceItems.filter(item => item.documents && item.documents.length > 0).map(item => (
                    <div key={item.id} className="border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{item.title}</h4>
                        <Badge variant="outline">{item.category}</Badge>
                      </div>
                      <div className="space-y-2">
                        {item.documents?.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{doc}</span>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compliance History</CardTitle>
                <CardDescription>Track your compliance activities over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Age Verification Completed</p>
                        <p className="text-xs text-gray-400">October 24, 2024 at 3:45 PM</p>
                      </div>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">User Agreement Signed</p>
                        <p className="text-xs text-gray-400">October 24, 2024 at 3:40 PM</p>
                      </div>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Privacy Consent Accepted</p>
                        <p className="text-xs text-gray-400">October 24, 2024 at 3:35 PM</p>
                      </div>
                    </div>
                    <Separator className="bg-gray-700" />
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Tax Document Reminder</p>
                        <p className="text-xs text-gray-400">October 20, 2024 at 10:00 AM</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}