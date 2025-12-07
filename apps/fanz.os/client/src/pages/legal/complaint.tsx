export default function Complaint() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Complaint Policy
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">How to File a Complaint</h2>
              <p>
                We take all complaints seriously and provide multiple channels for users to report 
                issues, violations, or concerns. Complaints can be submitted through our online form, 
                email, or direct message to our support team.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Types of Complaints</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Content violations or inappropriate material</li>
                <li>Copyright infringement (DMCA complaints)</li>
                <li>Harassment or abusive behavior</li>
                <li>Privacy violations</li>
                <li>Technical issues or billing disputes</li>
                <li>Age verification concerns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Investigation Process</h2>
              <p>
                All complaints are reviewed within 24 hours of receipt. Our investigation team will 
                assess the complaint, gather relevant information, and take appropriate action. 
                Complex cases may require additional time for thorough investigation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Response Timeline</h2>
              <p>
                We aim to provide initial responses within 24 hours and complete investigations 
                within 5-7 business days. Urgent matters involving safety or legal violations 
                receive immediate priority and expedited handling.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Anonymous Reporting</h2>
              <p>
                Users may submit complaints anonymously if desired. While anonymous reports may 
                limit our ability to follow up directly, all reports are investigated thoroughly 
                regardless of whether contact information is provided.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Appeal Process</h2>
              <p>
                If you disagree with the resolution of your complaint, you may submit an appeal 
                within 30 days. Appeals are reviewed by senior staff members who were not involved 
                in the original investigation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Submit a Complaint</h2>
              <p>
                Email: complaints@fanz.com<br />
                Support Portal: Available 24/7 through your account dashboard<br />
                Phone: 1-800-FANZ-HELP<br />
                Address: 30 N Gould St #45302 Sheridan, Wyoming United States
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}