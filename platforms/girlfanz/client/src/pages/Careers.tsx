import { Footer } from "@/components/layout/Footer";

export default function Careers() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Careers at GirlFanz</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">Join our mission to empower creators worldwide</p>
        
        <div className="space-y-8">
          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Work with Us</h2>
            <p className="text-gf-smoke mb-4">
              GirlFanz is rapidly growing and we're always looking for talented individuals who are passionate about technology, creativity, and empowerment.
            </p>
            <p className="text-gf-smoke">
              We offer competitive salaries, equity packages, comprehensive benefits, and the opportunity to shape the future of digital content creation.
            </p>
          </section>

          <section className="text-center">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Current Openings</h2>
            <p className="text-gf-smoke mb-8">Check back soon for open positions, or send us your resume for future opportunities.</p>
            <a 
              href="mailto:careers@girlfanz.com" 
              className="inline-block px-8 py-3 bg-gradient-to-r from-gf-pink to-gf-violet text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              data-testid="link-email-careers"
            >
              Email careers@girlfanz.com
            </a>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
