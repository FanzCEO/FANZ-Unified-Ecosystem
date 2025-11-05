import { Footer } from "@/components/layout/Footer";

export default function Blog() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">GirlFanz Blog</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">Creator stories, platform updates, and industry insights</p>
        
        <div className="text-center">
          <div className="bg-gf-graphite border border-gf-smoke/20 p-12 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Coming Soon</h2>
            <p className="text-gf-smoke">
              Our blog is currently under development. Check back soon for creator success stories, platform updates, monetization tips, and industry news.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
