/**
 * 🛡️ Security Dashboard - Real-time Threat Monitoring & Management
 * Enterprise security operations center with live threat visualization
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Interfaces
interface ThreatData {
  id: string;
  type: 'ddos' | 'sql_injection' | 'xss' | 'csrf' | 'brute_force' | 'anomaly' | 'malware' | 'bot';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  timestamp: string;
  risk_score: number;
  status: 'detected' | 'mitigated' | 'blocked' | 'monitoring';
  geo_location?: {
    country: string;
    region: string;
    city: string;
  };
}

interface SecurityMetrics {
  threats_detected: number;
  threats_blocked: number;
  requests_analyzed: number;
  response_time_ms: number;
  uptime_percentage: number;
  bandwidth_saved_mb: number;
  active_blocks: number;
}

interface WAFRule {
  id: string;
  name: string;
  enabled: boolean;
  hits: number;
  last_triggered: string;
  severity: string;
}

const SecurityDashboard: React.FC = () => {
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threats_detected: 0,
    threats_blocked: 0,
    requests_analyzed: 0,
    response_time_ms: 0,
    uptime_percentage: 99.99,
    bandwidth_saved_mb: 0,
    active_blocks: 0
  });
  const [wafRules, setWafRules] = useState<WAFRule[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertLevel, setAlertLevel] = useState<'normal' | 'elevated' | 'high' | 'critical'>('normal');

  const wsRef = useRef<WebSocket | null>(null);
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);

  // Colors for charts
  const COLORS = {
    primary: '#00d4ff',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    purple: '#9c27b0'
  };

  const THREAT_COLORS = {
    ddos: '#f44336',
    sql_injection: '#e91e63',
    xss: '#9c27b0',
    csrf: '#673ab7',
    brute_force: '#3f51b5',
    anomaly: '#2196f3',
    malware: '#ff5722',
    bot: '#795548'
  };

  useEffect(() => {
    initializeDashboard();
    setupWebSocket();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoRefresh, timeRange]);

  const initializeDashboard = async () => {
    await fetchSecurityData();
    generateMockData(); // In production, remove this
  };

  const setupWebSocket = () => {
    try {
      wsRef.current = new WebSocket('ws://localhost:3001/security-feed');
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealTimeUpdate(data);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const fetchSecurityData = async () => {
    try {
      // In production, fetch from actual API
      // const response = await fetch(`/api/security/dashboard?range=${timeRange}`);
      // const data = await response.json();
      
      // Mock data for demonstration
      const mockMetrics: SecurityMetrics = {
        threats_detected: Math.floor(Math.random() * 1000) + 500,
        threats_blocked: Math.floor(Math.random() * 800) + 400,
        requests_analyzed: Math.floor(Math.random() * 100000) + 50000,
        response_time_ms: Math.random() * 5 + 1,
        uptime_percentage: 99.99,
        bandwidth_saved_mb: Math.floor(Math.random() * 5000) + 2000,
        active_blocks: Math.floor(Math.random() * 50) + 10
      };

      setMetrics(mockMetrics);
      updateAlertLevel(mockMetrics);

    } catch (error) {
      console.error('Failed to fetch security data:', error);
    }
  };

  const generateMockData = () => {
    // Generate mock threat data
    const mockThreats: ThreatData[] = Array.from({ length: 100 }, (_, index) => {
      const threatTypes = ['ddos', 'sql_injection', 'xss', 'csrf', 'brute_force', 'anomaly', 'malware', 'bot'] as const;
      const severities = ['low', 'medium', 'high', 'critical'] as const;
      const statuses = ['detected', 'mitigated', 'blocked', 'monitoring'] as const;
      
      return {
        id: `threat-${index}`,
        type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        source_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        risk_score: Math.floor(Math.random() * 100),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        geo_location: {
          country: ['US', 'CN', 'RU', 'BR', 'IN', 'DE', 'JP', 'UK'][Math.floor(Math.random() * 8)],
          region: 'Mock Region',
          city: 'Mock City'
        }
      };
    });

    setThreats(mockThreats);

    // Generate mock WAF rules
    const mockWAFRules: WAFRule[] = [
      { id: '1', name: 'SQL Injection Detection', enabled: true, hits: 245, last_triggered: '2 minutes ago', severity: 'high' },
      { id: '2', name: 'XSS Protection', enabled: true, hits: 123, last_triggered: '15 minutes ago', severity: 'high' },
      { id: '3', name: 'DDoS Mitigation', enabled: true, hits: 67, last_triggered: '1 hour ago', severity: 'critical' },
      { id: '4', name: 'Bot Detection', enabled: true, hits: 892, last_triggered: '30 seconds ago', severity: 'medium' },
      { id: '5', name: 'Brute Force Protection', enabled: true, hits: 45, last_triggered: '5 minutes ago', severity: 'medium' }
    ];

    setWafRules(mockWAFRules);
  };

  const handleRealTimeUpdate = (data: any) => {
    if (data.type === 'threat') {
      setThreats(prev => [data.threat, ...prev.slice(0, 99)]);
      playAlertSound(data.threat.severity);
    } else if (data.type === 'metrics') {
      setMetrics(data.metrics);
      updateAlertLevel(data.metrics);
    }
  };

  const updateAlertLevel = (currentMetrics: SecurityMetrics) => {
    const threatRate = currentMetrics.threats_detected / currentMetrics.requests_analyzed * 100;
    
    if (threatRate > 10) {
      setAlertLevel('critical');
    } else if (threatRate > 5) {
      setAlertLevel('high');
    } else if (threatRate > 1) {
      setAlertLevel('elevated');
    } else {
      setAlertLevel('normal');
    }
  };

  const playAlertSound = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      // In production, play appropriate alert sound
      console.log(`🔊 Alert sound for ${severity} threat`);
    }
  };

  // Chart data processing
  const threatTimeSeriesData = useMemo(() => {
    const now = Date.now();
    const timeWindows = [];
    const windowSize = timeRange === '1h' ? 300000 : timeRange === '24h' ? 3600000 : 86400000; // 5min, 1hr, 1day
    const numWindows = timeRange === '1h' ? 12 : timeRange === '24h' ? 24 : 30;

    for (let i = numWindows - 1; i >= 0; i--) {
      const windowStart = now - (i + 1) * windowSize;
      const windowEnd = now - i * windowSize;
      
      const windowThreats = threats.filter(threat => {
        const threatTime = new Date(threat.timestamp).getTime();
        return threatTime >= windowStart && threatTime < windowEnd;
      });

      timeWindows.push({
        time: new Date(windowEnd).toLocaleTimeString(),
        threats: windowThreats.length,
        blocked: windowThreats.filter(t => t.status === 'blocked').length,
        mitigated: windowThreats.filter(t => t.status === 'mitigated').length
      });
    }

    return timeWindows;
  }, [threats, timeRange]);

  const threatTypeDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {};
    
    threats.forEach(threat => {
      distribution[threat.type] = (distribution[threat.type] || 0) + 1;
    });

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count,
      color: THREAT_COLORS[type as keyof typeof THREAT_COLORS] || '#666'
    }));
  }, [threats]);

  const severityDistribution = useMemo(() => {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    
    threats.forEach(threat => {
      distribution[threat.severity]++;
    });

    return [
      { name: 'Low', value: distribution.low, color: COLORS.success },
      { name: 'Medium', value: distribution.medium, color: COLORS.warning },
      { name: 'High', value: distribution.high, color: COLORS.error },
      { name: 'Critical', value: distribution.critical, color: '#8b0000' }
    ];
  }, [threats]);

  const topCountries = useMemo(() => {
    const countryCount: { [key: string]: number } = {};
    
    threats.forEach(threat => {
      if (threat.geo_location?.country) {
        countryCount[threat.geo_location.country] = (countryCount[threat.geo_location.country] || 0) + 1;
      }
    });

    return Object.entries(countryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  }, [threats]);

  const getAlertLevelColor = () => {
    switch (alertLevel) {
      case 'critical': return '#8b0000';
      case 'high': return '#f44336';
      case 'elevated': return '#ff9800';
      default: return '#4caf50';
    }
  };

  return (
    <div className="security-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>🛡️ Security Operations Center</h1>
          <div className={`alert-level alert-${alertLevel}`}>
            <span className="alert-indicator" style={{ backgroundColor: getAlertLevelColor() }}></span>
            Alert Level: {alertLevel.toUpperCase()}
          </div>
        </div>
        
        <div className="dashboard-controls">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh
          </label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">🚨</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.threats_detected.toLocaleString()}</div>
            <div className="metric-label">Threats Detected</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🛡️</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.threats_blocked.toLocaleString()}</div>
            <div className="metric-label">Threats Blocked</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.requests_analyzed.toLocaleString()}</div>
            <div className="metric-label">Requests Analyzed</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.response_time_ms.toFixed(2)}ms</div>
            <div className="metric-label">Response Time</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.uptime_percentage}%</div>
            <div className="metric-label">Uptime</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💾</div>
          <div className="metric-content">
            <div className="metric-value">{(metrics.bandwidth_saved_mb / 1024).toFixed(1)}GB</div>
            <div className="metric-label">Bandwidth Saved</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Threat Timeline */}
        <div className="chart-container">
          <h3>🕐 Threat Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={threatTimeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="threats" stackId="1" stroke={COLORS.error} fill={COLORS.error} />
              <Area type="monotone" dataKey="blocked" stackId="1" stroke={COLORS.success} fill={COLORS.success} />
              <Area type="monotone" dataKey="mitigated" stackId="1" stroke={COLORS.warning} fill={COLORS.warning} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Threat Types */}
        <div className="chart-container">
          <h3>🎯 Threat Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={threatTypeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                {threatTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="chart-container">
          <h3>⚠️ Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityDistribution} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS.primary}>
                {severityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="chart-container">
          <h3>🌍 Top Threat Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCountries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.info} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* WAF Rules Status */}
      <div className="waf-rules-section">
        <h3>🛡️ WAF Rules Status</h3>
        <div className="waf-rules-table">
          <table>
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Status</th>
                <th>Hits</th>
                <th>Last Triggered</th>
                <th>Severity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wafRules.map(rule => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>
                    <span className={`status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                      {rule.enabled ? '✅ Enabled' : '❌ Disabled'}
                    </span>
                  </td>
                  <td>{rule.hits.toLocaleString()}</td>
                  <td>{rule.last_triggered}</td>
                  <td>
                    <span className={`severity ${rule.severity}`}>
                      {rule.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary">Edit</button>
                    <button className="btn-danger">Disable</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Threats */}
      <div className="recent-threats-section">
        <h3>🚨 Recent Threats</h3>
        <div className="threats-table">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Source IP</th>
                <th>Severity</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {threats.slice(0, 20).map(threat => (
                <tr key={threat.id}>
                  <td>{new Date(threat.timestamp).toLocaleTimeString()}</td>
                  <td>
                    <span className={`threat-type ${threat.type}`}>
                      {threat.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <code>{threat.source_ip}</code>
                    {threat.geo_location && (
                      <span className="geo-info">({threat.geo_location.country})</span>
                    )}
                  </td>
                  <td>
                    <span className={`severity ${threat.severity}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>{threat.risk_score}</td>
                  <td>
                    <span className={`status ${threat.status}`}>
                      {threat.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="btn-primary">Block IP</button>
                    <button className="btn-secondary">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .security-dashboard {
          padding: 20px;
          background: #0a0e1a;
          color: #ffffff;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background: #1a1f2e;
          border-radius: 10px;
          border-left: 4px solid #00d4ff;
        }

        .header-info h1 {
          margin: 0;
          color: #00d4ff;
          font-size: 2rem;
        }

        .alert-level {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          font-weight: bold;
        }

        .alert-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .dashboard-controls {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .dashboard-controls select {
          padding: 8px 12px;
          background: #2a3142;
          border: 1px solid #3a4556;
          color: #ffffff;
          border-radius: 5px;
        }

        .auto-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ccd6f6;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: #1a1f2e;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #2a3142;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .metric-icon {
          font-size: 2rem;
        }

        .metric-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: #00d4ff;
          margin-bottom: 5px;
        }

        .metric-label {
          color: #8892b0;
          font-size: 0.9rem;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .chart-container {
          background: #1a1f2e;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #2a3142;
        }

        .chart-container h3 {
          margin: 0 0 20px 0;
          color: #ccd6f6;
        }

        .waf-rules-section, .recent-threats-section {
          background: #1a1f2e;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #2a3142;
          margin-bottom: 20px;
        }

        .waf-rules-section h3, .recent-threats-section h3 {
          margin: 0 0 20px 0;
          color: #ccd6f6;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #2a3142;
        }

        th {
          background: #0f1419;
          color: #00d4ff;
          font-weight: bold;
        }

        .status.enabled { color: #4caf50; }
        .status.disabled { color: #f44336; }

        .severity.low { color: #4caf50; background: #1b5e20; padding: 4px 8px; border-radius: 4px; }
        .severity.medium { color: #ff9800; background: #e65100; padding: 4px 8px; border-radius: 4px; }
        .severity.high { color: #f44336; background: #b71c1c; padding: 4px 8px; border-radius: 4px; }
        .severity.critical { color: #ffffff; background: #8b0000; padding: 4px 8px; border-radius: 4px; }

        .threat-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .threat-type.ddos { background: #f44336; color: white; }
        .threat-type.sql_injection { background: #e91e63; color: white; }
        .threat-type.xss { background: #9c27b0; color: white; }
        .threat-type.bot { background: #795548; color: white; }

        .btn-primary {
          background: #00d4ff;
          color: #0a0e1a;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .geo-info {
          color: #8892b0;
          font-size: 0.8rem;
          margin-left: 8px;
        }

        code {
          background: #0f1419;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Monaco', 'Menlo', monospace;
        }
      `}</style>
    </div>
  );
};

export default SecurityDashboard;