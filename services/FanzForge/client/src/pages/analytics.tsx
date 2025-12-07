import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalyticsData {
  id: string;
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const analyticsData: AnalyticsData[] = [
  {
    id: 'total-projects',
    title: 'Total Projects',
    value: '1,247',
    change: '+12.5%',
    icon: 'fas fa-project-diagram',
    color: 'text-blue-400',
    trend: 'up'
  },
  {
    id: 'active-users',
    title: 'Active Users',
    value: '8,459',
    change: '+8.2%',
    icon: 'fas fa-users',
    color: 'text-green-400',
    trend: 'up'
  },
  {
    id: 'revenue',
    title: 'Monthly Revenue',
    value: '$24,890',
    change: '+18.7%',
    icon: 'fas fa-dollar-sign',
    color: 'text-yellow-400',
    trend: 'up'
  },
  {
    id: 'deployments',
    title: 'Deployments',
    value: '3,628',
    change: '+5.3%',
    icon: 'fas fa-rocket',
    color: 'text-purple-400',
    trend: 'up'
  },
  {
    id: 'api-calls',
    title: 'API Calls',
    value: '2.4M',
    change: '+22.1%',
    icon: 'fas fa-code',
    color: 'text-pink-400',
    trend: 'up'
  },
  {
    id: 'storage-used',
    title: 'Storage Used',
    value: '847 GB',
    change: '+15.4%',
    icon: 'fas fa-database',
    color: 'text-cyan-400',
    trend: 'up'
  },
  {
    id: 'error-rate',
    title: 'Error Rate',
    value: '0.23%',
    change: '-0.8%',
    icon: 'fas fa-exclamation-triangle',
    color: 'text-red-400',
    trend: 'down'
  },
  {
    id: 'avg-response',
    title: 'Avg Response Time',
    value: '142ms',
    change: '-12.3%',
    icon: 'fas fa-clock',
    color: 'text-orange-400',
    trend: 'down'
  }
];

const templateUsageData: ChartData[] = [
  { name: 'Adult Platforms', value: 35, color: '#ec4899' },
  { name: 'Creator Tools', value: 28, color: '#3b82f6' },
  { name: 'E-commerce', value: 18, color: '#10b981' },
  { name: 'Analytics', value: 12, color: '#f59e0b' },
  { name: 'Admin Panels', value: 7, color: '#8b5cf6' }
];

const revenueData = [
  { month: 'Jan', revenue: 18420, users: 1240 },
  { month: 'Feb', revenue: 21350, users: 1480 },
  { month: 'Mar', revenue: 19800, users: 1360 },
  { month: 'Apr', revenue: 23100, users: 1650 },
  { month: 'May', revenue: 26750, users: 1890 },
  { month: 'Jun', revenue: 24890, users: 1720 }
];

const topProjects = [
  { id: '1', name: 'AdultTube Pro', template: 'Adult Tube Platform', users: 12450, revenue: '$8,920', status: 'active' },
  { id: '2', name: 'CreatorHub', template: 'Creator Paywall + DM', users: 8760, revenue: '$6,340', status: 'active' },
  { id: '3', name: 'CamSite Elite', template: 'Cam Site Platform', users: 6890, revenue: '$4,780', status: 'active' },
  { id: '4', name: 'ContentMarket', template: 'Content Marketplace', users: 5620, revenue: '$3,890', status: 'active' },
  { id: '5', name: 'AnalyticsPro', template: 'Analytics Dashboard', users: 4350, revenue: '$2,950', status: 'active' }
];

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-4"
            data-testid="button-back"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Monitor your platform performance, user engagement, and revenue metrics.
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {['24h', '7d', '30d', '90d'].map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {analyticsData.map((metric, index) => (
                <motion.div
                  key={metric.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <motion.i 
                          className={`${metric.icon} text-2xl ${metric.color}`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        ></motion.i>
                        <Badge 
                          variant={metric.trend === 'up' ? 'default' : metric.trend === 'down' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          <i className={`fas fa-arrow-${metric.trend === 'up' ? 'up' : metric.trend === 'down' ? 'down' : 'right'} mr-1`}></i>
                          {metric.change}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-sm text-muted-foreground">{metric.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Template Usage Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Template Usage Distribution</CardTitle>
                    <CardDescription>Most popular template categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {templateUsageData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{item.value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Revenue Trend */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue and user growth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenueData.map((month, index) => (
                        <div key={month.month} className="flex items-center justify-between py-2">
                          <span className="text-sm font-medium">{month.month}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-green-400">${month.revenue.toLocaleString()}</span>
                            <span className="text-sm text-blue-400">{month.users} users</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Projects</CardTitle>
                  <CardDescription>Projects ranked by user engagement and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProjects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">{project.template}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-400">{project.revenue}</p>
                          <p className="text-sm text-muted-foreground">{project.users.toLocaleString()} users</p>
                        </div>
                        <Badge variant="secondary">{project.status}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Total Revenue</CardTitle>
                    <CardDescription>Last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-400 mb-2">$74,670</div>
                    <div className="flex items-center text-sm text-green-400">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +15.3% from last month
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Average Revenue Per User</CardTitle>
                    <CardDescription>Monthly ARPU</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-400 mb-2">$14.50</div>
                    <div className="flex items-center text-sm text-blue-400">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +8.7% from last month
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Revenue</CardTitle>
                    <CardDescription>Recurring monthly revenue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-400 mb-2">$58,920</div>
                    <div className="flex items-center text-sm text-purple-400">
                      <i className="fas fa-arrow-up mr-1"></i>
                      +12.4% from last month
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>System Performance</CardTitle>
                    <CardDescription>Real-time system metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>42%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>68%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Storage Usage</span>
                        <span>34%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '34%' }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>API Performance</CardTitle>
                    <CardDescription>Response times and success rates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Response Time</span>
                      <span className="text-green-400 font-medium">142ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-green-400 font-medium">99.77%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Requests (24h)</span>
                      <span className="text-blue-400 font-medium">847,259</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Error Rate</span>
                      <span className="text-red-400 font-medium">0.23%</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}