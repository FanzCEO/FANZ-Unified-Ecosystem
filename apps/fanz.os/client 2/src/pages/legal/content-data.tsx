export default function ContentData() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Content Management Policy and Data Governance Procedures
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <div className="bg-purple-900/30 p-6 rounded-lg border border-purple-500/30 mb-6">
              <p className="text-center">
                <strong>Effective Date:</strong> October 24th, 2024<br />
                <strong>Last Updated:</strong> January 1st, 2025
              </p>
            </div>

            <section>
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 rounded-lg border border-purple-500/30 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Complete Policy Documents</h2>
                <p className="mb-4">For comprehensive information, visit our knowledge base:</p>
                <div className="space-y-3">
                  <a 
                    href="https://fanz.foundation/knowledge-base/article/content-management-policy-and-procedures" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors mr-4"
                  >
                    Content Management Policy →
                  </a>
                  <a 
                    href="https://fanz.foundation/knowledge-base/article/data-collection-statement" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Data Collection Statement →
                  </a>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
              <p>
                Fanz™ Unlimited Network LLC ("Fanz™", "we", "our", or "us") is committed to maintaining a secure, 
                lawful, and ethical online environment for content starz and users. This policy outlines our content 
                management procedures, including age and identity verification, content moderation, user responsibilities, 
                and compliance measures to prevent prohibited activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Consent, Age, and Identity Verification</h2>
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Consent Verification</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Explicit Consent:</strong> All content featuring individuals must have verifiable, written, and signed consent from all participants</li>
                <li><strong>Revocation of Consent:</strong> If any participant revokes their consent, the content star must immediately remove the content</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-purple-400 mb-2">Age Verification</h3>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>Minimum Age Requirement:</strong> All content starz and participants must be at least 18 years old</li>
                <li><strong>Verification Process:</strong> Government-issued identification must be submitted upon registration</li>
                <li><strong>Third-Party Services:</strong> Fanz™ utilizes third-party verification services (e.g., AgeChecker.Net) to ensure authenticity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Content Review and Approval</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Automated Screening:</strong> AI-powered scanning tools analyze uploaded content for illegal materials</li>
                <li><strong>Manual Review:</strong> Flagged or high-risk content is subject to human moderation before publication</li>
                <li><strong>Community Reporting:</strong> Users can report policy violations, which are investigated within 24 hours</li>
                <li><strong>Regular Audits:</strong> Ongoing automated and manual content audits ensure compliance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Prohibited Content</h2>
              <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                <p className="font-semibold mb-2">The following are strictly prohibited on Fanz™ platforms:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>CSAM, bestiality, non-consensual content, rape, or any form of exploitation</li>
                  <li>Content involving minors or individuals appearing to be minors</li>
                  <li>Illegal activities, weapons, drugs, or any material that violates applicable laws</li>
                  <li>Any content that violates user privacy, including doxxing or personal information leaks</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Privacy, Data Protection, and Security</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Encryption:</strong> All personal data secured using AES-256 encryption</li>
                <li><strong>Access Controls:</strong> Only authorized personnel can access sensitive information</li>
                <li><strong>Data Retention:</strong> Personal data retained only as long as legally required</li>
                <li><strong>Right to Erasure:</strong> Users may request data deletion in compliance with applicable laws</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p>
                  <strong>Fanz™ Unlimited Network LLC</strong><br />
                  30 N Gould Street #45302, Sheridan, WY 82801<br />
                  Email: support@fanzunlimited.com
                </p>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                © 2025 Fanz™ Unlimited Network LLC. All Rights Reserved.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}