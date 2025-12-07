import { Button } from "@/components/ui/button";

interface PromotionalBannerProps {
  type: "top" | "bottom";
}

export default function PromotionalBanner({ type }: PromotionalBannerProps) {
  if (type === "top") {
    return (
      <div className="bg-gradient-to-r from-fun-orange to-red-500 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="font-medium">
            🔥 Get Access to All 14 Clusters with One Platform Portal Account
          </span>
          <Button
            className="ml-4 bg-white text-fun-orange px-4 py-1 rounded-full text-sm font-bold hover:bg-opacity-90 transition-colors"
            data-testid="button-top-banner-join"
          >
            Join Portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-primary to-fun-pink rounded-lg p-8 text-center text-white">
          <div className="mb-4">
            <h2 className="text-3xl font-bold mb-2">
              Unlimited Access to All Platform Clusters
            </h2>
            <p className="text-lg mb-6">
              Join thousands of STARZ earning on their own terms across 14
              specialized clusters
            </p>
            <Button
              className="bg-white text-primary font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors transform hover:scale-105"
              data-testid="button-bottom-banner-join"
            >
              Access All Clusters
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
