import { Footer } from "@/components/layout/Footer";
import { DollarSign, Users, TrendingUp, Shield, Zap, Globe } from "lucide-react";

export default function ForCreators() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gf-pink/20 via-transparent to-gf-violet/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gf-pink via-gf-violet to-gf-cyan bg-clip-text text-transparent" data-testid="text-page-title">
            Built for Creators
          </h1>
          <p className="text-2xl text-gf-smoke mb-8 max-w-3xl mx-auto">
            Turn your passion into profit with the most powerful creator platform on the internet
          </p>
          <a 
            href="/onboarding/creator" 
            className="inline-block px-10 py-4 bg-gradient-to-r from-gf-pink to-gf-violet text-white text-lg rounded-lg font-bold hover:opacity-90 transition-opacity"
            data-testid="link-start-creating"
          >
            Start Creating Today
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gf-pink to-gf-violet rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gf-snow mb-3">Maximize Earnings</h3>
            <p className="text-gf-smoke text-lg">Keep 80% of all revenue. No hidden fees. Monthly payouts.</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gf-violet to-gf-cyan rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gf-snow mb-3">Grow Your Fanbase</h3>
            <p className="text-gf-smoke text-lg">Powerful discovery tools connect you with devoted fans worldwide.</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gf-cyan to-gf-pink rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gf-snow mb-3">Total Protection</h3>
            <p className="text-gf-smoke text-lg">Advanced watermarking, DRM, and anti-piracy for your content.</p>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-12 text-gf-pink">Creator Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Zap className="w-8 h-8 text-gf-pink mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Live Streaming</h3>
              <p className="text-gf-smoke">HD streaming with AR/VR support, real-time tips, and interactive features.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Globe className="w-8 h-8 text-gf-violet mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">NFT Content</h3>
              <p className="text-gf-smoke">Mint exclusive content as NFTs with built-in royalties and ownership tracking.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <TrendingUp className="w-8 h-8 text-gf-cyan mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Advanced Analytics</h3>
              <p className="text-gf-smoke">Real-time insights into earnings, engagement, and fan demographics.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <DollarSign className="w-8 h-8 text-gf-pink mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Multiple Revenue Streams</h3>
              <p className="text-gf-smoke">Subscriptions, tips, PPV content, custom requests, and merchandise.</p>
            </div>
          </div>
        </section>

        <section className="bg-gf-graphite border border-gf-smoke/20 p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-gf-snow mb-4">Ready to Join?</h2>
          <p className="text-xl text-gf-smoke mb-8">Start earning from your content in minutes</p>
          <a 
            href="/onboarding/creator" 
            className="inline-block px-10 py-4 bg-gradient-to-r from-gf-pink to-gf-violet text-white text-lg rounded-lg font-bold hover:opacity-90 transition-opacity"
            data-testid="link-signup-creator"
          >
            Create Your Account
          </a>
        </section>
      </div>
      <Footer />
    </div>
  );
}
