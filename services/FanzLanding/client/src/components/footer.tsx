import { useQuery } from "@tanstack/react-query";

interface Stats {
  totalCreators: number;
  activeCreators: number;
  totalVideos: number;
}

export default function Footer() {
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const footerSections = [
    {
      title: "Creators",
      links: [
        { label: "Support Creators", href: "#" },
        { label: "Become One", href: "#" },
        { label: "Creator Tools", href: "#" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Community Guidelines", href: "#" },
        { label: "Merch", href: "#" },
        { label: "Events", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div
              className="text-2xl font-black gradient-text mb-4"
              data-testid="footer-logo"
            >
              FUN
            </div>
            <p
              className="text-muted-foreground mb-4"
              data-testid="footer-tagline"
            >
              "Professional Creator Platform • Enterprise Security"
            </p>
            <div
              className="text-sm text-muted-foreground"
              data-testid="footer-stats"
            >
              {stats?.totalCreators?.toLocaleString() || "4,372"} STARZ thriving
              across 14 clusters
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h3
                className="font-semibold mb-4"
                data-testid={`footer-section-${section.title.toLowerCase()}`}
              >
                {section.title}
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="hover:text-foreground transition-colors"
                      data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p data-testid="footer-copyright">
            &copy; 2024 Fanz Unlimited Network. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
