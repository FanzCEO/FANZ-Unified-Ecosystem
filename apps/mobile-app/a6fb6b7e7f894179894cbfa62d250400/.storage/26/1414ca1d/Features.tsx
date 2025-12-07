import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Shield, TrendingUp, Heart, Award } from 'lucide-react';

const features = [
  {
    icon: DollarSign,
    title: 'Keep More of What You Earn',
    description: '15% commission rate means you keep 85% of your earnings. That\'s 25% more than OnlyFans. For creators earning $5,000/month, that\'s $3,000 saved annually.',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  {
    icon: Users,
    title: 'Age-Positive Community',
    description: 'Join a supportive community that celebrates maturity as an asset. Connect with fellow creators through forums, mentorship programs, and networking events.',
    color: 'text-purple-900',
    bgColor: 'bg-purple-50'
  },
  {
    icon: Shield,
    title: 'Premium Content Protection',
    description: 'Automatic watermarking, screenshot detection, geo-blocking, and DMCA takedown support. We protect your content so you can focus on creating.',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50'
  },
  {
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Detailed insights into earnings, fan demographics, content performance, and age-specific benchmarking to help you optimize your strategy.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    icon: Heart,
    title: 'Specialized Features',
    description: 'Age-specific discovery tools, mature creator spotlights, flexible pricing tiers, and marketing resources designed specifically for experienced creators.',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50'
  },
  {
    icon: Award,
    title: 'Premium Positioning',
    description: 'Command higher subscription prices ($12-$20 vs $7 average) due to your experience and quality. Attract fans who value maturity and authenticity.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50'
  }
];

export default function Features() {
  return (
    <section id="creators" className="py-24 bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Why Choose <span className="text-gradient-purple-gold">CougarFanz</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A platform designed specifically for mature women creators. Experience matters, and we're here to prove it.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="border-2 hover:border-purple-900 transition-all duration-300 hover:shadow-xl group"
              >
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-purple-900 to-purple-700 rounded-2xl p-8 text-white shadow-2xl">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-2">Ready to start earning more?</h3>
              <p className="text-purple-100">Join thousands of mature creators who've made the switch.</p>
            </div>
            <button className="btn-gold whitespace-nowrap">
              Create Your Account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}