/**
 * FANZ Unified Ecosystem - FanzDash Tax Administration UI
 * 
 * Complete tax management and compliance interface for the FANZ security control center.
 * 
 * Modules:
 * - Dashboard: Liabilities, filings calendar, nexus status, alerts
 * - Jurisdictions & Registrations: Activation, filing frequency, account numbers
 * - Exemptions: Review queue, certificate store
 * - Rates & Rules: View-only with provider diffs and change history
 * - Reports: Export returns, GL tie-outs, exception logs
 * - Creator Info Reporting: W-9/W-8 status, 1099 runs, corrections
 * 
 * Security: Role-based access and approvals workflow for filings and remittances
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Badge,
  Alert,
  AlertDescription,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Textarea,
  Calendar,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Switch,
} from '@/components/ui';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface TaxLiability {
  id: string;
  jurisdiction: string;
  period: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'filed' | 'paid' | 'overdue';
  filingType: 'monthly' | 'quarterly' | 'annual';
}

interface NexusStatus {
  state: string;
  revenue: number;
  transactions: number;
  threshold: number;
  status: 'safe' | 'approaching' | 'exceeded';
  registrationStatus: 'not_registered' | 'pending' | 'active' | 'suspended';
}

interface ExemptionCertificate {
  id: string;
  userId: string;
  userName: string;
  state: string;
  certificateNumber: string;
  type: string;
  validFrom: Date;
  validTo: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  reviewedBy?: string;
  reviewedAt?: Date;
}

interface ProviderRate {
  jurisdiction: string;
  category: string;
  provider: string;
  rate: number;
  lastUpdated: Date;
  discrepancy?: boolean;
}

interface CreatorTaxProfile {
  id: string;
  creatorName: string;
  tinStatus: 'missing' | 'pending' | 'verified' | 'invalid';
  formType: 'W-9' | 'W-8BEN' | 'W-8BEN-E' | null;
  backupWithholding: boolean;
  ytdEarnings: number;
  needs1099: boolean;
  lastUpdated: Date;
}

// ============================================================================
// Main Tax Admin Dashboard Component
// ============================================================================

export function TaxAdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'viewer'>('admin');
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tax Administration Center</h1>
          <p className="text-gray-600">FANZ Unified Ecosystem Tax Compliance Management</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
            {userRole.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Data
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
          <TabsTrigger value="exemptions">Exemptions</TabsTrigger>
          <TabsTrigger value="rates">Rates & Rules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="creators">Creator 1099s</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <DashboardOverview userRole={userRole} />
        </TabsContent>

        {/* Jurisdictions Tab */}
        <TabsContent value="jurisdictions">
          <JurisdictionsManagement userRole={userRole} />
        </TabsContent>

        {/* Exemptions Tab */}
        <TabsContent value="exemptions">
          <ExemptionsManagement userRole={userRole} />
        </TabsContent>

        {/* Rates & Rules Tab */}
        <TabsContent value="rates">
          <RatesAndRulesView userRole={userRole} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <ReportsCenter userRole={userRole} />
        </TabsContent>

        {/* Creator 1099s Tab */}
        <TabsContent value="creators">
          <Creator1099Management userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Dashboard Overview Component
// ============================================================================

