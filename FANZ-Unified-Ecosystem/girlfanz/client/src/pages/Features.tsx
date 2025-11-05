import { Footer } from "@/components/layout/Footer";
import { Video, MessageSquare, DollarSign, BarChart3, Shield, Zap, Globe, Sparkles, Brain, Lock } from "lucide-react";

export default function Features() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Platform Features</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">The most advanced creator platform on the internet</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors">
            <Video className="w-12 h-12 text-gf-pink mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">HD Live Streaming</h3>
            <p className="text-gf-smoke">Broadcast in crystal-clear 4K with ultra-low latency. AR/VR support for immersive experiences.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-violet/50 transition-colors">
            <MessageSquare className="w-12 h-12 text-gf-violet mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Real-Time Messaging</h3>
            <p className="text-gf-smoke">Direct messaging with fans. Custom content requests. Encrypted and private.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-cyan/50 transition-colors">
            <DollarSign className="w-12 h-12 text-gf-cyan mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">FanzTrust™ Ecosystem</h3>
            <p className="text-gf-smoke">Secure payment processing, instant payouts, cryptocurrency support, and microlending.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors">
            <BarChart3 className="w-12 h-12 text-gf-pink mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Advanced Analytics</h3>
            <p className="text-gf-smoke">Real-time insights into earnings, engagement, demographics, and content performance.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-violet/50 transition-colors">
            <Shield className="w-12 h-12 text-gf-violet mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Content Protection</h3>
            <p className="text-gf-smoke">Dynamic watermarking, DRM, deepfake detection, and anti-piracy measures.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-cyan/50 transition-colors">
            <Zap className="w-12 h-12 text-gf-cyan mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Infinity Scroll Feed</h3>
            <p className="text-gf-smoke">AI-powered content discovery with personalized recommendations and trending highlights.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors">
            <Globe className="w-12 h-12 text-gf-pink mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Blockchain NFTs</h3>
            <p className="text-gf-smoke">Mint exclusive content as NFTs with EIP-2981 royalties and ownership verification.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-violet/50 transition-colors">
            <Brain className="w-12 h-12 text-gf-violet mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">AI Voice Cloning</h3>
            <p className="text-gf-smoke">Create personalized voice messages and custom audio content with AI technology.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-cyan/50 transition-colors">
            <Sparkles className="w-12 h-12 text-gf-cyan mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Dynamic Pricing AI</h3>
            <p className="text-gf-smoke">Intelligent pricing suggestions based on demand, engagement, and market trends.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-pink/50 transition-colors">
            <Lock className="w-12 h-12 text-gf-pink mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">2257 Compliance</h3>
            <p className="text-gf-smoke">Automated age verification, record-keeping, and full regulatory compliance.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-violet/50 transition-colors">
            <Video className="w-12 h-12 text-gf-violet mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Holographic AR/VR</h3>
            <p className="text-gf-smoke">Next-generation immersive streaming with holographic projection support.</p>
          </div>

          <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg hover:border-gf-cyan/50 transition-colors">
            <Sparkles className="w-12 h-12 text-gf-cyan mb-4" />
            <h3 className="text-xl font-semibold text-gf-snow mb-2">Emotional AI</h3>
            <p className="text-gf-smoke">Sentiment analysis and engagement optimization for personalized fan experiences.</p>
          </div>
        </div>

        <section className="bg-gradient-to-r from-gf-pink/10 via-gf-violet/10 to-gf-cyan/10 border border-gf-smoke/20 p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-gf-snow mb-4">Built to Scale</h2>
          <p className="text-xl text-gf-smoke mb-8">Enterprise-grade infrastructure supporting 20M+ concurrent users</p>
          <a 
            href="/onboarding/creator" 
            className="inline-block px-10 py-4 bg-gradient-to-r from-gf-pink to-gf-violet text-white text-lg rounded-lg font-bold hover:opacity-90 transition-opacity"
            data-testid="link-get-started"
          >
            Get Started Today
          </a>
        </section>
      </div>
      <Footer />
    </div>
  );
}
