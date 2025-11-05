import { Footer } from "@/components/layout/Footer";
import { CheckCircle, XCircle } from "lucide-react";

export default function Guidelines() {
  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-6 text-gf-pink text-center" data-testid="text-page-title">Community Guidelines</h1>
        <p className="text-xl text-center text-gf-smoke mb-16">Creating a safe, respectful community for creators and fans</p>
        
        <div className="space-y-12">
          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Our Values</h2>
            <p className="text-gf-smoke">
              GirlFanz is built on respect, empowerment, and safety. These guidelines help maintain a positive community where creators and fans can connect authentically.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-gf-snow mb-6 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-gf-pink" />
              What We Encourage
            </h2>
            <div className="space-y-4 text-gf-smoke">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-gf-pink flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Authentic Content</h3>
                  <p>Share original content that represents your genuine creative vision.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-gf-pink flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Respectful Interactions</h3>
                  <p>Treat all community members with kindness and respect.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-gf-pink flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Consensual Content</h3>
                  <p>Ensure all individuals in your content have provided explicit consent.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-gf-pink flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Clear Boundaries</h3>
                  <p>Communicate your boundaries and respect those of others.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-gf-pink flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Constructive Feedback</h3>
                  <p>Provide supportive, helpful feedback to fellow creators.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold text-gf-snow mb-6 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500" />
              Prohibited Content & Behavior
            </h2>
            <div className="space-y-4 text-gf-smoke">
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Content Involving Minors</h3>
                  <p>Zero tolerance. Any content depicting or involving individuals under 18 results in immediate termination and law enforcement notification.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Non-Consensual Content</h3>
                  <p>Content shared without consent of all parties, including revenge content, hidden camera footage, or deepfakes.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Harassment & Bullying</h3>
                  <p>Threatening, intimidating, or degrading behavior toward any user.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Hate Speech</h3>
                  <p>Content targeting individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Violence & Illegal Activities</h3>
                  <p>Content depicting violence, illegal drugs, human trafficking, or other criminal activities.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Intellectual Property Theft</h3>
                  <p>Posting content you don't own or don't have permission to share.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Spam & Scams</h3>
                  <p>Fraudulent schemes, phishing, excessive promotional content, or platform manipulation.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gf-snow">Impersonation</h3>
                  <p>Pretending to be another person, creator, or organization.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gf-graphite border border-gf-smoke/20 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Enforcement</h2>
            <p className="text-gf-smoke mb-4">
              Violations of these guidelines may result in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gf-smoke">
              <li>Content removal</li>
              <li>Account warnings</li>
              <li>Temporary suspension</li>
              <li>Permanent account termination</li>
              <li>Law enforcement notification (for illegal content)</li>
            </ul>
            <p className="text-gf-smoke mt-4">
              We review all reports thoroughly and take appropriate action based on severity and context.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gf-snow mb-4">Reporting Violations</h2>
            <p className="text-gf-smoke mb-4">
              If you see content or behavior that violates these guidelines:
            </p>
            <a 
              href="/help/contact" 
              className="inline-block px-8 py-3 bg-gf-pink text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              data-testid="link-report-violation"
            >
              Report a Violation
            </a>
          </section>

          <section className="text-center text-gf-smoke">
            <p>These guidelines may be updated periodically. Continued use of GirlFanz constitutes acceptance of current guidelines.</p>
            <p className="mt-2 text-sm">Last updated: October 2025</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
