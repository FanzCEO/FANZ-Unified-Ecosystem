import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  { n: "Starter", m: 19, q: "3 letters/mo", f: ["Basic templates", "PDF export"] },
  { n: "Pro", m: 49, q: "15 letters/mo", f: ["Platform templates", "Version history", "Email support"] },
  { n: "Firm/Power", m: 149, q: "60 letters/mo", f: ["5 seats", "Audit trail", "Priority support"] },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const price = (m:number)=> annual ? Math.round(m*12*0.8) : m;
  return (
    <section id="pricing" className="py-16" aria-labelledby="pricing-title">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h2 id="pricing-title" className="text-3xl font-semibold">Pricing</h2>
          <button onClick={()=>setAnnual(v=>!v)} className="text-sm rounded-full border px-3 py-1">
            {annual ? "Annual (−20%)" : "Monthly"}
          </button>
        </div>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <Card key={p.n} className={p.n==="Pro"?"ring-2 ring-accent":""}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{p.n}</span>
                  <span className="text-2xl font-bold">${price(p.m)}<span className="text-sm font-normal text-muted-foreground">{annual?"/yr":"/mo"}</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.q}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {p.f.map((x)=> <li key={x}>• {x}</li>)}
                </ul>
                <Button className="w-full mt-4 bg-accent text-accent-foreground">Start Free Trial</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">All plans include a 7-day free trial. Cancel anytime. Taxes may apply.</p>
      </div>
    </section>
  );
}
