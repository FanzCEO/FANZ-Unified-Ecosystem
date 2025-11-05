import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/AuthModal";
import { Footer } from "@/components/layout/Footer";
import logoUrl from "@assets/Girlsbackgroud2_1759228216281.png";
import heroImage from "@assets/Girlsbackground_1759151738593.png";

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const stats = [
    { value: "50K+", label: "Active Creators" },
    { value: "2M+", label: "Loyal Fans" },
    { value: "$100M+", label: "Earned by Creators" },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gf-hero overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight">
                <span className="text-gf-snow">Feminine</span>
                <br />
                <span className="bg-heatwave bg-clip-text text-transparent glow-text">
                  but Ferocious
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gf-smoke leading-relaxed">
                Join the premier platform where fierce female creators connect with devoted fans.
                Build your empire in the cyber-glam universe of GirlFanz.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gf-gradient text-gf-snow px-8 py-4 text-lg font-display font-semibold hover:shadow-glow-pink"
                  data-testid="button-start-creating"
                >
                  Start Creating
                </Button>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="outline"
                  className="border-gf-violet text-gf-violet px-8 py-4 text-lg font-display font-semibold hover:bg-gf-violet/10"
                  data-testid="button-explore-creators"
                >
                  Explore Creators
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center min-w-[80px]">
                    <div className="font-display font-bold text-xl sm:text-2xl text-gf-pink" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      {stat.value}
                    </div>
                    <div className="text-gf-smoke text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              {/* Hero image placeholder */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="Confident creator in neon cyber-glam setting"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gf-pink/20 via-transparent to-gf-violet/20" />
              </div>

              {/* Floating elements */}
              <div className="hidden sm:block absolute -top-6 -right-6 glass-overlay rounded-lg p-3 sm:p-4" data-testid="card-earnings-preview">
                <div className="text-gf-pink font-display font-bold">$12,450</div>
                <div className="text-gf-smoke text-sm">Monthly earnings</div>
              </div>

              <div className="hidden sm:block absolute -bottom-6 -left-6 glass-overlay rounded-lg p-3 sm:p-4" data-testid="card-live-status">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                  <span className="text-gf-snow text-sm">Live streaming</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-gf-snow mb-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            Why Choose 
            <img 
              src={logoUrl} 
              alt="GirlFanz" 
              className="h-24 sm:h-32 md:h-40 w-auto rounded-lg object-cover" 
              data-testid="img-features-logo"
            />
            ?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gf-smoke">
            Built specifically for fierce female creators who demand the best
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          <div className="glass-overlay rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gf-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-display font-bold text-xl text-gf-snow mb-4">Maximum Earnings</h3>
            <p className="text-gf-smoke">
              Keep 100% of your earnings with our creator-first revenue model.
              No hidden fees, just transparent payouts.
            </p>
          </div>

          <div className="glass-overlay rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gf-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="font-display font-bold text-xl text-gf-snow mb-4">Ultimate Protection</h3>
            <p className="text-gf-smoke">
              Advanced content protection with watermarking, DRM, and anti-piracy measures
              to keep your content safe.
            </p>
          </div>

          <div className="glass-overlay rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-gf-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-display font-bold text-xl text-gf-snow mb-4">Real-Time Connection</h3>
            <p className="text-gf-smoke">
              Live streaming, instant messaging, and real-time notifications
              keep you connected with your audience.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
