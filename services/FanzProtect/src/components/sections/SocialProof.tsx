export default function SocialProof() {
  const quotes = [
    { q: "Incredible speed from facts to letter.", a: "Founder, DTC brand" },
    { q: "Platform-specific language really helps.", a: "Creator" },
    { q: "Clean UI and exports are perfect.", a: "Agency owner" },
  ];
  return (
    <section className="py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-3xl font-semibold">What people say</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {quotes.map((t) => (
            <figure key={t.q} className="rounded-xl border p-6 bg-card">
              <blockquote className="text-sm">“{t.q}”</blockquote>
              <figcaption className="mt-3 text-xs text-muted-foreground">— {t.a}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 opacity-70 text-sm text-muted-foreground">As seen on: [logo] [logo] [logo]</div>
      </div>
    </section>
  );
}
