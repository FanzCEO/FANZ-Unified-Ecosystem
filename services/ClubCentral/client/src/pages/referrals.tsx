import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Users, DollarSign, Copy, Share2, TrendingUp, Gift, Check } from "lucide-react";

export default function Referrals() {
  const [copied, setCopied] = useState(false);
  const referralCode = "FANZ-CREATOR-ABC123";
  const referralUrl = `https://fanz.app/join/${referralCode}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      <div className="scan-line"></div>
      <Sidebar />
      <MobileNav />

      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="neon-card border-b border-primary/20 backdrop-blur-sm bg-black/50 px-4 lg:px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary neon-text text-glow-animated flex items-center gap-2">
              <Users className="w-6 h-6" />
              Refer & Earn
            </h1>
            <p className="text-sm text-secondary">
              Invite friends and earn rewards when they join FANZ
            </p>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-6xl mx-auto">
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border neon-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Referrals</p>
                    <p className="text-3xl font-bold text-foreground">47</p>
                    <p className="text-xs text-green-500 mt-1">+12 this month</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border neon-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rewards Earned</p>
                    <p className="text-3xl font-bold text-foreground">$2,350</p>
                    <p className="text-xs text-green-500 mt-1">+$430 this month</p>
                  </div>
                  <div className="bg-accent/10 p-4 rounded-lg">
                    <DollarSign className="w-8 h-8 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border neon-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Referrals</p>
                    <p className="text-3xl font-bold text-foreground">34</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently paying</p>
                  </div>
                  <div className="bg-secondary/10 p-4 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link Card */}
          <Card className="bg-card border-border neon-card mb-8 gradient-bg">
            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-primary/20 p-3 rounded-lg">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">Share Your Referral Link</h2>
                  <p className="text-sm opacity-90">
                    Invite fans and creators to join FANZ. You'll earn 10% of their spending or
                    platform fees for the first year!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Your Referral Code</label>
                  <div className="flex gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="bg-black/40 border-primary/50 font-mono text-lg"
                    />
                    <Button
                      onClick={() => handleCopy(referralCode)}
                      variant="neon-outline"
                      className="px-6"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Referral Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={referralUrl}
                      readOnly
                      className="bg-black/40 border-primary/50 text-sm"
                    />
                    <Button
                      onClick={() => handleCopy(referralUrl)}
                      variant="neon-outline"
                      className="px-6"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Button variant="gradient" className="neon-glow">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </Button>
                  <Button variant="neon-outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share on Instagram
                  </Button>
                  <Button variant="neon-outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share via Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-card border-border mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <h4 className="font-semibold mb-2">Share Your Link</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your unique referral link with friends, fans, or on social media
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-secondary">2</span>
                  </div>
                  <h4 className="font-semibold mb-2">They Sign Up</h4>
                  <p className="text-sm text-muted-foreground">
                    When someone joins FANZ using your link, they get 10% off their first purchase
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-accent">3</span>
                  </div>
                  <h4 className="font-semibold mb-2">You Earn Rewards</h4>
                  <p className="text-sm text-muted-foreground">
                    Earn 10% of their spending or platform fees for the first year
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Referrals */}
          <Card className="bg-card border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">Recent Referrals</h3>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {[
                  { name: "JohnDoe123", type: "Fan", date: "2 days ago", earned: "$45" },
                  { name: "JaneCreator", type: "Creator", date: "5 days ago", earned: "$120" },
                  { name: "MusicFan99", type: "Fan", date: "1 week ago", earned: "$30" },
                  { name: "FitnessGuru", type: "Creator", date: "2 weeks ago", earned: "$200" },
                  { name: "ArtLover", type: "Fan", date: "3 weeks ago", earned: "$25" },
                ].map((referral, index) => (
                  <div key={index} className="p-6 flex items-center justify-between hover:bg-muted/10 transition">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${referral.name}`}
                        alt={referral.name}
                        className="w-12 h-12 rounded-full border-2 border-primary"
                      />
                      <div>
                        <p className="font-semibold">{referral.name}</p>
                        <p className="text-sm text-muted-foreground">{referral.type} • {referral.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent">{referral.earned}</p>
                      <p className="text-xs text-muted-foreground">Earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
