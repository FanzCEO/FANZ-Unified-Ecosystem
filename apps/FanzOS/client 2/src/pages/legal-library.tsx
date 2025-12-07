import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Search,
  Shield,
  Scale,
  Book,
  AlertTriangle,
  Info,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  Gavel,
  Globe,
  Lock,
  Users,
  Database,
  Copyright,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";

interface LegalDocument {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  effectiveDate: string;
  description: string;
  sections: {
    title: string;
    content: string;
    subsections?: { title: string; content: string }[];
  }[];
}

const legalDocuments: LegalDocument[] = [
  {
    id: "user-agreement",
    title: "Fanz™ Unlimited Network User Agreement",
    category: "User Agreements",
    lastUpdated: "2025-02-07",
    effectiveDate: "2024-10-24",
    description: "Legally binding agreement between FUN L.L.C. and its users",
    sections: [
      {
        title: "Legal Basis for the Agreement",
        content: "This Agreement is legally binding under Contract Law of the State of Wyoming, United States, Electronic Signatures in Global and National Commerce Act (E-SIGN Act) (15 U.S.C. Chapter 96), and Uniform Electronic Transactions Act (UETA).",
        subsections: [
          {
            title: "User Responsibilities",
            content: "Users must provide accurate information during registration, adhere to content and behavior policies set forth by FUN, and understand that violation of terms can result in immediate suspension or legal action."
          },
          {
            title: "Dispute Resolution & Arbitration",
            content: "Mandatory Arbitration Clause: Users waive their right to sue in public court and must resolve disputes via arbitration. Class Action Waiver: Users cannot file class-action lawsuits against FUN. Governing Jurisdiction: All arbitration will take place in Sheridan, Wyoming, USA."
          }
        ]
      }
    ]
  },
  {
    id: "content-moderation",
    title: "Content Moderation & Enforcement Policy",
    category: "Content Policies",
    lastUpdated: "2025-02-07",
    effectiveDate: "2024-10-24",
    description: "Prohibited content policy and DMCA copyright enforcement",
    sections: [
      {
        title: "Prohibited Content Policy",
        content: "The following content is strictly prohibited on any FUN platform",
        subsections: [
          {
            title: "Illegal Content Categories",
            content: "Child Sexual Abuse Material (CSAM) – Violation of 18 U.S.C. § 2252A (Federal Law). Bestiality – Violation of U.S. Animal Crush Video Prohibition Act, 18 U.S.C. § 48. Revenge Porn / Non-Consensual Intimate Media – Violation of 47 U.S.C. § 230 (SAFE SEX Act). Human Trafficking / Exploitation – Violation of Trafficking Victims Protection Act (TVPA), 22 U.S.C. § 7102."
          },
          {
            title: "DMCA Copyright Infringement Takedown Policy",
            content: "Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512. Content Removal – Admins must disable access within 24 hours of a valid claim. User Notification & Counter-Notification Process – Users have 10 days to respond before content is permanently removed."
          }
        ]
      }
    ]
  },
  {
    id: "data-retention",
    title: "Data Retention & Security Compliance",
    category: "Data Protection",
    lastUpdated: "2025-02-07",
    effectiveDate: "2024-10-24",
    description: "Data retention, deletion, and security compliance policies",
    sections: [
      {
        title: "Data Storage Periods",
        content: "User Agreements: 5 years after termination (GDPR, CCPA). Billing Records: 7 years (IRS Tax Compliance). Removed Content (Forensic Records): 10 years (Law Enforcement Requirement).",
        subsections: [
          {
            title: "Secure Data Deletion Protocol",
            content: "DoD 5220.22-M Standard for digital erasure. NIST 800-88 Guidelines for Secure Data Sanitization for forensic deletions."
          },
          {
            title: "Legal Hold & Investigation Protocol",
            content: "Legal Holds Prevent Data Deletion During Investigations. Only the Legal Team Can Remove a Hold."
          }
        ]
      }
    ]
  },
  {
    id: "compliance-guide",
    title: "Compliance Guide for Starz and Fanz",
    category: "Compliance",
    lastUpdated: "2025-02-07",
    effectiveDate: "2024-10-24",
    description: "Comprehensive legal framework for content creators and users",
    sections: [
      {
        title: "Content Creator Responsibilities",
        content: "All content creators must verify age and identity, maintain proper documentation for all content, comply with 2257 record-keeping requirements, and ensure all co-stars have signed appropriate releases.",
        subsections: [
          {
            title: "2257 Compliance",
            content: "Maintain records of all performers' age verification documents. Store records for minimum of 5 years after content creation. Make records available for inspection upon request."
          },
          {
            title: "Co-Star Verification",
            content: "All co-stars must complete identity verification. Co-star releases must be signed before content publication. Documentation must be maintained for all collaborative content."
          }
        ]
      }
    ]
  },
  {
    id: "trademark-notice",
    title: "Fanz™ Trademark Notice & Indemnification",
    category: "Legal Notices",
    lastUpdated: "2025-02-07",
    effectiveDate: "2024-10-24",
    description: "Trademark protection and indemnification clauses",
    sections: [
      {
        title: "Trademark Protection",
        content: "Fanz™ is a registered trademark of Fanz Unlimited Network LLC. All rights reserved. Unauthorized use of FUN trademarks is strictly prohibited.",
        subsections: [
          {
            title: "Indemnification Clause",
            content: "Users agree to indemnify and hold harmless FUN L.L.C. from any claims arising from their use of the platform, violation of these terms, or infringement of any third-party rights."
          }
        ]
      }
    ]
  },
  {
    id: "cookies-policy",
    title: "Cookies Policy",
    category: "Privacy",
    lastUpdated: "2025-02-07",
    effectiveDate: "2024-10-24",
    description: "Information about how we use cookies and similar tracking technologies",
    sections: [
      {
        title: "Cookie Usage",
        content: "We use cookies to provide essential functionality, remember user preferences, analyze site traffic, and personalize content and advertisements.",
        subsections: [
          {
            title: "Types of Cookies",
            content: "Essential Cookies: Required for basic site functionality. Performance Cookies: Help us understand how visitors use our site. Functionality Cookies: Remember your preferences. Advertising Cookies: Used to deliver relevant advertisements."
          },
          {
            title: "Managing Cookies",
            content: "Users can manage cookie preferences through browser settings. Some features may not function properly if cookies are disabled."
          }
        ]
      }
    ]
  },
  {
    id: "age-verification",
    title: "Age Verification Protocols & Content Management",
    category: "Compliance",
    lastUpdated: "2025-02-14",
    effectiveDate: "2025-01-11",
    description: "Age verification requirements and content/data management policies",
    sections: [
      {
        title: "Age Verification Requirement",
        content: "To maintain a safe, legal, and compliant environment, all users must verify their age before accessing or engaging with content on Fanz™ Unlimited Network. Our verification process aligns with 18 U.S.C. § 2257, state regulations, and international compliance standards.",
        subsections: [
          {
            title: "Who Needs to Verify",
            content: "Age verification is mandatory for: All users signing up on any Fanz™ Unlimited Network platform. Users subscribing to a Content Star (creator). Users applying to become a Content Star."
          },
          {
            title: "Verification Process",
            content: "For All U.S. Users: Photo ID Verification - All users must provide a valid government-issued photo ID during sign-up or before making any subscription or content purchase. Phone Validation - A verified mobile number is required for additional security. For Age-Restricted U.S. States (Alabama, Arkansas, Florida, Georgia, Idaho, Indiana, Kansas, Kentucky, Louisiana, Mississippi, Montana, Nebraska, North Carolina, Oklahoma, South Carolina, Tennessee, Texas, Utah, Virginia): Photo ID and Phone Validation are required at sign-up."
          },
          {
            title: "Content Star Verification",
            content: "To apply as a Content Star, users must: Complete an application form. Submit a government-issued photo ID. Provide a real-time selfie for facial recognition matching. Complete signature verification within the AgeChecker UI. Submit a W9 tax form (for U.S. users) to comply with tax reporting laws."
          }
        ]
      },
      {
        title: "Content Moderation Policies",
        content: "To maintain a safe and compliant environment, all uploaded content undergoes automated and manual review before publication.",
        subsections: [
          {
            title: "Automated Screening Process",
            content: "AI-powered content filtering scans all uploads for: CSAM (Child Sexual Abuse Material), Non-consensual acts or revenge porn, Illicit, violent, or trafficking-related content, Copyright-infringing material, Any content violating 18 U.S.C. § 2257 compliance."
          },
          {
            title: "Manual Moderation",
            content: "Flagged or high-risk content is sent for manual review by trained moderators. Content in sensitive categories (e.g., BDSM, roleplay, or fetish content) requires additional verification."
          },
          {
            title: "Live Content Monitoring",
            content: "AI-based real-time monitoring scans live video streams and chat messages for: Harassment, solicitation, or illegal activity. Attempts to bypass age verification. Unauthorized solicitation or promotion of illegal services. Moderators actively review flagged content, and violators face immediate action."
          }
        ]
      },
      {
        title: "Data Protection & Privacy Compliance",
        content: "Fanz™ Unlimited Network follows GDPR, CCPA, and international privacy laws to protect user data.",
        subsections: [
          {
            title: "Data Security",
            content: "No personal information is stored on Fanz™ servers. All age verification data is handled securely through AgeChecker.Net, which ensures compliance with industry standards. Verified users may need to revalidate periodically to maintain compliance."
          },
          {
            title: "Record-Keeping Compliance",
            content: "In compliance with 18 U.S.C. § 2257, Fanz™ maintains secure digital records of all ID verifications and consent forms. These records are stored in encrypted databases with restricted access to authorized compliance personnel only."
          }
        ]
      }
    ]
  },
  {
    id: "data-collection",
    title: "Data Collection Statement",
    category: "Privacy",
    lastUpdated: "2025-02-14",
    effectiveDate: "2025-01-01",
    description: "How we collect, process, and protect your personal data",
    sections: [
      {
        title: "General Terms",
        content: "This statement describes the protection of rights of individuals regarding the processing of their personal data. The purpose is to guarantee the inviolability of personality and privacy by ensuring the protection of individuals in case of unauthorized processing of their personal data.",
        subsections: [
          {
            title: "Scope",
            content: "This statement defines: The management, maintenance, and protection of personal data that includes private information of customers of Fanz Unlimited Network (FUN) L.L.C. and is contained in the Personal Data Register. The obligations of FUN staff processing personal data and their responsibility when fulfilling these tasks. The required technical and organizational procedures for the protection of personal data from unlawful processing."
          }
        ]
      },
      {
        title: "Personal Data Collected",
        content: "The following types of personal data are kept in the Register: Physical identity, names, passport details, address, phone number, and personal identification numbers.",
        subsections: [
          {
            title: "Purpose of Collection",
            content: "The Register collects and stores personal data from customers for: Contacting customers by phone and to send correspondence regarding completion of orders that have been received on the website. Bookkeeping and direct marketing. Compliance with legal requirements."
          },
          {
            title: "Collection Methods",
            content: "Personal data is collected by placing orders in the online store of Fanz Unlimited Network (FUN) L.L.C. by a person who is a customer in compliance with the General Terms and Conditions. In all cases, the individuals submit the necessary personal data via online forms."
          }
        ]
      },
      {
        title: "Register Management",
        content: "The Register is kept in electronic form with strict security measures.",
        subsections: [
          {
            title: "Security Measures",
            content: "The Register is kept in electronic form and the personal data is stored in secured computer servers. Access to the Register servers is controlled by secured passwords known only to authorized Data Controller staff. Protection from unauthorized access, corruption, loss, or destruction is ensured by maintaining up-to-date antivirus software and regularly scheduled backups."
          },
          {
            title: "Access Control",
            content: "Only authorized Data Controller staff have access to the personal data with a file access password. Access to the personal data must be provided by the Data Controller staff to the officials directly involved in the clearance and verification of the legality of the documents."
          }
        ]
      },
      {
        title: "Individual Rights",
        content: "The right to access one's personal data contained in the Register shall be exercised by submitting a written application to the Data Controller.",
        subsections: [
          {
            title: "Access Requests",
            content: "The application may be submitted in electronic form. The application for access shall be filed personally by the individual or by an explicitly authorized person with a power of attorney certified by a notary public. The Data Controller reviews all requests within 14 days from submission or 30 days if more time is needed."
          },
          {
            title: "Third Party Access",
            content: "The information in the Register can only be accessed by the authorized Data Controller staff. Third parties do not have the right to access the Register unless required by the legal authorities (courts, prosecutors, or investigative bodies). Access by state authorities requires duly legitimated relevant documents."
          },
          {
            title: "Data Archiving",
            content: "Archiving of personal data on a technical medium is done periodically every 30 days by the Data Controller to keep the Register information up to date."
          }
        ]
      }
    ]
  }
];

