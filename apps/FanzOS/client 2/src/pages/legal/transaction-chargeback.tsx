export default function TransactionChargeback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8">
            Transaction/Chargeback Policy
          </h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Payment Processing</h2>
              <p>
                All transactions are processed through secure, industry-standard payment processors. 
                Fanz partners with multiple payment providers to ensure reliable transaction processing 
                and compliance with financial regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Transaction Disputes</h2>
              <p>
                Users experiencing transaction issues should contact our billing support team before 
                initiating chargebacks with their financial institution. Most billing disputes can 
                be resolved quickly through direct communication.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Chargeback Prevention</h2>
              <p>
                To minimize chargebacks, we provide clear billing descriptors, detailed transaction 
                records, and proactive customer service. Users receive email confirmations for all 
                transactions and can review their billing history at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Chargeback Response</h2>
              <p>
                When chargebacks occur, Fanz provides comprehensive documentation to payment processors, 
                including transaction records, user agreements, and service delivery confirmation. 
                We actively contest illegitimate chargebacks to protect both the platform and creatorz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Impact on Creatorz</h2>
              <p>
                Excessive chargebacks may result in temporary holds on creator payments while disputes 
                are resolved. Fanz works to minimize the impact on creator earnings and provides regular 
                updates during the dispute resolution process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Fraudulent Activity</h2>
              <p>
                We employ advanced fraud detection systems to identify and prevent fraudulent transactions. 
                Suspicious activity triggers additional verification steps to protect both users and creatorz 
                from fraudulent purchases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Billing Support</h2>
              <p>
                For billing questions or transaction disputes:<br />
                Email: billing@fanz.com<br />
                Phone: 1-800-FANZ-PAY<br />
                Live Chat: Available 24/7 through your account dashboard<br />
                Address: 30 N Gould St #45302 Sheridan, Wyoming United States
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}