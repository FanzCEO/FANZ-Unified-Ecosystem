import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity, 
  Database, 
  Globe, 
  CreditCard, 
  Zap, 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from "lucide-react";

export default function SystemHealth() {
  const { user } = useAuth();

  // Redirect if not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <Card className="glass-overlay border-gf-smoke/20 p-8">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-error" />
            <h1 className="text-2xl font-bold text-gf-snow mb-2">Access Denied</h1>
            <p className="text-gf-smoke">You need administrator privileges to access this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  const { data: healthData, isLoading } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "operational":
      case "active":
      case "connected":
        return "text-success";
      case "maintenance":
      case "warning":
        return "text-warning";
      case "error":
      case "failed":
      case "down":
        return "text-error";
      default:
        return "text-gf-smoke";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "operational":
      case "active":
      case "connected":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "maintenance":
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "error":
      case "failed":
      case "down":
        return <AlertTriangle className="h-5 w-5 text-error" />;
      default:
        return <Clock className="h-5 w-5 text-gf-smoke" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gf-ink text-gf-snow flex items-center justify-center">
        <div className="text-xl">Loading system health...</div>
      </div>
    );
  }

  const systemServices = [
    {
      name: "API Gateway",
      icon: Globe,
      data: healthData?.apiGateway,
      borderColor: "border-success",
    },
    {
      name: "Database",
      icon: Database,
      data: healthData?.database,
      borderColor: "border-success",
    },
    {
      name: "Payments",
      icon: CreditCard,
      data: healthData?.payments,
      borderColor: "border-warning",
    },
    {
      name: "WebSocket",
      icon: Zap,
      data: healthData?.websocket,
      borderColor: "border-success",
    },
  ];

  return (
    <div className="min-h-screen bg-gf-ink text-gf-snow">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Overall Status */}
            <Card className="glass-overlay border-gf-smoke/20">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display font-bold text-2xl text-gf-snow flex items-center">
                    <Activity className="h-8 w-8 mr-3 text-gf-cyan" />
                    System Health & Monitoring
                  </h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <span className="text-success text-sm font-medium" data-testid="overall-status">
                      All Systems Operational
                    </span>
                  </div>
                </div>

                {/* System Services Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {systemServices.map((service) => {
                    const Icon = service.icon;
                    const serviceData = service.data || {};
                    
                    return (
                      <Card key={service.name} className={`glass-overlay border-l-4 ${service.borderColor}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gf-snow">{service.name}</h3>
                            <Icon className={getStatusColor(serviceData.status || "unknown")} />
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gf-smoke">Status:</span>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(serviceData.status || "unknown")}
                                <span className={getStatusColor(serviceData.status || "unknown")}>
                                  {serviceData.status || "Unknown"}
                                </span>
                              </div>
                            </div>
                            {serviceData.responseTime && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Response Time:</span>
                                <span className="text-gf-snow" data-testid={`${service.name.toLowerCase()}-response-time`}>
                                  {serviceData.responseTime}
                                </span>
                              </div>
                            )}
                            {serviceData.queryTime && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Query Time:</span>
                                <span className="text-gf-snow" data-testid={`${service.name.toLowerCase()}-query-time`}>
                                  {serviceData.queryTime}
                                </span>
                              </div>
                            )}
                            {serviceData.uptime && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Uptime:</span>
                                <span className="text-gf-snow" data-testid={`${service.name.toLowerCase()}-uptime`}>
                                  {serviceData.uptime}
                                </span>
                              </div>
                            )}
                            {serviceData.connections !== undefined && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Connections:</span>
                                <span className="text-gf-snow" data-testid={`${service.name.toLowerCase()}-connections`}>
                                  {serviceData.connections}
                                  {service.name === "Database" && serviceData.connections ? "/100" : ""}
                                </span>
                              </div>
                            )}
                            {serviceData.provider && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Provider:</span>
                                <span className="text-gf-snow">{serviceData.provider}</span>
                              </div>
                            )}
                            {serviceData.successRate && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Success Rate:</span>
                                <span className="text-gf-snow">{serviceData.successRate}</span>
                              </div>
                            )}
                            {serviceData.latency && (
                              <div className="flex justify-between">
                                <span className="text-gf-smoke">Latency:</span>
                                <span className="text-gf-snow">{serviceData.latency}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass-overlay border-gf-smoke/20">
                <CardHeader>
                  <CardTitle className="text-gf-snow flex items-center">
                    <Users className="h-5 w-5 mr-2 text-gf-pink" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gf-pink mb-2" data-testid="active-users-count">
                    {healthData?.websocket?.connections || 0}
                  </div>
                  <p className="text-gf-smoke text-sm">Currently online</p>
                </CardContent>
              </Card>

              <Card className="glass-overlay border-gf-smoke/20">
                <CardHeader>
                  <CardTitle className="text-gf-snow flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-gf-violet" />
                    Moderation Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gf-violet mb-2" data-testid="moderation-pending-count">
                    {healthData?.moderation?.pending || 0}
                  </div>
                  <p className="text-gf-smoke text-sm">Pending review</p>
                </CardContent>
              </Card>

              <Card className="glass-overlay border-gf-smoke/20">
                <CardHeader>
                  <CardTitle className="text-gf-snow flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-gf-cyan" />
                    System Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gf-cyan mb-2" data-testid="system-uptime">
                    {healthData?.uptime ? Math.floor(healthData.uptime / 3600) : 0}h
                  </div>
                  <p className="text-gf-smoke text-sm">Current session</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent System Events */}
            <Card className="glass-overlay border-gf-smoke/20">
              <CardHeader>
                <CardTitle className="text-gf-snow">Recent System Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Mock recent events - in real implementation this would come from audit logs */}
                  <div className="flex items-center space-x-4 py-2 border-b border-gf-smoke/10 last:border-b-0">
                    <div className="w-2 h-2 bg-success rounded-full" />
                    <span className="text-xs text-gf-smoke">
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-gf-snow">System health check completed successfully</span>
                    <Badge className="bg-gf-violet text-xs px-2 py-1 ml-auto">INFO</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 py-2 border-b border-gf-smoke/10 last:border-b-0">
                    <div className="w-2 h-2 bg-gf-cyan rounded-full" />
                    <span className="text-xs text-gf-smoke">
                      {new Date(Date.now() - 60000).toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-gf-snow">WebSocket connection established</span>
                    <Badge className="bg-gf-cyan text-xs px-2 py-1 ml-auto">SYSTEM</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 py-2 border-b border-gf-smoke/10 last:border-b-0">
                    <div className="w-2 h-2 bg-warning rounded-full" />
                    <span className="text-xs text-gf-smoke">
                      {new Date(Date.now() - 120000).toLocaleTimeString()}
                    </span>
                    <span className="text-sm text-gf-snow">Payment gateway maintenance mode activated</span>
                    <Badge className="bg-warning text-xs px-2 py-1 ml-auto">WARN</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
