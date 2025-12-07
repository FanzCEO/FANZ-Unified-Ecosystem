export default function Footer() {
  const cols = {
    Product: ["Features", "Pricing", "How it Works", "FAQ"],
    Company: ["Blog", "Support"],
    Legal: ["Terms", "Privacy", "Disclaimer", "Cookie Policy", "DMCA Policy", "Acceptable Use"],
    Resources: ["Help Center", "Status"],
    Contact: ["hello@demandai.app"],
  } as const;
  return (
    <footer className="border-t py-12">
      <div className="max-w-[1200px] mx-auto px-4 grid sm:grid-cols-3 md:grid-cols-5 gap-8 text-sm">
        {Object.entries(cols).map(([h, items]) => (
          <div key={h}>
            <h4 className="font-medium">{h}</h4>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {items.map((x) => (
                <li key={x}><a href="#" className="hover:text-foreground">{x}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1200px] mx-auto px-4 mt-8 text-xs text-muted-foreground">
        FanzDefender provides document automation and templates for informational purposes and is not a law firm. It does not provide legal advice.
      </div>
    </footer>
  );
}