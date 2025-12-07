import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BadgeUnderground from '@/components/BadgeUnderground';

export default function TransactionChargebackPolicy() {
  return (
    <main className="min-h-screen bg-ink-900">
      <Header />

      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 noisy"></div>
        <div className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center">
            <BadgeUnderground className="mb-6">Financial Policy</BadgeUnderground>
            <h1 className="font-display text-5xl md:text-7xl text-glow neon-stroke animate-flicker mb-6">
              Transaction & Chargeback Policy
            </h1>
            <p className="text-steel-300 font-mono text-sm">
              Effective Date: January 25, 2025
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-grad-brand"></div>
      </section>

      <section className="relative bg-ink-800 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert max-w-none">

            {/* Overview */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">Overview</h2>
              <p className="text-steel-300">
                This policy governs all financial transactions on FANZ™ Group Holdings LLC platforms (FanzUnlimited.com, BoyFanz, GirlFanz, PupFanz, and associated apps). It establishes rules for payments, refunds, chargebacks, creator payouts, and dispute resolution.
              </p>
            </div>

            {/* Payment Processing */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">1. Payment Processing</h2>

              <h3 className="font-display text-2xl text-white mb-3">1.1 Accepted Payment Methods</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Credit cards (Visa, Mastercard, American Express, Discover)</li>
                <li>• Debit cards with Visa/Mastercard/Amex logos</li>
                <li>• PayPal and PayPal Credit</li>
                <li>• Cryptocurrency (Bitcoin, Ethereum, USDC via authorized processors)</li>
                <li>• Digital wallets (Apple Pay, Google Pay where available)</li>
                <li>• ACH direct debit (for subscriptions only, U.S. users)</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">1.2 Payment Authorization</h3>
              <p className="text-steel-300 mb-4">By providing payment information, you authorize FANZ to:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Charge your payment method for subscriptions, tips, purchases, and unlocks</li>
                <li>• Store payment credentials securely via PCI-DSS compliant processors</li>
                <li>• Process recurring charges for active subscriptions until canceled</li>
                <li>• Verify payment method validity and available funds</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">1.3 Transaction Fees</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left mt-4">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Transaction Type</th>
                      <th className="pb-3 text-white font-display">Platform Fee</th>
                      <th className="pb-3 text-white font-display">Payment Processing Fee</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">Subscriptions</td>
                      <td className="py-3">20% platform fee</td>
                      <td className="py-3">2.9% + $0.30 per transaction</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Tips</td>
                      <td className="py-3">20% platform fee</td>
                      <td className="py-3">2.9% + $0.30 per transaction</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Pay-Per-View Unlocks</td>
                      <td className="py-3">20% platform fee</td>
                      <td className="py-3">2.9% + $0.30 per transaction</td>
                    </tr>
                    <tr>
                      <td className="py-3">Cryptocurrency</td>
                      <td className="py-3">20% platform fee</td>
                      <td className="py-3">Variable network fees (1-5%)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-lg bg-ink-800 border border-neon-cyan/30 mt-4">
                <p className="text-white font-display mb-2">Fee Transparency</p>
                <p className="text-steel-300 text-sm">
                  All fees are disclosed at checkout. Creators receive 80% of gross revenue minus payment processing fees. Example: $10 subscription = $8.00 to creator minus $0.29 processing = $7.71 net to creator.
                </p>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">2. Subscriptions</h2>

              <h3 className="font-display text-2xl text-white mb-3">2.1 Subscription Billing</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Subscriptions renew automatically on a monthly basis</li>
                <li>• Initial charge occurs immediately upon subscription</li>
                <li>• Renewal charge occurs on the same date each month</li>
                <li>• If the subscription date does not exist in a given month (e.g., 31st), renewal occurs on the last day of that month</li>
                <li>• You will receive email notification 3 days before renewal</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">2.2 Subscription Cancellation</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Cancel anytime from your account settings</li>
                <li>• Cancellation takes effect at the end of the current billing period</li>
                <li>• No refunds for partial months or unused time</li>
                <li>• Access to creator content continues until subscription expires</li>
                <li>• Canceled subscriptions can be reactivated at any time</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">2.3 Subscription Price Changes</h3>
              <p className="text-steel-300 mb-4">
                If a Content Star changes their subscription price:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Existing subscribers are notified via email and in-app notification</li>
                <li>• Price changes take effect at your next renewal date</li>
                <li>• You may cancel before the renewal to avoid the new price</li>
                <li>• Grandfathered pricing: creators may choose to honor old prices for existing subscribers</li>
              </ul>
            </div>

            {/* Refunds */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">3. Refund Policy</h2>

              <h3 className="font-display text-2xl text-white mb-3">3.1 General Refund Rules</h3>
              <div className="p-6 rounded-lg bg-ink-800 border border-neon-pink/50 mb-6">
                <p className="text-white font-display mb-3">No Refunds on Digital Content</p>
                <p className="text-steel-300">
                  All sales are final for subscriptions, tips, and pay-per-view content once accessed. Digital content cannot be "returned" once viewed.
                </p>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">3.2 Exceptions (Refunds Allowed)</h3>
              <p className="text-steel-300 mb-4">Refunds may be issued in the following cases:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">Technical Error:</span> You were charged but did not receive access to content due to platform malfunction</li>
                <li>• <span className="text-white font-display">Duplicate Charge:</span> You were charged multiple times for the same transaction</li>
                <li>• <span className="text-white font-display">Fraudulent Activity:</span> Unauthorized charges made on your payment method</li>
                <li>• <span className="text-white font-display">Creator Account Termination:</span> Creator's account was banned/suspended for policy violations within 7 days of your subscription</li>
                <li>• <span className="text-white font-display">Billing Error:</span> Incorrect amount charged due to system error</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">3.3 Refund Request Process</h3>
              <div className="space-y-3 text-steel-300">
                <div>
                  <p className="text-white font-display mb-1">Step 1: Submit Request</p>
                  <p className="text-sm">Email <a href="mailto:billing@fanzunlimited.com" className="text-neon-cyan hover:text-glow transition font-mono">billing@fanzunlimited.com</a> with transaction ID, date, amount, and reason</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Step 2: Review (3-5 Business Days)</p>
                  <p className="text-sm">Our billing team investigates and responds with approval/denial</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Step 3: Processing (5-10 Business Days)</p>
                  <p className="text-sm">Approved refunds appear on your payment method within 5-10 business days</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-ink-800 border border-white/5 mt-4">
                <p className="text-white font-display mb-2">Dispute Timeline</p>
                <p className="text-steel-300 text-sm">
                  Refund requests must be submitted within 30 days of the transaction date. Requests after 30 days will not be considered.
                </p>
              </div>
            </div>

            {/* Chargebacks */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-pink/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">4. Chargeback Policy</h2>

              <h3 className="font-display text-2xl text-white mb-3">4.1 What is a Chargeback?</h3>
              <p className="text-steel-300 mb-4">
                A chargeback occurs when you dispute a charge with your bank/card issuer instead of requesting a refund from FANZ. Chargebacks bypass our dispute resolution process and trigger automatic penalties.
              </p>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">4.2 Chargeback Consequences</h3>
              <div className="p-6 rounded-lg bg-ink-800 border border-neon-pink/50 mb-6">
                <p className="text-white font-display mb-3">Immediate Account Suspension</p>
                <ul className="space-y-2 text-steel-300 ml-4">
                  <li>• Account is suspended pending chargeback resolution</li>
                  <li>• Access to all content is revoked</li>
                  <li>• Additional chargebacks result in permanent ban</li>
                  <li>• Chargeback fees ($15-$25) are added to your account balance</li>
                </ul>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-6">4.3 Disputing Chargebacks</h3>
              <p className="text-steel-300 mb-4">
                FANZ will contest illegitimate chargebacks by providing evidence to your bank:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Transaction records and timestamps</li>
                <li>• Proof of content delivery and access logs</li>
                <li>• IP addresses and device information</li>
                <li>• User agreement acceptance records</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">4.4 Legitimate Chargebacks</h3>
              <p className="text-steel-300 mb-4">
                If your chargeback is for genuine fraud (stolen card, unauthorized access), contact us at <a href="mailto:fraud@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono">fraud@fanzunlimited.com</a> before filing with your bank. We will:
              </p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Immediately suspend the compromised account</li>
                <li>• Reverse fraudulent charges without penalties</li>
                <li>• Assist with account recovery if you were the victim</li>
              </ul>
            </div>

            {/* Creator Payouts */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">5. Creator Payouts</h2>

              <h3 className="font-display text-2xl text-white mb-3">5.1 Payout Schedule</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">Payout Frequency:</span> Weekly or monthly (creator's choice)</li>
                <li>• <span className="text-white font-display">Weekly Payouts:</span> Every Monday for previous week's earnings (Monday-Sunday)</li>
                <li>• <span className="text-white font-display">Monthly Payouts:</span> 1st of the month for previous month's earnings</li>
                <li>• <span className="text-white font-display">Processing Time:</span> 3-5 business days to reach your bank account</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">5.2 Minimum Payout Threshold</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left mt-4">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="pb-3 text-white font-display">Payout Method</th>
                      <th className="pb-3 text-white font-display">Minimum Threshold</th>
                      <th className="pb-3 text-white font-display">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="text-steel-300">
                    <tr className="border-b border-white/5">
                      <td className="py-3">ACH Direct Deposit (U.S.)</td>
                      <td className="py-3">$20</td>
                      <td className="py-3">Free</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">Wire Transfer (U.S.)</td>
                      <td className="py-3">$100</td>
                      <td className="py-3">$25 per transfer</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">International Wire</td>
                      <td className="py-3">$100</td>
                      <td className="py-3">$45 per transfer</td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3">PayPal</td>
                      <td className="py-3">$10</td>
                      <td className="py-3">2% (max $20)</td>
                    </tr>
                    <tr>
                      <td className="py-3">Cryptocurrency (BTC/ETH/USDC)</td>
                      <td className="py-3">$50</td>
                      <td className="py-3">Network fees (variable)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">5.3 Payout Holds & Reserves</h3>
              <p className="text-steel-300 mb-4">FANZ may hold or delay payouts in the following cases:</p>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• <span className="text-white font-display">New Creator Reserve:</span> First 30 days of earnings held for chargeback protection (released after 30 days)</li>
                <li>• <span className="text-white font-display">High Chargeback Rate:</span> Reserve increased to 10-20% if chargeback rate exceeds 1%</li>
                <li>• <span className="text-white font-display">Pending Investigation:</span> Payouts frozen during policy violation investigations</li>
                <li>• <span className="text-white font-display">Incomplete KYC:</span> Tax forms or ID verification missing</li>
              </ul>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">5.4 Payout Reporting & Taxes</h3>
              <ul className="space-y-2 text-steel-300 ml-4">
                <li>• Detailed earnings reports available in creator dashboard</li>
                <li>• 1099-NEC forms issued annually (U.S. creators earning $600+)</li>
                <li>• W-9/W-8BEN required before first payout</li>
                <li>• International tax withholding may apply per treaty rates</li>
              </ul>
            </div>

            {/* Dispute Resolution */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-white/10 mb-8">
              <h2 className="font-display text-3xl text-white mb-4">6. Payment Dispute Resolution</h2>

              <h3 className="font-display text-2xl text-white mb-3">6.1 Internal Dispute Process</h3>
              <p className="text-steel-300 mb-4">Before initiating chargebacks or legal action, you agree to:</p>
              <div className="space-y-3 text-steel-300">
                <div>
                  <p className="text-white font-display mb-1">Step 1: Contact Support (Required)</p>
                  <p className="text-sm">Email <a href="mailto:billing@fanzunlimited.com" className="text-neon-cyan hover:text-glow transition font-mono">billing@fanzunlimited.com</a> with detailed explanation</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Step 2: Good Faith Negotiation (7 Days)</p>
                  <p className="text-sm">FANZ investigates and attempts to resolve dispute informally</p>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Step 3: Escalation (If Unresolved)</p>
                  <p className="text-sm">Dispute escalated to senior billing team for final review</p>
                </div>
              </div>

              <h3 className="font-display text-2xl text-white mb-3 mt-8">6.2 Arbitration for Payment Disputes</h3>
              <p className="text-steel-300 mb-4">
                Payment disputes over $500 that cannot be resolved internally are subject to binding arbitration as described in the <a href="/policies/user-agreement" className="text-neon-pink hover:text-glow transition">User Agreement</a>, Section 4.
              </p>

              <div className="p-4 rounded-lg bg-ink-800 border border-white/5">
                <p className="text-white font-display mb-2">Small Claims Exception</p>
                <p className="text-steel-300 text-sm">
                  Disputes under $500 may be filed in small claims court in Sheridan County, Wyoming or your local jurisdiction.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="p-8 rounded-2xl bg-ink-900/50 border border-neon-cyan/30">
              <h2 className="font-display text-3xl text-white mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-white font-display mb-1">Billing & Refunds</p>
                  <a href="mailto:billing@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    billing@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Fraud & Chargebacks</p>
                  <a href="mailto:fraud@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    fraud@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Creator Payouts</p>
                  <a href="mailto:payouts@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    payouts@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">General Support</p>
                  <a href="mailto:support@fanzunlimited.com" className="text-neon-pink hover:text-glow transition font-mono text-sm">
                    support@fanzunlimited.com
                  </a>
                </div>
                <div>
                  <p className="text-white font-display mb-1">Address</p>
                  <p className="text-steel-300 font-mono text-sm">30 N Gould Street #45302, Sheridan, WY 82801</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
