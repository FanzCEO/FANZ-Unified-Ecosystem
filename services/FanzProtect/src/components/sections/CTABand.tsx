import { Button } from "@/components/ui/button";

export default function CTABand() {
  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-4 rounded-2xl border bg-card p-8 text-center">
        <h3 className="text-2xl font-semibold">Ready to clean up the internet?</h3>
        <p className="mt-2 text-sm text-muted-foreground">Draft powerful demand and DMCA letters in minutes.</p>
        <a href="#pricing"><Button className="mt-5">Start Free Trial</Button></a>
      </div>
    </section>
  );
}
// If a primary Button is used here, no change needed; ensure accent tokens are applied via existing variants.