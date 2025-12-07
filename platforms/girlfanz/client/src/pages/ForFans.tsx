import { Footer } from "@/components/layout/Footer";
import { Heart, Video, MessageCircle, Star, Lock, Zap } from "lucide-react";

export default function ForFans() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gf-cyan/20 via-transparent to-gf-pink/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gf-cyan via-gf-pink to-gf-violet bg-clip-text text-transparent" data-testid="text-page-title">
            Connect with Your Favorites
          </h1>
          <p className="text-2xl text-gf-smoke mb-8 max-w-3xl mx-auto">
            Get exclusive access to the creators you love. Support them directly and enjoy premium content.
          </p>
          <a 
            href="/onboarding/fan" 
            className="inline-block px-10 py-4 bg-gradient-to-r from-gf-cyan to-gf-pink text-white text-lg rounded-lg font-bold hover:opacity-90 transition-opacity"
            data-testid="link-join-now"
          >
            Join for Free
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <section className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gf-cyan to-gf-violet rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gf-snow mb-3">Exclusive Content</h3>
            <p className="text-gf-smoke text-lg">Access premium photos, videos, and live streams from your favorite creators.</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gf-pink to-gf-cyan rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gf-snow mb-3">Direct Messaging</h3>
            <p className="text-gf-smoke text-lg">Chat directly with creators. Request custom content. Build real connections.</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gf-violet to-gf-pink rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gf-snow mb-3">Support Creators</h3>
            <p className="text-gf-smoke text-lg">Tips, subscriptions, and purchases directly support your favorite artists.</p>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-12 text-gf-pink">Fan Experience</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Video className="w-8 h-8 text-gf-pink mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">HD Live Streams</h3>
              <p className="text-gf-smoke">Watch live broadcasts in crystal-clear quality with interactive features.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Star className="w-8 h-8 text-gf-violet mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Personalized Feed</h3>
              <p className="text-gf-smoke">AI-powered recommendations show you content from creators you'll love.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Zap className="w-8 h-8 text-gf-cyan mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Instant Notifications</h3>
              <p className="text-gf-smoke">Never miss new content from your followed creators with real-time alerts.</p>
            </div>

            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <Lock className="w-8 h-8 text-gf-pink mb-3" />
              <h3 className="text-xl font-semibold text-gf-snow mb-2">Private & Secure</h3>
              <p className="text-gf-smoke">Your privacy is protected with encrypted payments and discreet billing.</p>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-gf-cyan/10 to-gf-pink/10 border border-gf-smoke/20 p-12 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-gf-snow mb-4">Start Exploring</h2>
          <p className="text-xl text-gf-smoke mb-8">Discover amazing creators and exclusive content today</p>
          <a 
            href="/discover" 
            className="inline-block px-10 py-4 bg-gradient-to-r from-gf-cyan to-gf-pink text-white text-lg rounded-lg font-bold hover:opacity-90 transition-opacity"
            data-testid="link-browse-creators"
          >
            Browse Creators
          </a>
        </section>
      </div>
      <Footer />
    </div>
  );
}
