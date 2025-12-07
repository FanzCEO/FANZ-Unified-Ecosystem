import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(800px_400px_at_50%_-50%,hsl(var(--accent)/0.2),transparent)]" />
      <div className="max-w-[1200px] mx-auto px-4 py-16 md:py-28 text-center">
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">FanzProtect for Adult Creators</h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-3xl mx-auto">Comprehensive legal protection platform with DMCA takedowns, demand letters, evidence management, and professional legal support—defend your content and brand across all platforms.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="#pricing"><Button className="bg-accent text-accent-foreground px-6">Start Free Trial</Button></a>
          <a href="#how"><Button variant="outline" className="px-6">See How It Works</Button></a>
        </div>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          <Badge icon={<ShieldCheck />} text="Bank-grade security" />
          <Badge icon={<Lock />} text="Privacy-first" />
          <Badge icon={<BadgeCheck />} text="Cancel anytime" />
        </div>
      </div>
    </section>
  );
}

function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full border px-3 py-2 bg-card/60">
      <span className="text-accent">{icon}</span>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}