function DashboardOverview({ userRole }: { userRole: string }) {
  const [liabilities, setLiabilities] = useState<TaxLiability[]>([]);
  const [nexusStatus, setNexusStatus] = useState<NexusStatus[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setLiabilities([
      {
        id: '1',
        jurisdiction: 'California',
        period: '2024-Q3',
        amount: 15420.50,
        dueDate: new Date('2024-10-20'),
        status: 'pending',
        filingType: 'quarterly'
      },
      {
        id: '2',
        jurisdiction: 'New York',
        period: '2024-09',
        amount: 8730.25,
        dueDate: new Date('2024-10-20'),
        status: 'filed',
        filingType: 'monthly'
      }
    ]);

    setNexusStatus([
      {
        state: 'Texas',
        revenue: 485000,
        transactions: 2450,
        threshold: 500000,
        status: 'approaching',
        registrationStatus: 'not_registered'
      },
      {
        state: 'Florida',
        revenue: 125000,
        transactions: 890,
        threshold: 100000,
        status: 'exceeded',
        registrationStatus: 'pending'
      }
    ]);

    setAlerts([
      {
        id: '1',
        type: 'warning',
        title: 'Texas Nexus Threshold Approaching',
        message: 'Revenue is at 97% of economic nexus threshold',
        dueDate: new Date('2024-10-01')
      },
      {
        id: '2',
        type: 'error',
        title: 'Provider Rate Discrepancy',
        message: 'California rates differ between providers by 0.25%',
        dueDate: new Date()
      }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {alerts.length} tax compliance alerts requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${liabilities.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {liabilities.filter(l => l.status === 'pending').length} pending filings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Registrations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 pending approvals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nexus States</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nexusStatus.filter(n => n.status === 'exceeded').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {nexusStatus.filter(n => n.status === 'approaching').length} approaching
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">1099 Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">847</div>
            <p className="text-xs text-muted-foreground">
              2024 tax year ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filing Calendar & Nexus Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Filings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tax Filings</CardTitle>
            <CardDescription>Due dates and filing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liabilities.slice(0, 5).map((liability) => (
                <div key={liability.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{liability.jurisdiction}</div>
                    <div className="text-sm text-gray-500">
                      {liability.period} • {liability.filingType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${liability.amount.toLocaleString()}</div>
                    <div className="text-sm">
                      <Badge
                        variant={
                          liability.status === 'pending' ? 'destructive' :
                          liability.status === 'filed' ? 'default' : 'secondary'
                        }
                      >
                        {liability.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nexus Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle>Economic Nexus Status</CardTitle>
            <CardDescription>Revenue thresholds by state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nexusStatus.map((state) => (
                <div key={state.state} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{state.state}</div>
                    <Badge
                      variant={
                        state.status === 'safe' ? 'secondary' :
                        state.status === 'approaching' ? 'default' : 'destructive'
                      }
                    >
                      {state.status}
                    </Badge>
                  </div>
                  <Progress 
                    value={(state.revenue / state.threshold) * 100}
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>${state.revenue.toLocaleString()}</span>
                    <span>${state.threshold.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest tax system events and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm font-medium">California Q3 return filed successfully</div>
                <div className="text-xs text-gray-500">2 hours ago • Filed by system</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">Rate discrepancy detected for Provider A</div>
                <div className="text-xs text-gray-500">4 hours ago • Reconciliation needed</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm font-medium">Nightly provider sync completed</div>
                <div className="text-xs text-gray-500">6 hours ago • 2,450 rates updated</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Jurisdictions Management Component
// ============================================================================

function JurisdictionsManagement({ userRole }: { userRole: string }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');

  useEffect(() => {
    // Mock data
    setRegistrations([
      {
        id: '1',
        state: 'California',
        registrationNumber: 'CA-123456789',
        status: 'active',
        filingFrequency: 'quarterly',
        nextDueDate: new Date('2024-10-20'),
        registeredAt: new Date('2023-01-15')
      },
      {
        id: '2',
        state: 'New York',
        registrationNumber: 'NY-987654321',
        status: 'active',
        filingFrequency: 'monthly',
        nextDueDate: new Date('2024-10-20'),
        registeredAt: new Date('2023-02-10')
      },
      {
        id: '3',
        state: 'Texas',
        registrationNumber: null,
        status: 'not_registered',
        filingFrequency: null,
        nextDueDate: null,
        registeredAt: null
      }
    ]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Registration Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tax Registrations</h2>
          <p className="text-gray-600">Manage state tax registrations and filing frequencies</p>
        </div>
        {userRole === 'admin' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Register New State</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New State</DialogTitle>
                <DialogDescription>
                  Initiate tax registration for a new jurisdiction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Filing Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="w-full">Submit Registration Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Registrations Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Registration Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filing Frequency</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{reg.state}</TableCell>
                  <TableCell>{reg.registrationNumber || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reg.status === 'active' ? 'default' :
                        reg.status === 'pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {reg.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{reg.filingFrequency || 'N/A'}</TableCell>
                  <TableCell>
                    {reg.nextDueDate ? format(reg.nextDueDate, 'MMM dd, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {userRole === 'admin' && reg.status === 'not_registered' && (
                        <Button variant="default" size="sm">
                          Register
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Exemptions Management Component
// ============================================================================

function ExemptionsManagement({ userRole }: { userRole: string }) {
  const [certificates, setCertificates] = useState<ExemptionCertificate[]>([]);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    // Mock data
    setCertificates([
      {
        id: '1',
        userId: 'usr_123',
        userName: 'ABC Corporation',
        state: 'California',
        certificateNumber: 'CA-EX-123456',
        type: 'Resale',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2024-12-31'),
        status: 'pending',
      },
      {
        id: '2',
        userId: 'usr_456',
        userName: 'Nonprofit Foundation',
        state: 'New York',
        certificateNumber: 'NY-EX-789012',
        type: 'Non-profit',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2025-12-31'),
        status: 'approved',
        reviewedBy: 'admin@fanz.com',
        reviewedAt: new Date('2024-08-15')
      }
    ]);
  }, []);

  const filteredCertificates = certificates.filter(cert => 
    filter === 'all' || cert.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tax Exemption Certificates</h2>
          <p className="text-gray-600">Review and manage customer exemption certificates</p>
        </div>
        <div className="flex space-x-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="all">All Certificates</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Certificates Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Certificate Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.userName}</TableCell>
                  <TableCell>{cert.state}</TableCell>
                  <TableCell>{cert.certificateNumber}</TableCell>
                  <TableCell>{cert.type}</TableCell>
                  <TableCell>
                    {format(cert.validFrom, 'MMM dd, yyyy')} - {format(cert.validTo, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cert.status === 'approved' ? 'default' :
                        cert.status === 'pending' ? 'secondary' :
                        cert.status === 'rejected' ? 'destructive' : 'outline'
                      }
                    >
                      {cert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {userRole !== 'viewer' && cert.status === 'pending' && (
                        <>
                          <Button variant="default" size="sm">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="sm">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Rates and Rules View Component
// ============================================================================

function RatesAndRulesView({ userRole }: { userRole: string }) {
  const [providerRates, setProviderRates] = useState<ProviderRate[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [discrepanciesOnly, setDiscrepanciesOnly] = useState(false);

  useEffect(() => {
    // Mock data
    setProviderRates([
      {
        jurisdiction: 'California',
        category: 'Digital Goods',
        provider: 'Provider A',
        rate: 0.0875,
        lastUpdated: new Date('2024-09-15'),
        discrepancy: false
      },
      {
        jurisdiction: 'California',
        category: 'Digital Goods',
        provider: 'Provider B',
        rate: 0.0900,
        lastUpdated: new Date('2024-09-15'),
        discrepancy: true
      },
      {
        jurisdiction: 'New York',
        category: 'Subscriptions',
        provider: 'Provider A',
        rate: 0.08,
        lastUpdated: new Date('2024-09-16'),
        discrepancy: false
      }
    ]);
  }, []);

  const filteredRates = providerRates.filter(rate => {
    const matchesJurisdiction = !selectedJurisdiction || rate.jurisdiction === selectedJurisdiction;
    const matchesDiscrepancy = !discrepanciesOnly || rate.discrepancy;
    return matchesJurisdiction && matchesDiscrepancy;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tax Rates & Rules</h2>
          <p className="text-gray-600">View-only rates and rules with provider comparisons</p>
        </div>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={discrepanciesOnly} 
              onCheckedChange={setDiscrepanciesOnly}
            />
            <label className="text-sm">Discrepancies Only</label>
          </div>
          <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Jurisdictions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Jurisdictions</SelectItem>
              <SelectItem value="California">California</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="Texas">Texas</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Rates
          </Button>
        </div>
      </div>

      {/* Provider Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Provider A</CardTitle>
            <CardDescription>Commercial Tax Service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Healthy</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Last sync: 2 hours ago</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider B</CardTitle>
            <CardDescription>Alternative Service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm">Disabled</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Not configured</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internal Provider</CardTitle>
            <CardDescription>Curated Dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Active</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Fallback ready</div>
          </CardContent>
        </Card>
      </div>

      {/* Rates Comparison Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.map((rate, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rate.jurisdiction}</TableCell>
                  <TableCell>{rate.category}</TableCell>
                  <TableCell>{rate.provider}</TableCell>
                  <TableCell>{(rate.rate * 100).toFixed(3)}%</TableCell>
                  <TableCell>{format(rate.lastUpdated, 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    {rate.discrepancy ? (
                      <Badge variant="destructive">Discrepancy</Badge>
                    ) : (
                      <Badge variant="default">Synced</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Reports Center Component
// ============================================================================

function ReportsCenter({ userRole }: { userRole: string }) {
  const [reportType, setReportType] = useState<string>('liabilities');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    to: new Date()
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Tax Reports Center</h2>
        <p className="text-gray-600">Generate and export tax compliance reports</p>
      </div>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select report type and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="liabilities">Tax Liabilities Summary</SelectItem>
                <SelectItem value="filings">Filing Status Report</SelectItem>
                <SelectItem value="nexus">Nexus Monitoring</SelectItem>
                <SelectItem value="exemptions">Exemption Certificates</SelectItem>
                <SelectItem value="discrepancies">Provider Discrepancies</SelectItem>
                <SelectItem value="gl-tieout">GL Tie-Out Report</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'MMM dd, yyyy') : 'From Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'MMM dd, yyyy') : 'To Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex space-x-4">
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Generate Excel
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate PDF
            </Button>
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                name: 'Q3 2024 Tax Liabilities Summary',
                type: 'Excel',
                generatedAt: new Date('2024-09-15'),
                size: '145 KB'
              },
              {
                name: 'September 2024 Filing Status',
                type: 'PDF',
                generatedAt: new Date('2024-09-10'),
                size: '89 KB'
              },
              {
                name: 'Nexus Monitoring - August 2024',
                type: 'Excel',
                generatedAt: new Date('2024-09-01'),
                size: '67 KB'
              }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-gray-500">
                    {report.type} • {report.size} • {format(report.generatedAt, 'MMM dd, yyyy')}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Creator 1099 Management Component
// ============================================================================

function Creator1099Management({ userRole }: { userRole: string }) {
  const [creatorProfiles, setCreatorProfiles] = useState<CreatorTaxProfile[]>([]);
  const [selectedTaxYear, setSelectedTaxYear] = useState<string>('2024');
  const [filter, setFilter] = useState<string>('needs_1099');

  useEffect(() => {
    // Mock data
    setCreatorProfiles([
      {
        id: '1',
        creatorName: 'Creator One',
        tinStatus: 'verified',
        formType: 'W-9',
        backupWithholding: false,
        ytdEarnings: 25420.50,
        needs1099: true,
        lastUpdated: new Date('2024-09-01')
      },
      {
        id: '2',
        creatorName: 'Creator Two',
        tinStatus: 'pending',
        formType: 'W-9',
        backupWithholding: true,
        ytdEarnings: 8750.25,
        needs1099: true,
        lastUpdated: new Date('2024-08-15')
      },
      {
        id: '3',
        creatorName: 'International Creator',
        tinStatus: 'verified',
        formType: 'W-8BEN',
        backupWithholding: false,
        ytdEarnings: 15000.00,
        needs1099: false,
        lastUpdated: new Date('2024-09-10')
      }
    ]);
  }, []);

  const filteredProfiles = creatorProfiles.filter(profile => {
    switch (filter) {
      case 'needs_1099':
        return profile.needs1099;
      case 'missing_tin':
        return profile.tinStatus === 'missing';
      case 'backup_withholding':
        return profile.backupWithholding;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Creator 1099 Management</h2>
          <p className="text-gray-600">Manage creator tax profiles and information reporting</p>
        </div>
        <div className="flex space-x-4">
          <Select value={selectedTaxYear} onValueChange={setSelectedTaxYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          {userRole === 'admin' && (
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Generate All 1099s
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creatorProfiles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Need 1099</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creatorProfiles.filter(p => p.needs1099).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing TIN</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {creatorProfiles.filter(p => p.tinStatus === 'missing').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Backup Withholding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creatorProfiles.filter(p => p.backupWithholding).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All Creators
        </Button>
        <Button 
          variant={filter === 'needs_1099' ? 'default' : 'outline'}
          onClick={() => setFilter('needs_1099')}
        >
          Needs 1099
        </Button>
        <Button 
          variant={filter === 'missing_tin' ? 'default' : 'outline'}
          onClick={() => setFilter('missing_tin')}
        >
          Missing TIN
        </Button>
        <Button 
          variant={filter === 'backup_withholding' ? 'default' : 'outline'}
          onClick={() => setFilter('backup_withholding')}
        >
          Backup Withholding
        </Button>
      </div>

      {/* Creator Profiles Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Creator</TableHead>
                <TableHead>TIN Status</TableHead>
                <TableHead>Form Type</TableHead>
                <TableHead>YTD Earnings</TableHead>
                <TableHead>Backup Withholding</TableHead>
                <TableHead>1099 Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.creatorName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        profile.tinStatus === 'verified' ? 'default' :
                        profile.tinStatus === 'pending' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {profile.tinStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{profile.formType || 'N/A'}</TableCell>
                  <TableCell>${profile.ytdEarnings.toLocaleString()}</TableCell>
                  <TableCell>
                    {profile.backupWithholding ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.needs1099 ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="secondary">Not Required</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {userRole !== 'viewer' && (
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaxAdminDashboard;