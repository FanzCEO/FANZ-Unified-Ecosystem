import { ShieldCheck, LockKeyhole, KeyRound } from "lucide-react";

export default function SecurityCompliance() {
  const items = [
    { i: <LockKeyhole />, t: "Encryption", d: "Data encrypted in transit and at rest." },
    { i: <KeyRound />, t: "Access controls", d: "Role-based access; 2FA optional." },
    { i: <ShieldCheck />, t: "Disclaimer", d: "Informational tool, not legal advice." },
  ];
  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-3xl font-semibold">Security & compliance</h2>
        <div className="mt-8 grid sm:grid-cols-3 gap-6">
          {items.map((x) => (
            <div key={x.t} className="rounded-lg border p-6 bg-card">
              <div className="text-success">{x.i}</div>
              <h3 className="mt-3 font-medium">{x.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
