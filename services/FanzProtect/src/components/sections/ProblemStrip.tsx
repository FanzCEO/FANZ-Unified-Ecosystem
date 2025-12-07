import { AlertTriangle, Image, MessageSquare, FileWarning } from "lucide-react";

export default function ProblemStrip() {
  const items = [
    { icon: <MessageSquare className="h-4 w-4" />, text: "Defamed online?" },
    { icon: <Image className="h-4 w-4" />, text: "Stolen photos?" },
    { icon: <AlertTriangle className="h-4 w-4" />, text: "Posts won’t come down?" },
    { icon: <FileWarning className="h-4 w-4" />, text: "Overwhelmed by templates?" },
  ];
  return (
    <section className="py-6 bg-secondary/50" aria-label="Common problems">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((i) => (
          <div key={i.text} className="flex items-center gap-2 text-sm">
            <span className="text-warning">{i.icon}</span>
            <span className="text-muted-foreground">{i.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}