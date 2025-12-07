import { Button } from '@/components/ui/button';
import { ArrowRight, Star } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-purple-gold opacity-90"></div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-purple-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 text-white">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">Premium Platform for Mature Women Creators</span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
            Where Experience
            <br />
            <span className="text-yellow-400">Meets Empowerment</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            The premier platform celebrating mature women content creators. Keep more of what you earn with our 15% commission. Join a community that values confidence, authenticity, and experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" className="btn-gold text-lg px-10 py-6 group">
              Join as Creator
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="!bg-white/10 !hover:bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:text-white text-lg px-10 py-6"
            >
              Explore Creators
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-16 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold text-yellow-400 mb-2">15%</div>
              <div className="text-white/90">Commission Rate</div>
              <div className="text-sm text-white/70 mt-1">vs 20% industry standard</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold text-yellow-400 mb-2">35+</div>
              <div className="text-white/90">Target Demographic</div>
              <div className="text-sm text-white/70 mt-1">Celebrating mature creators</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold text-yellow-400 mb-2">100%</div>
              <div className="text-white/90">Age-Positive</div>
              <div className="text-sm text-white/70 mt-1">Experience is your advantage</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}