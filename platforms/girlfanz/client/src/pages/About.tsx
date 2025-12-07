import { Footer } from "@/components/layout/Footer";
import { Sparkles, Shield, Zap, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">About GirlFanz</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">The premier cyber-glam platform empowering female creators worldwide</p>
        
        <div className="prose prose-invert max-w-none space-y-12">
          <section className="text-center">
            <h2 className="text-3xl font-semibold text-gf-snow mb-4">Our Mission</h2>
            <p className="text-lg text-gf-smoke max-w-3xl mx-auto">
              GirlFanz exists to revolutionize how female content creators connect with their fans, monetize their work, and build sustainable digital empires. We combine cutting-edge technology with creator-first principles to deliver an unmatched platform experience.
            </p>
          </section>

          <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gf-pink to-gf-violet rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Creator-First</h3>
              <p className="text-gf-smoke">Built by creators, for creators. Your success is our priority.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gf-violet to-gf-cyan rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Safe & Secure</h3>
              <p className="text-gf-smoke">Industry-leading security, privacy, and content protection.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gf-cyan to-gf-pink rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Cutting-Edge Tech</h3>
              <p className="text-gf-smoke">AI-powered tools, blockchain NFTs, AR/VR streaming, and more.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gf-pink to-gf-cyan rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Community Driven</h3>
              <p className="text-gf-smoke">A supportive ecosystem where creators and fans thrive together.</p>
            </div>
          </section>

          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-3xl font-semibold text-gf-snow mb-4">Our Story</h2>
            <p className="text-gf-smoke mb-4">
              Founded in 2024, GirlFanz emerged from a simple vision: create a platform that truly empowers female creators in the digital age. We recognized that existing platforms failed to provide the tools, support, and revenue opportunities that creators deserved.
            </p>
            <p className="text-gf-smoke mb-4">
              Today, GirlFanz is the fastest-growing creator platform, serving thousands of creators and millions of fans worldwide. Our FanzTrust™ financial ecosystem has processed over $50M in creator earnings, and our innovative features like holographic streaming and AI voice cloning set the industry standard.
            </p>
            <p className="text-gf-smoke">
              We're just getting started. Join us in shaping the future of digital content creation.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-gf-snow mb-6 text-center">Platform Statistics</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-gf-pink mb-2">10,000+</div>
                <div className="text-gf-smoke">Active Creators</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gf-violet mb-2">500K+</div>
                <div className="text-gf-smoke">Engaged Fans</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-gf-cyan mb-2">$50M+</div>
                <div className="text-gf-smoke">Creator Earnings</div>
              </div>
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-3xl font-semibold text-gf-snow mb-4">Join the Revolution</h2>
            <p className="text-lg text-gf-smoke mb-6">Ready to start your journey with GirlFanz?</p>
            <div className="flex gap-4 justify-center">
              <a 
                href="/onboarding/creator" 
                className="px-8 py-3 bg-gradient-to-r from-gf-pink to-gf-violet text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                data-testid="link-become-creator"
              >
                Become a Creator
              </a>
              <a 
                href="/" 
                className="px-8 py-3 border border-gf-pink text-gf-pink rounded-lg font-semibold hover:bg-gf-pink/10 transition-colors"
                data-testid="link-join-fans"
              >
                Join as a Fan
              </a>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
