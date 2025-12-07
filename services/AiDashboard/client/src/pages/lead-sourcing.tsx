import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Users, Linkedin, Mail, Twitter } from "lucide-react";

export default function LeadSourcing() {
  const [searchParams, setSearchParams] = useState({
    industry: "",
    companySize: "",
    location: "",
    roles: ["CEO", "CMO"],
    keywords: ""
  });

  const industries = [
    "Technology", "Healthcare", "Finance", "E-commerce", "Manufacturing", 
    "Education", "Real Estate", "Consulting", "Marketing", "SaaS"
  ];

  const companySizes = [
    "1-10 employees", "11-50 employees", "51-200 employees", "201-1000 employees", "1000+ employees"
  ];

  const targetRoles = ["CEO", "CMO", "CTO", "Marketing Manager", "Sales Director", "VP Marketing", "Founder"];

  const foundLeads = [
    {
      name: "Sarah Chen",
      title: "CMO at TechFlow Solutions",
      location: "San Francisco, CA • 150 employees",
      match: "95%",
      tags: ["Technology", "Marketing"],
      social: ["linkedin", "email"]
    },
    {
      name: "Marcus Rodriguez",
      title: "CEO at GrowthLab Inc",
      location: "San Jose, CA • 45 employees",
      match: "87%",
      tags: ["SaaS", "Growth"],
      social: ["linkedin", "twitter"]
    },
    {
      name: "Emily Watson",
      title: "VP Marketing at CloudVision",
      location: "Palo Alto, CA • 320 employees",
      match: "92%",
      tags: ["Cloud", "Enterprise"],
      social: ["linkedin", "email"]
    }
  ];

  const analytics = [
    { label: "Qualified Leads", value: "156", color: "text-accent" },
    { label: "Contacted Today", value: "23", color: "text-primary" },
    { label: "Response Rate", value: "67%", color: "text-orange-500" },
    { label: "Conversions", value: "12", color: "text-purple-500" }
  ];

  const toggleRole = (role: string) => {
    setSearchParams(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  return (
    <div className="min-h-screen bg-soft py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-poppins text-main mb-4">AI-Powered Lead Sourcing</h1>
            <p className="text-gray-600">Automatically discover, qualify, and engage potential customers using advanced AI algorithms</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Search Configuration */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-main">Lead Search Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Industry</Label>
                  <Select value={searchParams.industry} onValueChange={(value) => setSearchParams({ ...searchParams, industry: value })}>
                    <SelectTrigger className="w-full" data-testid="select-industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Company Size</Label>
                    <Select value={searchParams.companySize} onValueChange={(value) => setSearchParams({ ...searchParams, companySize: value })}>
                      <SelectTrigger className="w-full" data-testid="select-company-size">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Location</Label>
                    <Input 
                      type="text" 
                      placeholder="e.g., San Francisco, CA" 
                      value={searchParams.location}
                      onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                      data-testid="input-location"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Target Roles</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {targetRoles.map((role) => (
                      <Badge
                        key={role}
                        variant={searchParams.roles.includes(role) ? "default" : "outline"}
                        className={`cursor-pointer ${searchParams.roles.includes(role) ? 'bg-accent text-white' : 'hover:bg-gray-100'}`}
                        onClick={() => toggleRole(role)}
                        data-testid={`badge-role-${role.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2">Keywords</Label>
                  <Textarea 
                    placeholder="marketing automation, CRM, lead generation..."
                    value={searchParams.keywords}
                    onChange={(e) => setSearchParams({ ...searchParams, keywords: e.target.value })}
                    className="resize-none h-20"
                    data-testid="textarea-keywords"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" data-testid="button-save-search">
                    <Save className="mr-2" size={16} />
                    Save Search
                  </Button>
                  <Button className="bg-accent text-white hover:bg-green-600" data-testid="button-find-leads">
                    <Search className="mr-2" size={16} />
                    Find Leads
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results & Pipeline */}
            <div className="space-y-6">
              {/* Search Results */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-main">Found Leads</CardTitle>
                    <Badge className="bg-accent/10 text-accent" data-testid="badge-results-count">247 matches</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {foundLeads.map((lead, index) => (
                    <Card key={index} className="border border-gray-200 hover:border-accent/30 transition-colors p-4" data-testid={`lead-card-${index}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-main" data-testid={`lead-name-${index}`}>{lead.name}</h4>
                          <p className="text-sm text-gray-600" data-testid={`lead-title-${index}`}>{lead.title}</p>
                          <p className="text-xs text-gray-500" data-testid={`lead-location-${index}`}>{lead.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-accent font-medium" data-testid={`lead-match-${index}`}>{lead.match} Match</div>
                          <div className="flex space-x-1 mt-1">
                            {lead.social.includes("linkedin") && <Linkedin className="text-blue-700" size={14} />}
                            {lead.social.includes("email") && <Mail className="text-gray-500" size={14} />}
                            {lead.social.includes("twitter") && <Twitter className="text-blue-400" size={14} />}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {lead.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <Button size="sm" className="bg-accent text-white hover:bg-green-600" data-testid={`button-contact-${index}`}>
                          Contact
                        </Button>
                      </div>
                    </Card>
                  ))}

                  <Button variant="link" className="w-full text-accent hover:text-green-600 font-medium" data-testid="button-view-all-leads">
                    View All 247 Leads →
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-main">Search Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {analytics.map((stat, index) => (
                      <div key={index} className="text-center" data-testid={`analytics-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
