import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditCard, DollarSign, Shield, AlertCircle, HelpCircle, CheckCircle } from "lucide-react";

export default function PaymentHelpPage() {
  return (
    <div className="min-h-screen bg-df-obsidian">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-df-brick rounded-lg border border-df-steel">
              <CreditCard className="w-8 h-8 text-df-cyan" />
            </div>
            <h1 className="text-4xl neon-heading">Payment Help</h1>
          </div>
          <p className="text-df-fog text-lg">Everything you need to know about payments on DaddyFanz</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-df-brick border-df-steel text-center" data-testid="card-secure-payments">
            <CardHeader>
              <div className="w-12 h-12 bg-df-obsidian rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-df-cyan" />
              </div>
              <CardTitle className="text-df-snow">Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog text-sm">Industry-leading payment processors</p>
            </CardContent>
          </Card>

          <Card className="bg-df-brick border-df-steel text-center" data-testid="card-adult-friendly">
            <CardHeader>
              <div className="w-12 h-12 bg-df-obsidian rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-df-gold" />
              </div>
              <CardTitle className="text-df-snow">Adult-Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog text-sm">Specialized processors for adult content</p>
            </CardContent>
          </Card>

          <Card className="bg-df-brick border-df-steel text-center" data-testid="card-instant-access">
            <CardHeader>
              <div className="w-12 h-12 bg-df-obsidian rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-6 h-6 text-df-cyan" />
              </div>
              <CardTitle className="text-df-snow">Instant Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-df-fog text-sm">Immediate content access after payment</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-df-brick border-df-steel mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-df-snow">Payment Processors</CardTitle>
            <CardDescription className="text-df-fog">
              We work with trusted adult-friendly payment processors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-df-obsidian rounded border border-df-steel">
                <h3 className="text-df-snow font-semibold mb-2">CCBill</h3>
                <p className="text-df-fog text-sm">Industry leader in adult payment processing</p>
              </div>
              <div className="p-4 bg-df-obsidian rounded border border-df-steel">
                <h3 className="text-df-snow font-semibold mb-2">Segpay</h3>
                <p className="text-df-fog text-sm">Secure adult entertainment billing</p>
              </div>
              <div className="p-4 bg-df-obsidian rounded border border-df-steel">
                <h3 className="text-df-snow font-semibold mb-2">Epoch</h3>
                <p className="text-df-fog text-sm">Global payment solutions</p>
              </div>
              <div className="p-4 bg-df-obsidian rounded border border-df-steel">
                <h3 className="text-df-snow font-semibold mb-2">Paxum</h3>
                <p className="text-df-fog text-sm">Creator payout processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-df-brick border-df-steel">
          <CardHeader>
            <CardTitle className="text-2xl text-df-snow flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-df-cyan" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-payment-methods">
                  What payment methods are accepted?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  We accept credit cards (Visa, Mastercard, American Express, Discover), debit cards, and select digital payment methods. All transactions are processed through our secure adult-friendly payment processors.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-billing-descriptor">
                  How will charges appear on my statement?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Charges appear with discrete billing descriptors that do not reveal the adult nature of the content. The exact descriptor depends on your payment processor but will appear as a generic company name.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-subscription-cancel">
                  Can I cancel my subscription?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Yes, you can cancel your subscription at any time from your account settings. You'll retain access until the end of your current billing period. No refunds are provided for partial months.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-payment-failed">
                  What if my payment fails?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Payment failures can occur due to insufficient funds, expired cards, or bank blocks on adult content purchases. Contact your bank to authorize adult content transactions, or try a different payment method. Our support team can assist with payment issues.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-creator-payouts">
                  How do creator payouts work?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Creators receive payouts bi-weekly after a 7-day holding period for chargebacks. Minimum payout is $50. Payouts are processed via Paxum, ePayService, or wire transfer. Platform takes a 20% commission on all earnings.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-refund-policy">
                  What is your refund policy?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Digital content sales are generally non-refundable due to the instant delivery nature. Refunds may be granted for technical issues preventing content access, duplicate charges, or unauthorized transactions. Contact support within 48 hours for refund requests.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-payment-security">
                  Is my payment information secure?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Yes. We use PCI-DSS compliant payment processors with end-to-end encryption. DaddyFanz never stores your complete credit card information. All payment data is tokenized and secured by our payment processors.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border-df-steel">
                <AccordionTrigger className="text-df-snow hover:text-df-cyan" data-testid="accordion-currency">
                  What currencies are supported?
                </AccordionTrigger>
                <AccordionContent className="text-df-fog">
                  Transactions are processed in USD (US Dollars). Your bank may convert the charge to your local currency and may apply foreign transaction fees. Exchange rates are determined by your card issuer.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-df-brick border-df-steel mt-8">
          <CardHeader>
            <CardTitle className="text-df-snow flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-df-gold" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-df-fog mb-4">
              If you're experiencing payment issues or have questions not covered here, our support team is ready to help.
            </p>
            <div className="space-y-2">
              <p className="text-df-fog text-sm">
                <strong className="text-df-snow">Email:</strong>{" "}
                <a href="mailto:billing@daddiesfanz.com" className="text-df-cyan hover:underline" data-testid="link-billing-email">
                  billing@daddiesfanz.com
                </a>
              </p>
              <p className="text-df-fog text-sm">
                <strong className="text-df-snow">Response Time:</strong> Within 24 hours
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
