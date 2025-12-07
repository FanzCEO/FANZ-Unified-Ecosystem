import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  Radio,
  Video,
  Users,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Gift,
  Settings,
  StopCircle,
  Play,
} from "lucide-react";

export default function Live() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamDescription, setStreamDescription] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [totalTips, setTotalTips] = useState(0);

  // Simulated data
  const chatMessages = [
    { id: 1, user: "FanUser1", message: "Amazing stream! 🔥", isTip: false },
    { id: 2, user: "SuperFan99", message: "Sent you $10!", isTip: true, amount: 10 },
    { id: 3, user: "CreatorLover", message: "Love your content!", isTip: false },
    { id: 4, user: "NewFan2024", message: "Just subscribed!", isTip: false },
  ];

  const handleGoLive = () => {
    if (!streamTitle.trim()) {
      alert("Please enter a stream title");
      return;
    }
    setIsLive(true);
    // Simulate viewer count increase
    setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 3));
    }, 5000);
  };

  const handleEndStream = () => {
    setIsLive(false);
    setViewerCount(0);
  };

  return (
    <div className="min-h-screen bg-black text-white cyber-grid relative overflow-hidden">
      <div className="scan-line"></div>
      <Sidebar />
      <MobileNav />

      <div className="lg:pl-64 pb-20 lg:pb-0">
        {/* Header */}
        <header className="neon-card border-b border-primary/20 backdrop-blur-sm bg-black/50 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary neon-text text-glow-animated flex items-center gap-2">
                <Radio className="w-6 h-6" />
                Live Streaming
              </h1>
              <p className="text-sm text-secondary">
                {isLive ? "You're live now!" : "Start your live stream"}
              </p>
            </div>
            {isLive && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full border border-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  LIVE
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {!isLive ? (
            /* Pre-Stream Setup */
            <div className="max-w-4xl mx-auto">
              <Card className="bg-card border-border neon-card">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Set Up Your Live Stream</h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Stream Title *</label>
                      <Input
                        type="text"
                        placeholder="Enter an exciting title for your stream..."
                        value={streamTitle}
                        onChange={(e) => setStreamTitle(e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <Textarea
                        placeholder="Tell your fans what this stream will be about..."
                        value={streamDescription}
                        onChange={(e) => setStreamDescription(e.target.value)}
                        className="bg-input border-border min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Visibility</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 border-2 border-primary rounded-lg bg-primary/10 text-left hover:bg-primary/20 transition">
                          <Users className="w-5 h-5 mb-2 text-primary" />
                          <div className="font-semibold">Public</div>
                          <div className="text-xs text-muted-foreground">Anyone can watch</div>
                        </button>
                        <button className="p-4 border border-border rounded-lg bg-muted/20 text-left hover:bg-muted/30 transition">
                          <Heart className="w-5 h-5 mb-2" />
                          <div className="font-semibold">Subscribers Only</div>
                          <div className="text-xs text-muted-foreground">Exclusive access</div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-accent/10 border border-accent rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Monetization Enabled
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Fans can send tips during your stream. All tips go 100% to you!
                      </p>
                    </div>

                    <Button
                      onClick={handleGoLive}
                      size="lg"
                      variant="gradient"
                      className="w-full neon-glow text-lg py-6"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Go Live Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="mt-6 bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Pro Tips for Streaming</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Test your camera and microphone before going live</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Engage with your fans through the chat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Announce your stream on social media beforehand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Thank fans who send tips to encourage more support</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Live Stream View */
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Stream Area */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Video Player */}
                  <Card className="bg-card border-border neon-card overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                      <Video className="w-16 h-16 text-white/50" />
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </div>
                      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {viewerCount}
                      </div>
                    </div>
                  </Card>

                  {/* Stream Info */}
                  <Card className="bg-card border-border">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-2">{streamTitle}</h2>
                      {streamDescription && (
                        <p className="text-muted-foreground mb-4">{streamDescription}</p>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                            <Eye className="w-5 h-5" />
                            {viewerCount}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Viewers</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-secondary flex items-center justify-center gap-1">
                            <Heart className="w-5 h-5" />
                            {Math.floor(viewerCount * 2.5)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Likes</div>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-accent flex items-center justify-center gap-1">
                            <DollarSign className="w-5 h-5" />
                            {totalTips}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Tips</div>
                        </div>
                      </div>

                      <Button
                        onClick={handleEndStream}
                        variant="destructive"
                        className="w-full mt-6"
                        size="lg"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        End Stream
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Chat & Engagement */}
                <div className="space-y-4">
                  {/* Live Chat */}
                  <Card className="bg-card border-border neon-card">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Live Chat
                      </h3>
                    </div>
                    <CardContent className="p-0">
                      <div className="h-[400px] overflow-y-auto p-4 space-y-3">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`${
                              msg.isTip
                                ? "bg-accent/10 border border-accent rounded-lg p-3"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {msg.isTip && <Gift className="w-4 h-4 text-accent mt-1" />}
                              <div className="flex-1">
                                <span className="font-semibold text-sm">{msg.user}</span>
                                {msg.isTip && (
                                  <span className="ml-2 text-accent font-bold">${msg.amount}</span>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 border-t border-border">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            className="bg-input border-border"
                          />
                          <Button size="icon" variant="gradient" className="neon-glow">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Supporters */}
                  <Card className="bg-card border-border">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Top Supporters
                      </h3>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {[
                          { name: "SuperFan99", amount: 50 },
                          { name: "MegaSupporter", amount: 30 },
                          { name: "LoyalViewer", amount: 20 },
                        ].map((supporter, index) => (
                          <div key={supporter.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  index === 0
                                    ? "bg-yellow-500 text-black"
                                    : index === 1
                                    ? "bg-gray-400 text-black"
                                    : "bg-orange-700 text-white"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className="font-medium text-sm">{supporter.name}</span>
                            </div>
                            <span className="text-accent font-bold">${supporter.amount}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
