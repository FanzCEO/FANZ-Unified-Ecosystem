import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SecurityMetrics {
  timestamp: string;
  authAttempts: {
    successful: number;
    failed: number;
    blocked: number;
  };
  rateLimiting: {
    blocked: number;
    allowed: number;
  };
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  threats: {
    sql_injection: number;
    xss_attempts: number;
    csrf_attempts: number;
    brute_force: number;
  };
  performance: {
    response_time: number;
    error_rate: number;
    uptime: number;
  };
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  resolved: boolean;
  service: string;
}

const SecurityMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<SecurityMetrics | null>(null);
  const [isLive, setIsLive] = useState(true);

  // Mock data generation (replace with real API calls)
  const generateMockMetrics = (): SecurityMetrics => {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      authAttempts: {
        successful: Math.floor(Math.random() * 100) + 50,
        failed: Math.floor(Math.random() * 20),
        blocked: Math.floor(Math.random() * 5),
      },
      rateLimiting: {
        blocked: Math.floor(Math.random() * 10),
        allowed: Math.floor(Math.random() * 1000) + 500,
      },
      vulnerabilities: {
        critical: Math.floor(Math.random() * 2),
        high: Math.floor(Math.random() * 5),
        medium: Math.floor(Math.random() * 10),
        low: Math.floor(Math.random() * 15),
      },
      threats: {
        sql_injection: Math.floor(Math.random() * 3),
        xss_attempts: Math.floor(Math.random() * 5),
        csrf_attempts: Math.floor(Math.random() * 2),
        brute_force: Math.floor(Math.random() * 8),
      },
      performance: {
        response_time: Math.floor(Math.random() * 200) + 50,
        error_rate: Math.random() * 5,
        uptime: 99 + Math.random(),
      },
    };
  };

  const generateMockAlerts = (): SecurityAlert[] => {
    const alertTypes: SecurityAlert['type'][] = ['critical', 'high', 'medium', 'low'];
    const services = ['fanz-auth', 'fanz-ai-integration', 'api-gateway', 'frontend'];
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `alert-${i}`,
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      message: [
        'Multiple failed login attempts detected',
        'Unusual API access pattern detected', 
        'High rate of 401 errors from IP',
        'Potential SQL injection attempt blocked',
        'DDoS attack mitigated successfully',
      ][Math.floor(Math.random() * 5)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      resolved: Math.random() > 0.3,
      service: services[Math.floor(Math.random() * services.length)],
    }));
  };

  // Update metrics periodically
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newMetric = generateMockMetrics();
      setCurrentMetrics(newMetric);
      
      setMetrics(prev => {
        const updated = [...prev, newMetric];
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Generate alerts periodically
  useEffect(() => {
    setAlerts(generateMockAlerts());
    const alertInterval = setInterval(() => {
      setAlerts(generateMockAlerts());
    }, 30000);

    return () => clearInterval(alertInterval);
  }, []);

  const getAlertColor = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF5722';
      case 'medium': return '#FF9800';
      case 'low': return '#FFC107';
      default: return '#9E9E9E';
    }
  };

  const getThreatData = () => {
    if (!currentMetrics) return [];
    return [
      { name: 'SQL Injection', value: currentMetrics.threats.sql_injection, fill: '#FF5722' },
      { name: 'XSS Attempts', value: currentMetrics.threats.xss_attempts, fill: '#FF9800' },
      { name: 'CSRF Attempts', value: currentMetrics.threats.csrf_attempts, fill: '#FFC107' },
      { name: 'Brute Force', value: currentMetrics.threats.brute_force, fill: '#F44336' },
    ];
  };

  const getVulnerabilityData = () => {
    if (!currentMetrics) return [];
    return [
      { name: 'Critical', value: currentMetrics.vulnerabilities.critical, fill: '#D32F2F' },
      { name: 'High', value: currentMetrics.vulnerabilities.high, fill: '#F57C00' },
      { name: 'Medium', value: currentMetrics.vulnerabilities.medium, fill: '#FBC02D' },
      { name: 'Low', value: currentMetrics.vulnerabilities.low, fill: '#689F38' },
    ];
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            🔒 FANZ Security Monitoring Dashboard
          </h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isLive 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isLive ? '🔴 Live' : '⏸️ Paused'}
            </button>
            <div className="text-sm text-gray-300">
              Last updated: {currentMetrics ? new Date(currentMetrics.timestamp).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {alerts.filter(alert => alert.type === 'critical' && !alert.resolved).length > 0 && (
          <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-lg">
            <h3 className="font-semibold mb-2">🚨 Critical Security Alerts</h3>
            {alerts.filter(alert => alert.type === 'critical' && !alert.resolved).map(alert => (
              <div key={alert.id} className="text-sm text-red-300 mb-1">
                <span className="font-medium">[{alert.service}]</span> {alert.message}
                <span className="text-xs text-red-400 ml-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Security Metrics Overview */}
        {currentMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Successful Logins</h3>
              <div className="text-2xl font-bold text-green-400">
                {currentMetrics.authAttempts.successful}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Failed Logins</h3>
              <div className="text-2xl font-bold text-red-400">
                {currentMetrics.authAttempts.failed}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Blocked Attempts</h3>
              <div className="text-2xl font-bold text-orange-400">
                {currentMetrics.authAttempts.blocked}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Response Time</h3>
              <div className="text-2xl font-bold text-blue-400">
                {currentMetrics.performance.response_time}ms
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Error Rate</h3>
              <div className="text-2xl font-bold text-yellow-400">
                {currentMetrics.performance.error_rate.toFixed(2)}%
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Uptime</h3>
              <div className="text-2xl font-bold text-green-400">
                {currentMetrics.performance.uptime.toFixed(3)}%
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Authentication Over Time */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Authentication Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(time) => new Date(time).toLocaleString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="authAttempts.successful" 
                  stroke="#16D19A" 
                  name="Successful"
                />
                <Line 
                  type="monotone" 
                  dataKey="authAttempts.failed" 
                  stroke="#FF5757" 
                  name="Failed"
                />
                <Line 
                  type="monotone" 
                  dataKey="authAttempts.blocked" 
                  stroke="#FF9800" 
                  name="Blocked"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Threat Distribution */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Current Threat Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getThreatData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getThreatData().map((entry, index) => (
                    <Cell key={`threat-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Vulnerabilities */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Vulnerability Severity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getVulnerabilityData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {getVulnerabilityData().map((entry, index) => (
                    <Cell key={`vuln-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rate Limiting */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Rate Limiting Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rateLimiting.allowed" 
                  stroke="#16D19A" 
                  name="Allowed"
                />
                <Line 
                  type="monotone" 
                  dataKey="rateLimiting.blocked" 
                  stroke="#FF5757" 
                  name="Blocked"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security Alerts Table */}
        <div className="bg-gray-800 rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Security Alerts</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4">Severity</th>
                    <th className="text-left py-2 px-4">Service</th>
                    <th className="text-left py-2 px-4">Message</th>
                    <th className="text-left py-2 px-4">Time</th>
                    <th className="text-left py-2 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(alert => (
                    <tr key={alert.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4">
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ backgroundColor: getAlertColor(alert.type), color: 'white' }}
                        >
                          {alert.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {alert.service}
                      </td>
                      <td className="py-3 px-4">
                        {alert.message}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          alert.resolved 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMonitoringDashboard;