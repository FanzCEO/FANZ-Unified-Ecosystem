const cases = [
  { t: "Defamation removal", d: "Stop harassment and false statements." },
  { t: "Copyright takedown", d: "Remove stolen images and videos." },
  { t: "Reputation defense", d: "Protect your business and brand." },
  { t: "Parental protection", d: "Address bullying and safety issues." },
];

export default function UseCases() {
  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-3xl font-semibold">Use cases</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cases.map((c) => (
            <div key={c.t} className="rounded-xl border p-5 bg-card shadow-sm">
              <h3 className="font-medium">{c.t}</h3>
              <p className="text-sm text-muted-foreground mt-2">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
