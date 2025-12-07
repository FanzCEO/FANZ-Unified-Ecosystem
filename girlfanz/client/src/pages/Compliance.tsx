import { Footer } from "@/components/layout/Footer";

export default function Compliance() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gf-pink" data-testid="text-page-title">18 U.S.C. §2257 Compliance Statement</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gf-smoke">
          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Record-Keeping Compliance</h2>
            <p>GirlFanz complies with all applicable federal record-keeping and labeling requirements pursuant to 18 U.S.C. §2257 and 28 C.F.R. Part 75.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Age Verification</h2>
            <p>All content creators on GirlFanz are required to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide government-issued photo identification</li>
              <li>Complete facial recognition verification</li>
              <li>Maintain current contact information</li>
              <li>Re-verify annually to maintain creator status</li>
            </ul>
            <p className="mt-4">All performers depicted in any visual depiction of actual or simulated sexually explicit conduct appearing on this website were 18 years of age or older at the time the depiction was created.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Custodian of Records</h2>
            <div className="bg-gf-graphite border border-gf-smoke/20 p-6 rounded-lg">
              <p className="font-semibold text-gf-snow mb-2">Custodian of Records:</p>
              <p>GirlFanz Legal Department</p>
              <p>123 Tech Boulevard, Suite 400</p>
              <p>San Francisco, CA 94105</p>
              <p className="mt-4">Email: <span className="text-gf-pink">compliance@girlfanz.com</span></p>
              <p className="mt-4 text-sm text-gf-smoke/70">Records are available for inspection during regular business hours, Monday through Friday, 9:00 AM to 5:00 PM Pacific Time, excluding federal holidays. Requests for inspection must be made in writing at least 7 business days in advance.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Content Labeling</h2>
            <p>All content containing actual sexually explicit conduct is labeled in accordance with 18 U.S.C. §2257 requirements. Content producers maintain their own records as required by law.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Reporting Violations</h2>
            <p>If you believe any content on GirlFanz violates applicable laws or depicts individuals under 18 years of age, immediately report it to:</p>
            <p className="text-gf-pink font-semibold">abuse@girlfanz.com</p>
            <p className="mt-4">We also encourage reporting such content to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>National Center for Missing & Exploited Children (NCMEC): <a href="https://www.cybertipline.org" className="text-gf-violet hover:text-gf-pink transition-colors">CyberTipline.org</a></li>
              <li>FBI Internet Crime Complaint Center: <a href="https://www.ic3.gov" className="text-gf-violet hover:text-gf-pink transition-colors">IC3.gov</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Zero Tolerance Policy</h2>
            <p>GirlFanz maintains a strict zero-tolerance policy for content involving minors. Violations result in immediate account termination, content removal, and reporting to law enforcement authorities.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Exemptions</h2>
            <p>Certain content categories may be exempt from 2257 requirements. GirlFanz maintains documentation for all exemptions claimed by content producers.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
