import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { t: "DMCA Takedown Engine", d: "Automated notice generation with platform-specific templates and submission workflows." },
  { t: "Legal Case Management", d: "Complete case lifecycle tracking from creation to resolution with deadline monitoring." },
  { t: "Evidence Chain-of-Custody", d: "Secure evidence collection with SHA-256 hashing and immutable storage." },
  { t: "Document Templates", d: "Professional demand letters, cease & desist, and platform-specific templates." },
  { t: "Real-time Notifications", d: "WebSocket alerts for case updates, deadlines, and platform responses." },
  { t: "Legal Counsel Integration", d: "Escalation workflows and professional legal support when needed." },
];

export default function FeaturesGrid() {
  return (
    <section id="features" className="py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-3xl font-semibold">Features</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.t} className="bg-card">
              <CardHeader>
                <CardTitle className="text-base">{f.t}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
