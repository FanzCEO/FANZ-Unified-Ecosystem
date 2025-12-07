import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Download,
  Eye,
  Lock,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronRight,
  Info,
  FileSignature,
  UserCheck,
  Key,
  Database,
  Share2,
  Printer,
  Mail,
  Archive,
  Trash2,
  RefreshCw,
  Plus,
  FolderOpen,
  FileCheck,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";

interface LegalDocument {
  id: string;
  title: string;
  type: "agreement" | "consent" | "disclosure" | "verification" | "contract" | "policy";
  status: "active" | "expired" | "pending" | "archived";
  signedDate: string;
  expiryDate?: string;
  version: string;
  description: string;
  category: string;
  signatories?: string[];
  ipAddress?: string;
  deviceInfo?: string;
  canDownload: boolean;
  canShare: boolean;
}

interface DocumentCategory {
  name: string;
  icon: any;
  count: number;
  color: string;
}

export default function LegalVault() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Mock user documents
  const userDocuments: LegalDocument[] = [
    {
      id: "doc-1",
      title: "Fanz™ User Agreement",
      type: "agreement",
      status: "active",
      signedDate: "2024-10-24T15:45:00Z",
      version: "2.1",
      description: "Main platform user agreement and terms of service",
      category: "Platform Agreements",
      signatories: [user?.email || "user@example.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: true,
      canShare: false
    },
    {
      id: "doc-2",
      title: "Content Creator Agreement",
      type: "contract",
      status: "active",
      signedDate: "2024-10-25T10:30:00Z",
      expiryDate: "2025-10-25T10:30:00Z",
      version: "1.5",
      description: "Creator monetization and content distribution agreement",
      category: "Creator Contracts",
      signatories: [user?.email || "user@example.com", "legal@fanzlab.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: true,
      canShare: true
    },
    {
      id: "doc-3",
      title: "Privacy & Data Collection Consent",
      type: "consent",
      status: "active",
      signedDate: "2024-10-24T15:40:00Z",
      version: "3.0",
      description: "GDPR and CCPA compliant privacy consent",
      category: "Privacy & Data",
      signatories: [user?.email || "user@example.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: true,
      canShare: false
    },
    {
      id: "doc-4",
      title: "Age Verification Certificate",
      type: "verification",
      status: "active",
      signedDate: "2024-10-24T15:35:00Z",
      version: "1.0",
      description: "Government ID age verification record",
      category: "Identity Verification",
      signatories: ["AgeChecker.net", user?.email || "user@example.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: true,
      canShare: false
    },
    {
      id: "doc-5",
      title: "2257 Compliance Record",
      type: "disclosure",
      status: "active",
      signedDate: "2024-11-01T12:00:00Z",
      version: "1.2",
      description: "18 U.S.C. § 2257 record keeping compliance",
      category: "Compliance Records",
      signatories: [user?.email || "user@example.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: false,
      canShare: false
    },
    {
      id: "doc-6",
      title: "Content Moderation Policy Acknowledgment",
      type: "policy",
      status: "active",
      signedDate: "2024-10-24T15:50:00Z",
      version: "2.0",
      description: "Prohibited content and community guidelines acknowledgment",
      category: "Platform Policies",
      signatories: [user?.email || "user@example.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: true,
      canShare: false
    },
    {
      id: "doc-7",
      title: "Tax Information Form (W-9)",
      type: "disclosure",
      status: "pending",
      signedDate: "2024-11-15T09:00:00Z",
      expiryDate: "2025-12-31T23:59:59Z",
      version: "2024",
      description: "IRS tax information and withholding certificate",
      category: "Tax Documents",
      canDownload: true,
      canShare: false
    },
    {
      id: "doc-8",
      title: "DMCA Agent Designation",
      type: "policy",
      status: "active",
      signedDate: "2024-10-24T16:00:00Z",
      version: "1.1",
      description: "Digital Millennium Copyright Act compliance",
      category: "Copyright & IP",
      signatories: [user?.email || "user@example.com"],
      ipAddress: "192.168.1.1",
      deviceInfo: "Chrome on Windows",
      canDownload: true,
      canShare: false
    }
  ];

  const categories: DocumentCategory[] = [
    { name: "Platform Agreements", icon: FileSignature, count: 2, color: "text-blue-500" },
    { name: "Creator Contracts", icon: FileText, count: 1, color: "text-purple-500" },
    { name: "Privacy & Data", icon: Shield, count: 1, color: "text-green-500" },
    { name: "Identity Verification", icon: UserCheck, count: 1, color: "text-yellow-500" },
    { name: "Compliance Records", icon: FileCheck, count: 1, color: "text-orange-500" },
    { name: "Platform Policies", icon: Lock, count: 1, color: "text-red-500" },
    { name: "Tax Documents", icon: Database, count: 1, color: "text-indigo-500" },
    { name: "Copyright & IP", icon: Key, count: 1, color: "text-pink-500" }
  ];

  const filteredDocuments = userDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesTab = activeTab === "all" || doc.status === activeTab;
    return matchesSearch && matchesCategory && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-500">Expired</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "archived":
        return <Badge className="bg-gray-500">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "agreement":
        return <FileSignature className="w-5 h-5" />;
      case "consent":
        return <Shield className="w-5 h-5" />;
      case "disclosure":
        return <FileCheck className="w-5 h-5" />;
      case "verification":
        return <UserCheck className="w-5 h-5" />;
      case "contract":
        return <FileText className="w-5 h-5" />;
      case "policy":
        return <Lock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleDownload = (doc: LegalDocument) => {
    if (!doc.canDownload) {
      toast({
        title: "Download Restricted",
        description: "This document cannot be downloaded for security reasons.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Download Started",
      description: `Downloading ${doc.title}...`,
    });
  };

  const handleShare = (doc: LegalDocument) => {
    if (!doc.canShare) {
      toast({
        title: "Sharing Restricted",
        description: "This document contains sensitive information and cannot be shared.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Share Link Created",
      description: "A secure share link has been copied to your clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation unreadCount={0} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Legal Vault
              </h1>
              <p className="text-gray-400">
                Your secure repository of signed agreements and legal documents
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/legal-library">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Legal Library
                </Button>
              </Link>
              <Link href="/compliance-dashboard">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                  <Shield className="w-4 h-4 mr-2" />
                  Compliance Status
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search your documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 pl-10 text-white placeholder-gray-400"
                data-testid="input-search-vault"
              />
            </div>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 bg-blue-900/20 border-blue-500">
            <Lock className="h-4 w-4" />
            <AlertTitle>Secure Document Storage</AlertTitle>
            <AlertDescription>
              All documents are encrypted and stored securely. Documents are legally binding and include digital signatures with timestamp verification.
            </AlertDescription>
          </Alert>

          {/* Document Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Documents</p>
                    <p className="text-2xl font-bold text-white">{userDocuments.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active</p>
                    <p className="text-2xl font-bold text-green-500">
                      {userDocuments.filter(d => d.status === "active").length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {userDocuments.filter(d => d.status === "pending").length}
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
                    <p className="text-gray-400 text-sm">Categories</p>
                    <p className="text-2xl font-bold text-white">{categories.length}</p>
                  </div>
                  <FolderOpen className="w-8 h-8 text-secondary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Document Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory("all")}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    All Documents
                    <Badge variant="outline" className="ml-auto">{userDocuments.length}</Badge>
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category.name}
                      variant={selectedCategory === category.name ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <category.icon className={`w-4 h-4 mr-2 ${category.color}`} />
                      {category.name}
                      <Badge variant="outline" className="ml-auto">{category.count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents List */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 mb-4">
                <TabsTrigger value="all" className="data-[state=active]:bg-primary">
                  All
                </TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:bg-primary">
                  Active
                </TabsTrigger>
                <TabsTrigger value="pending" className="data-[state=active]:bg-primary">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="expired" className="data-[state=active]:bg-primary">
                  Expired
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[700px]">
                <div className="space-y-4">
                  {filteredDocuments.length === 0 ? (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No documents found</h3>
                        <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredDocuments.map(doc => (
                      <Card key={doc.id} className="bg-gray-800 border-gray-700 hover:border-primary transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowDocumentModal(true);
                            }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-gray-700 rounded-lg">
                                {getTypeIcon(doc.type)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white mb-1">{doc.title}</h4>
                                <p className="text-sm text-gray-400 mb-2">{doc.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Signed: {new Date(doc.signedDate).toLocaleDateString()}
                                  </span>
                                  {doc.expiryDate && (
                                    <span className="flex items-center text-yellow-500">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  <span>Version {doc.version}</span>
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(doc.status)}
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDocument(doc);
                                  setShowDocumentModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {doc.canDownload && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(doc);
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                              {doc.canShare && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(doc);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        {/* Document Modal */}
        <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedDocument?.title}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedDocument?.description}
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Document Type</p>
                      <p className="text-sm font-medium capitalize">{selectedDocument.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Version</p>
                      <p className="text-sm font-medium">{selectedDocument.version}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Signed Date</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedDocument.signedDate).toLocaleString()}
                      </p>
                    </div>
                    {selectedDocument.expiryDate && (
                      <div>
                        <p className="text-xs text-gray-500">Expiry Date</p>
                        <p className="text-sm font-medium text-yellow-500">
                          {new Date(selectedDocument.expiryDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="text-sm font-medium">{selectedDocument.category}</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-700" />
                
                {/* Signature Details */}
                {selectedDocument.signatories && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Digital Signatures</h4>
                    <div className="space-y-2">
                      {selectedDocument.signatories.map((signatory, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <span className="text-sm">{signatory}</span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Metadata */}
                {(selectedDocument.ipAddress || selectedDocument.deviceInfo) && (
                  <>
                    <Separator className="bg-gray-700" />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Signing Information</h4>
                      <div className="space-y-1 text-xs text-gray-400">
                        {selectedDocument.ipAddress && (
                          <p>IP Address: {selectedDocument.ipAddress}</p>
                        )}
                        {selectedDocument.deviceInfo && (
                          <p>Device: {selectedDocument.deviceInfo}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  {selectedDocument?.canDownload && (
                    <Button 
                      variant="outline"
                      onClick={() => handleDownload(selectedDocument)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                  <Button variant="outline">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                  {selectedDocument?.canShare && (
                    <Button 
                      variant="outline"
                      onClick={() => handleShare(selectedDocument)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                </div>
                <Button variant="ghost" onClick={() => setShowDocumentModal(false)}>
                  Close
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}