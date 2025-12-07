import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is this legal advice?", a: "No. DemandAI is not a law firm and does not provide legal advice." },
  { q: "Will this work on my platform?", a: "We include platform-aware language for major sites." },
  { q: "Do you store my documents?", a: "Your data stays private; see our Privacy Policy." },
  { q: "Can I use my letterhead?", a: "Yes, upload branding in your template settings." },
  { q: "Refunds?", a: "Monthly plans can cancel anytime; see Terms." },
  { q: "Supported countries?", a: "Most countries; DMCA applies to U.S. law." },
  { q: "What after my trial?", a: "You’ll move to your chosen plan unless cancelled." },
  { q: "Accessibility & security?", a: "We follow WCAG 2.1 AA and modern security best practices." },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-3xl font-semibold">FAQ</h2>
        <Accordion type="single" collapsible className="mt-6">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={"item-"+i}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
