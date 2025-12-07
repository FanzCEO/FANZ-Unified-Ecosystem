import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, BarChart3 } from "lucide-react";

export default function Tracking() {
  const [selectedOffer, setSelectedOffer] = useState("");
  const [subId1, setSubId1] = useState("");
  const [subId2, setSubId2] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  const generateTrackingUrl = () => {
    if (!selectedOffer) return;
    
    const baseUrl = "https://trk.fanzfiliate.com/click";
    const params = new URLSearchParams({
      offer_id: selectedOffer,
      pub_id: "aff-1", // Would come from user context
      ...(subId1 && { sub1: subId1 }),
      ...(subId2 && { sub2: subId2 }),
    });
    
    const url = `${baseUrl}?${params.toString()}`;
    setTrackingUrl(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingUrl);
  };

  const recentLinks = [
    {
      offer: "Premium Dating Platform",
      url: "https://trk.fanzfiliate.com/click?offer_id=offer-1&pub_id=aff-1&sub1=email",
      clicks: 245,
      conversions: 8,
      created: "Dec 15, 2024",
    },
    {
      offer: "Cam Site Membership",
      url: "https://trk.fanzfiliate.com/click?offer_id=offer-2&pub_id=aff-1&sub1=social",
      clicks: 189,
      conversions: 5,
      created: "Dec 14, 2024",
    },
  ];

  return (
    <div className="p-6 space-y-6" data-testid="tracking-page">
      <div>
        <h2 className="text-2xl font-bold">Tracking</h2>
        <p className="text-muted-foreground">Generate and manage your tracking links</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle>Generate Tracking Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="offer-select">Select Offer</Label>
              <Select value={selectedOffer} onValueChange={setSelectedOffer}>
                <SelectTrigger data-testid="offer-select">
                  <SelectValue placeholder="Choose an offer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="offer-1">Premium Dating Platform</SelectItem>
                  <SelectItem value="offer-2">Cam Site Membership</SelectItem>
                  <SelectItem value="offer-3">Content Creator Tools</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sub1">Sub ID 1</Label>
                <Input
                  id="sub1"
                  placeholder="e.g., email, social"
                  value={subId1}
                  onChange={(e) => setSubId1(e.target.value)}
                  data-testid="sub-id-1"
                />
              </div>
              <div>
                <Label htmlFor="sub2">Sub ID 2</Label>
                <Input
                  id="sub2"
                  placeholder="Campaign name"
                  value={subId2}
                  onChange={(e) => setSubId2(e.target.value)}
                  data-testid="sub-id-2"
                />
              </div>
            </div>

            <Button 
              onClick={generateTrackingUrl} 
              disabled={!selectedOffer}
              className="w-full neon-glow"
              data-testid="generate-link"
            >
              Generate Tracking Link
            </Button>

            {trackingUrl && (
              <div className="space-y-2">
                <Label>Generated Link</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={trackingUrl}
                    readOnly
                    className="min-h-[80px] bg-secondary"
                    data-testid="generated-url"
                  />
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={copyToClipboard}
                      data-testid="copy-link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(trackingUrl, '_blank')}
                      data-testid="test-link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="gradient-card border-border">
          <CardHeader>
            <CardTitle>Tracking Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-accent mb-2">Best Practices</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Always use Sub IDs to track traffic sources</li>
                <li>• Test your links before launching campaigns</li>
                <li>• Monitor click-through rates regularly</li>
                <li>• Use descriptive Sub ID naming</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-chart-2 mb-2">Sub ID Examples</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Sub1: Traffic source (email, social, push)</li>
                <li>• Sub2: Campaign name or creative ID</li>
                <li>• Sub3: Landing page variant</li>
                <li>• Sub4: Device type (mobile, desktop)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-chart-4 mb-2">Fraud Protection</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Device fingerprinting enabled</li>
                <li>• IP quality scoring active</li>
                <li>• Click velocity monitoring</li>
                <li>• Bot traffic filtering</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-border">
        <CardHeader>
          <CardTitle>Recent Tracking Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLinks.map((link, index) => (
              <div 
                key={index} 
                className="border border-border rounded-lg p-4 data-row"
                data-testid={`recent-link-${index}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{link.offer}</h4>
                      <Badge className="bg-accent text-accent-foreground">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 font-mono break-all">
                      {link.url}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        <BarChart3 className="w-4 h-4 inline mr-1" />
                        {link.clicks} clicks
                      </span>
                      <span className="text-accent">
                        {link.conversions} conversions
                      </span>
                      <span className="text-muted-foreground">
                        Created: {link.created}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(link.url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