export default function LegalLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<LegalDocument | null>(null);

  const categories = ["all", "User Agreements", "Content Policies", "Data Protection", "Compliance", "Legal Notices", "Privacy"];

  const filteredDocuments = legalDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Legal Library
              </h1>
              <p className="text-gray-400">
                Comprehensive legal documentation and compliance resources
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/compliance-dashboard">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Compliance Dashboard
                </Button>
              </Link>
              <Link href="/legal-vault">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-pink-600">
                  <Lock className="w-4 h-4 mr-2" />
                  My Legal Vault
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search legal documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700 pl-10 text-white placeholder-gray-400"
                data-testid="input-search-legal"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? 
                    "bg-primary" : "border-gray-600 text-gray-300 hover:bg-gray-700"}
                  data-testid={`button-category-${category}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Alert */}
        <Alert className="mb-6 bg-blue-900/20 border-blue-500">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Last updated: February 7, 2025 | These documents constitute legally binding agreements. 
            Please review carefully and consult legal counsel if needed.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Legal Documents</CardTitle>
                <CardDescription>
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {filteredDocuments.map(doc => (
                      <Card
                        key={doc.id}
                        className={`bg-gray-700 border-gray-600 cursor-pointer transition-colors hover:bg-gray-600 ${
                          selectedDocument?.id === doc.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedDocument(doc)}
                        data-testid={`card-document-${doc.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <Badge variant="outline" className="text-xs">
                              {doc.category}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-white mb-1 line-clamp-2">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                            {doc.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Effective: {new Date(doc.effectiveDate).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Document Viewer */}
          <div className="lg:col-span-2">
            {selectedDocument ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-2xl mb-2">
                        {selectedDocument.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {selectedDocument.description}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      data-testid="button-download-document"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      Effective: {new Date(selectedDocument.effectiveDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      Updated: {new Date(selectedDocument.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-6 pr-4">
                      {selectedDocument.sections.map((section, idx) => (
                        <div key={idx}>
                          <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                            <ChevronRight className="w-5 h-5 mr-2 text-primary" />
                            {section.title}
                          </h3>
                          <p className="text-gray-300 mb-4 leading-relaxed">
                            {section.content}
                          </p>
                          {section.subsections && (
                            <div className="ml-6 space-y-4">
                              {section.subsections.map((subsection, subIdx) => (
                                <div key={subIdx}>
                                  <h4 className="text-lg font-medium text-white mb-2">
                                    {subsection.title}
                                  </h4>
                                  <p className="text-gray-400 leading-relaxed">
                                    {subsection.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          {idx < selectedDocument.sections.length - 1 && (
                            <Separator className="bg-gray-700 my-6" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700 h-full flex items-center justify-center">
                <CardContent className="text-center py-20">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Select a Document
                  </h3>
                  <p className="text-gray-400">
                    Choose a legal document from the list to view its contents
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <Card className="mt-8 bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Scale className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Legal Compliance</h4>
                  <p className="text-sm text-gray-400">
                    All documents comply with U.S., EU, and international regulations
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Globe className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Global Standards</h4>
                  <p className="text-sm text-gray-400">
                    GDPR, CCPA, DMCA, and ISO 27001 compliant
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-1">Data Protection</h4>
                  <p className="text-sm text-gray-400">
                    Your data is protected under strict security protocols
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}