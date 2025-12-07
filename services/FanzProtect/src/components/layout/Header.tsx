import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/theme-toggle";
import { Menu } from "lucide-react";

const nav = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#how", label: "How it Works" },
  { href: "#faq", label: "FAQ" },
  { href: "#blog", label: "Blog" },
  { href: "#", label: "Sign in" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-background/70 border-b">
      <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#" className="font-semibold tracking-tight">FanzDefender</a>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {nav.map((n) => (
            <a key={n.label} href={n.href} className="text-muted-foreground hover:text-foreground transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="#pricing">
            <Button className="bg-accent text-accent-foreground hover:opacity-90">Start Free Trial</Button>
          </a>
          <ModeToggle />
          <button className="md:hidden p-2 rounded hover:bg-muted" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}