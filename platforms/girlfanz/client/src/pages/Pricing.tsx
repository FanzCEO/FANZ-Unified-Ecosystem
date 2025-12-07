import { Footer } from "@/components/layout/Footer";
import { Check } from "lucide-react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Transparent Pricing</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">Simple, fair pricing for creators and fans</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          <div className="bg-gf-graphite border-2 border-gf-pink/50 p-8 rounded-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gf-pink mb-2">For Creators</h2>
              <div className="text-5xl font-bold text-gf-snow my-6">80%</div>
              <p className="text-xl text-gf-smoke">You keep 80% of all earnings</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-pink flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">20% platform fee on all revenue</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-pink flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">No setup or monthly fees</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-pink flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Free account creation</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-pink flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Unlimited content uploads</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-pink flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Monthly payouts (minimum $50)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-pink flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Advanced analytics included</span>
              </li>
            </ul>

            <a 
              href="/onboarding/creator" 
              className="block w-full py-3 bg-gradient-to-r from-gf-pink to-gf-violet text-white text-center rounded-lg font-semibold hover:opacity-90 transition-opacity"
              data-testid="link-start-earning"
            >
              Start Earning
            </a>
          </div>

          <div className="bg-gf-graphite border-2 border-gf-cyan/50 p-8 rounded-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gf-cyan mb-2">For Fans</h2>
              <div className="text-5xl font-bold text-gf-snow my-6">Free</div>
              <p className="text-xl text-gf-smoke">Join and browse for free</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-cyan flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Free account creation</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-cyan flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Browse all creator profiles</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-cyan flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Follow your favorites</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-cyan flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">View free preview content</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-cyan flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Pay only for subscriptions & content you want</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 text-gf-cyan flex-shrink-0 mt-0.5" />
                <span className="text-gf-smoke">Cancel subscriptions anytime</span>
              </li>
            </ul>

            <a 
              href="/onboarding/fan" 
              className="block w-full py-3 bg-gradient-to-r from-gf-cyan to-gf-pink text-white text-center rounded-lg font-semibold hover:opacity-90 transition-opacity"
              data-testid="link-join-free"
            >
              Join for Free
            </a>
          </div>
        </div>

        <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-gf-snow mb-6 text-center">Payment Methods</h2>
          <div className="grid md:grid-cols-3 gap-6 text-center text-gf-smoke">
            <div>
              <h3 className="font-semibold text-gf-snow mb-2">Credit & Debit Cards</h3>
              <p className="text-sm">Visa, Mastercard, American Express</p>
            </div>
            <div>
              <h3 className="font-semibold text-gf-snow mb-2">Cryptocurrency</h3>
              <p className="text-sm">Bitcoin, Ethereum, USDC</p>
            </div>
            <div>
              <h3 className="font-semibold text-gf-snow mb-2">Bank Transfer</h3>
              <p className="text-sm">ACH and wire transfers supported</p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
