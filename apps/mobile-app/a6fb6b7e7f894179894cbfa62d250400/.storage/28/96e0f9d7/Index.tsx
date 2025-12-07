import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      
      {/* Why Mature Creators Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                Your Experience is Your <span className="text-gradient-purple-gold">Advantage</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                At CougarFanz, we celebrate what makes you unique. Your confidence, life experience, and authentic self-expression are exactly what audiences are seeking.
              </p>
              <ul className="space-y-4">
                {[
                  'No ageist stereotypes or limitations',
                  'Premium positioning for quality content',
                  'Cross-generational audience appeal',
                  'Supportive community of peers',
                  'Professional tools and resources'
                ].map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-purple-900 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <Button size="lg" className="btn-premium mt-6">
                Learn More About Our Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-purple-900 to-purple-700 rounded-3xl shadow-2xl flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="text-6xl font-bold mb-4">35+</div>
                  <div className="text-2xl font-semibold mb-2">Our Focus</div>
                  <div className="text-purple-200 text-lg">
                    Celebrating mature women creators who bring experience, confidence, and authenticity to their content
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Fans Section */}
      <section id="fans" className="py-24 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
              For <span className="text-gradient-purple-gold">Discerning Fans</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover confident, experienced creators who bring authenticity and quality to every interaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-purple-900 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Premium Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Access high-quality content from experienced creators who know what they're doing. Maturity brings confidence and skill.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-900 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Authentic Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Engage with creators who bring life experience and genuine personality to every interaction. Real connections, real people.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-purple-900 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Easy Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Find creators who match your preferences with age-specific filtering and curated recommendations. Quality over quantity.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="btn-gold text-lg px-10 py-6">
              Explore Creators Now
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 gradient-purple-gold">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Join CougarFanz?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Whether you're a creator looking to maximize your earnings or a fan seeking premium content from experienced creators, CougarFanz is your destination.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="btn-gold text-lg px-10 py-6">
              Join as Creator
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="!bg-white/10 !hover:bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:text-white text-lg px-10 py-6"
            >
              Browse Creators
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}