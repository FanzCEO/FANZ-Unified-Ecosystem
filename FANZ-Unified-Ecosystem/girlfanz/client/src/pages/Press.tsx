import { Footer } from "@/components/layout/Footer";

export default function Press() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Press & Media</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">Media inquiries and brand assets</p>
        
        <div className="space-y-8">
          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Media Contact</h2>
            <p className="text-gf-smoke mb-4">
              For press inquiries, partnership opportunities, or media requests, please contact our PR team:
            </p>
            <a href="mailto:press@girlfanz.com" className="text-gf-pink hover:text-gf-violet transition-colors text-lg">
              press@girlfanz.com
            </a>
          </section>

          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">About GirlFanz</h2>
            <p className="text-gf-smoke">
              GirlFanz is the premier cyber-glam platform empowering female content creators to monetize their work, connect with devoted fans, and build sustainable digital empires. Founded in 2024, we've quickly become the fastest-growing creator platform with cutting-edge features including blockchain NFTs, AI-powered tools, and holographic streaming.
            </p>
          </section>

          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Brand Assets</h2>
            <p className="text-gf-smoke mb-4">
              Official logos, brand guidelines, and press kit materials are available upon request. Please contact our press team for access.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
