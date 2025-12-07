import { useRoute } from "wouter";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Lock, Scale, AlertTriangle, Copyright } from "lucide-react";

const legalContent = {
  "2257": {
    title: "18 U.S.C. § 2257 Compliance",
    icon: Shield,
    sections: [
      {
        heading: "Record-Keeping Requirements",
        content: "DaddyFanz complies with 18 U.S.C. § 2257 and 28 C.F.R. Part 75 record-keeping requirements for all content depicting actual sexually explicit conduct. All models, performers, and other persons who appear in any visual depiction of actual or simulated sexually explicit conduct appearing on this platform were over the age of 18 years at the time of creation of such depictions."
      },
      {
        heading: "Custodian of Records",
        content: "Records required to be maintained under 18 U.S.C. § 2257 and 28 C.F.R. Part 75 for materials contained on this platform are kept by the designated Custodian of Records. Content creators are required to maintain their own records in compliance with these regulations."
      },
      {
        heading: "Content Creator Responsibilities",
        content: "All content creators on DaddyFanz are required to verify and maintain records proving that all individuals appearing in their content are at least 18 years of age. Creators must provide age verification documentation for all performers in their content upon request."
      },
      {
        heading: "Enforcement",
        content: "DaddyFanz takes compliance with federal record-keeping requirements seriously. Any creator found to be in violation of these requirements will be immediately removed from the platform and reported to appropriate authorities."
      }
    ]
  },
  "gdpr": {
    title: "GDPR Compliance",
    icon: Lock,
    sections: [
      {
        heading: "Data Protection Rights",
        content: "Under the General Data Protection Regulation (GDPR), European Union users have specific rights regarding their personal data. DaddyFanz is committed to protecting these rights and ensuring full compliance with GDPR requirements."
      },
      {
        heading: "Your Rights Under GDPR",
        content: "You have the right to access, rectify, erase, restrict processing, data portability, and object to processing of your personal data. You also have the right to withdraw consent at any time and lodge a complaint with a supervisory authority."
      },
      {
        heading: "Data Processing Legal Basis",
        content: "We process personal data based on: (1) your consent for marketing communications and optional features, (2) contractual necessity to provide our services, (3) legal obligations including age verification and compliance, and (4) legitimate interests in fraud prevention and platform security."
      },
      {
        heading: "International Data Transfers",
        content: "Data may be transferred outside the European Economic Area. We ensure adequate protection through standard contractual clauses, adequacy decisions, and other appropriate safeguards as required by GDPR."
      },
      {
        heading: "Contact Our DPO",
        content: "For GDPR-related inquiries, contact our Data Protection Officer at privacy@daddiesfanz.com. We will respond to all requests within 30 days as required by law."
      }
    ]
  },
  "kyc": {
    title: "KYC/AML Policy",
    icon: FileText,
    sections: [
      {
        heading: "Know Your Customer (KYC)",
        content: "DaddyFanz implements robust Know Your Customer procedures for all content creators to ensure platform integrity, prevent fraud, and comply with financial regulations. All creators must verify their identity before monetizing content."
      },
      {
        heading: "Required Documentation",
        content: "Creators must provide: (1) Government-issued photo ID (passport, driver's license, or national ID card), (2) Proof of address dated within the last 90 days, (3) Tax identification information, and (4) Banking details for payouts. Additional documentation may be required based on jurisdiction and earnings level."
      },
      {
        heading: "Anti-Money Laundering (AML)",
        content: "We maintain strict anti-money laundering controls including transaction monitoring, suspicious activity reporting, and enhanced due diligence for high-value accounts. Our AML program complies with applicable financial crimes enforcement regulations."
      },
      {
        heading: "Verification Process",
        content: "Identity verification is performed using automated and manual review processes. Most verifications complete within 24-48 hours. Enhanced verification may be required for accounts with high transaction volumes or unusual activity patterns."
      },
      {
        heading: "Ongoing Monitoring",
        content: "We continuously monitor for suspicious activity, unusual transaction patterns, and potential policy violations. Accounts may be subject to periodic re-verification to maintain compliance with regulatory requirements."
      }
    ]
  },
  "terms": {
    title: "Terms of Service",
    icon: Scale,
    sections: [
      {
        heading: "Acceptance of Terms",
        content: "By accessing or using DaddyFanz, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our platform. These terms constitute a legally binding agreement between you and DaddyFanz."
      },
      {
        heading: "Age Requirement",
        content: "You must be at least 18 years old to use DaddyFanz. By using this platform, you represent and warrant that you are of legal age in your jurisdiction. We reserve the right to request proof of age at any time."
      },
      {
        heading: "Account Responsibilities",
        content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or other security breach."
      },
      {
        heading: "Content Ownership and Licensing",
        content: "Creators retain ownership of their content but grant DaddyFanz a non-exclusive license to display, distribute, and monetize content on the platform. Fans may access content according to their subscription level but may not redistribute, resell, or claim ownership."
      },
      {
        heading: "Prohibited Conduct",
        content: "Users may not: upload illegal content, impersonate others, harass or threaten other users, attempt to circumvent payment systems, scrape or crawl the platform, or violate any applicable laws. Violations may result in immediate account termination."
      },
      {
        heading: "Payment Terms",
        content: "All payments are processed through third-party payment processors. Subscription fees are non-refundable except as required by law. Creators receive payouts according to our payout schedule minus applicable platform fees and processing charges."
      },
      {
        heading: "Limitation of Liability",
        content: "DaddyFanz is provided 'as is' without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount you paid us in the 12 months prior to any claim."
      },
      {
        heading: "Changes to Terms",
        content: "We may modify these Terms of Service at any time. Continued use of the platform after changes constitutes acceptance of the new terms. Material changes will be communicated via email or platform notification."
      }
    ]
  },
  "privacy": {
    title: "Privacy Policy",
    icon: Lock,
    sections: [
      {
        heading: "Information We Collect",
        content: "We collect information you provide directly (account details, profile information, payment data), automatically through your use of the platform (device information, IP address, browsing activity), and from third parties (payment processors, identity verification services)."
      },
      {
        heading: "How We Use Your Information",
        content: "We use your information to: provide and improve our services, process transactions, verify identity and age, prevent fraud and abuse, communicate with you, comply with legal obligations, and personalize your experience."
      },
      {
        heading: "Information Sharing",
        content: "We share information with: payment processors for transaction processing, identity verification services for KYC/AML compliance, law enforcement when legally required, service providers who assist our operations, and other users as necessary to provide services (e.g., creators see subscriber counts)."
      },
      {
        heading: "Data Security",
        content: "We implement industry-standard security measures including encryption, access controls, regular security audits, and secure data storage. However, no system is completely secure, and we cannot guarantee absolute security of your information."
      },
      {
        heading: "Your Privacy Rights",
        content: "You have the right to access, correct, delete, or export your personal data. You can manage privacy settings in your account dashboard. For GDPR or CCPA requests, contact privacy@daddiesfanz.com."
      },
      {
        heading: "Cookies and Tracking",
        content: "We use cookies and similar technologies for authentication, preferences, analytics, and advertising. You can control cookie settings through your browser, but some features may not function properly if cookies are disabled."
      },
      {
        heading: "Data Retention",
        content: "We retain your information for as long as your account is active and as necessary to comply with legal obligations, resolve disputes, and enforce our agreements. Deleted account data is retained for 90 days before permanent deletion."
      }
    ]
  },
  "dmca": {
    title: "DMCA Policy",
    icon: Copyright,
    sections: [
      {
        heading: "Copyright Infringement Policy",
        content: "DaddyFanz respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). We respond promptly to valid copyright infringement notices and will remove infringing content."
      },
      {
        heading: "Filing a DMCA Takedown Notice",
        content: "To file a DMCA notice, you must provide: (1) Your physical or electronic signature, (2) Identification of the copyrighted work, (3) Identification of the infringing material and its location, (4) Your contact information, (5) A statement of good faith belief that use is unauthorized, (6) A statement under penalty of perjury that the information is accurate and you are authorized to act."
      },
      {
        heading: "Counter-Notification Process",
        content: "If you believe your content was wrongly removed, you may file a counter-notification. We will forward it to the complaining party and may restore the content within 10-14 business days unless the copyright owner files a court action."
      },
      {
        heading: "Designated DMCA Agent",
        content: "All DMCA notices and counter-notifications should be sent to our designated agent: dmca@daddiesfanz.com. Physical mail: DaddyFanz DMCA Agent, Legal Department."
      },
      {
        heading: "Repeat Infringer Policy",
        content: "We will terminate accounts of users who are repeat copyright infringers. Multiple validated DMCA complaints against an account may result in permanent suspension."
      },
      {
        heading: "Creator Protections",
        content: "Creators own their original content and can issue DMCA takedown notices for unauthorized use of their content on other platforms. We provide tools to help creators protect their intellectual property."
      }
    ]
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    icon: AlertTriangle,
    sections: [
      {
        heading: "Permitted Use",
        content: "DaddyFanz is intended for legal adult content creation and consumption. Users must be 18+ and comply with all applicable laws. Content must not violate any local, state, national, or international laws or regulations."
      },
      {
        heading: "Prohibited Content",
        content: "The following content is strictly prohibited: illegal content of any kind, content depicting minors or individuals who appear to be minors, non-consensual content, violent or extreme content, hate speech or discriminatory content, content promoting illegal activities, and deceptive or fraudulent content."
      },
      {
        heading: "Content Moderation",
        content: "All content is subject to automated and human moderation. We use AI-powered tools to detect prohibited content, deepfakes, and policy violations. Content flagged by our systems undergoes manual review by trained moderators."
      },
      {
        heading: "Prohibited Activities",
        content: "Users may not: attempt to hack or breach platform security, create multiple accounts to evade bans, engage in spam or manipulation, harass or threaten other users, attempt payment fraud or chargebacks abuse, use bots or automated tools, or scrape platform data."
      },
      {
        heading: "Enforcement",
        content: "Violations may result in: content removal, account warnings, temporary suspension, permanent account termination, loss of earnings, and reporting to law enforcement. We reserve the right to take any action necessary to maintain platform integrity."
      },
      {
        heading: "Reporting Violations",
        content: "If you encounter content or behavior that violates this policy, please report it immediately using the report button or contact abuse@daddiesfanz.com. All reports are reviewed and investigated promptly."
      }
    ]
  }
};

export default function LegalPage() {
  const [, params] = useRoute("/legal/:page");
  const page = params?.page || "terms";
  const content = legalContent[page as keyof typeof legalContent];

  if (!content) {
    return (
      <div className="min-h-screen bg-df-obsidian">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl text-df-snow">Page not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  const IconComponent = content.icon;

  return (
    <div className="min-h-screen bg-df-obsidian">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-df-brick rounded-lg border border-df-steel">
            <IconComponent className="w-8 h-8 text-df-cyan" />
          </div>
          <h1 className="text-4xl neon-heading">{content.title}</h1>
        </div>

        <div className="space-y-6">
          {content.sections.map((section, index) => (
            <Card key={index} className="bg-df-brick border-df-steel">
              <CardHeader>
                <CardTitle className="text-xl text-df-snow">{section.heading}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-df-fog leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-df-brick border border-df-steel rounded-lg">
          <p className="text-df-fog text-sm">
            <strong className="text-df-snow">Last Updated:</strong> October 2024
          </p>
          <p className="text-df-fog text-sm mt-2">
            For questions about this policy, contact us at <a href="mailto:legal@daddiesfanz.com" className="text-df-cyan hover:underline" data-testid="link-legal-email">legal@daddiesfanz.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
