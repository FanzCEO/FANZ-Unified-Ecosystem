import { ListChecks, FileText, Send } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    { icon: <ListChecks />, title: "Tell us what happened", desc: "Guided prompts capture the facts and links." },
    { icon: <FileText />, title: "Review your draft", desc: "Jurisdiction and platform-aware language." },
    { icon: <Send />, title: "Export & send", desc: "PDF/Docx export, send, and track responses." },
  ];
  return (
    <section id="how" className="py-16" aria-labelledby="how-title">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 id="how-title" className="text-3xl font-semibold">How it works</h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.title} className="rounded-lg border p-6 bg-card">
              <div className="text-accent">{s.icon}</div>
              <h3 className="mt-3 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
