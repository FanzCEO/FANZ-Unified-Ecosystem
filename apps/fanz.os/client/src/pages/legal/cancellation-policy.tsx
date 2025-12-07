export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Cancellation Policy
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Subscription Cancellations</h2>
              <p>
                Users may cancel their subscriptions at any time through their account settings. 
                Cancellations take effect at the end of the current billing period. Users will 
                retain access to content through the end of their paid period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Refund Policy</h2>
              <p>
                Subscription fees are generally non-refundable once a billing period has begun. 
                However, we may provide refunds in cases of technical errors, billing mistakes, 
                or other exceptional circumstances at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Pay-Per-View Purchases</h2>
              <p>
                Pay-per-view content purchases are final and non-refundable once access is granted. 
                Users should review content previews and descriptions before making purchases. 
                Technical issues preventing access may qualify for refunds.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Creator Account Termination</h2>
              <p>
                Creatorz may close their accounts at any time. Pending payments will be processed 
                according to our standard payment schedule. Content may be removed from the platform 
                upon account closure unless retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Involuntary Account Termination</h2>
              <p>
                Accounts terminated for violations of our terms of service may not be eligible 
                for refunds. Pending payments may be withheld if the termination involves legal 
                violations or harm to other users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">How to Cancel</h2>
              <p>
                To cancel subscriptions or close accounts:<br />
                1. Log into your account dashboard<br />
                2. Navigate to Account Settings<br />
                3. Select Subscription Management or Account Closure<br />
                4. Follow the prompts to complete cancellation
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Support</h2>
              <p>
                For assistance with cancellations or refunds:<br />
                Email: billing@fanz.com<br />
                Support: Available through your account dashboard<br />
                Address: 30 N Gould St #45302 Sheridan, Wyoming United States
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}