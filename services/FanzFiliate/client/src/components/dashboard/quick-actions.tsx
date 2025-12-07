import { Link2, Download, Banknote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Generate Tracking Link",
    description: "Create custom tracking URLs",
    icon: Link2,
    action: "generate-link",
    color: "text-primary",
  },
  {
    title: "Download Creatives",
    description: "Access banners and materials",
    icon: Download,
    action: "download-creatives",
    color: "text-chart-2",
  },
  {
    title: "Request Payout",
    description: "Process earnings withdrawal",
    icon: Banknote,
    action: "request-payout",
    color: "text-accent",
  },
];

export default function QuickActions() {
  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "generate-link":
        console.log("Generate tracking link");
        break;
      case "download-creatives":
        console.log("Download creatives");
        break;
      case "request-payout":
        console.log("Request payout");
        break;
      default:
        console.log("Unknown action:", actionType);
    }
  };

  return (
    <Card className="gradient-card border-border" data-testid="quick-actions">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={action.action}
              variant="outline"
              className="w-full justify-start p-3 h-auto border-border hover:bg-muted"
              onClick={() => handleAction(action.action)}
              data-testid={`action-${action.action}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${action.color}`} />
                <div className="text-left">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
