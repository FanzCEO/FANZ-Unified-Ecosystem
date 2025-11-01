import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AIMetrics {
  timestamp: string;
  requests_per_minute: number;
  response_time: number;
  success_rate: number;
  error_rate: number;
  cache_hit_rate: number;
  active_users: number;
  sentiment_analysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  content_optimization_score: number;
  deepfake_detections: number;
  pricing_optimizations: number;
}

interface ServiceHealth {
  redis: 'connected' | 'disconnected';
  openai: 'configured' | 'not configured';
  anthropic: 'configured' | 'not configured';
  status: 'healthy' | 'unhealthy';
}

const AIPerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<AIMetrics | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Mock data generation for demo (replace with real API calls)
  const generateMockData = useCallback((): AIMetrics => {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      requests_per_minute: Math.floor(Math.random() * 100) + 50,
      response_time: Math.floor(Math.random() * 500) + 100,
      success_rate: 95 + Math.random() * 5,
      error_rate: Math.random() * 5,
      cache_hit_rate: 70 + Math.random() * 25,
      active_users: Math.floor(Math.random() * 1000) + 500,
      sentiment_analysis: {
        positive: Math.floor(Math.random() * 40) + 40,
        negative: Math.floor(Math.random() * 20) + 10,
        neutral: Math.floor(Math.random() * 30) + 30,
      },
      content_optimization_score: 75 + Math.random() * 20,
      deepfake_detections: Math.floor(Math.random() * 10),
      pricing_optimizations: Math.floor(Math.random() * 50) + 20,
    };
  }, []);

  // Fetch service health
  const fetchServiceHealth = useCallback(async () => {
    try {
      const response = await fetch('/health');
      const data = await response.json();
      setServiceHealth(data.services);
      
      // Check for alerts
      const newAlerts = [];
      if (data.services.redis !== 'connected') {
        newAlerts.push('Redis connection lost - caching disabled');
      }
      if (data.services.openai !== 'configured') {
        newAlerts.push('OpenAI API key not configured');
      }
      if (data.services.anthropic !== 'configured') {
        newAlerts.push('Anthropic API key not configured');
      }
      setAlerts(newAlerts);
    } catch (error) {
      console.error('Failed to fetch service health:', error);
      setServiceHealth({
        redis: 'disconnected',
        openai: 'not configured',
        anthropic: 'not configured',
        status: 'unhealthy'
      });
    }
  }, []);

  // Update metrics
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newMetric = generateMockData();
      setCurrentMetrics(newMetric);
      
      setMetrics(prev => {
        const updated = [...prev, newMetric];
        // Keep only last 50 data points
        return updated.length > 50 ? updated.slice(-50) : updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, generateMockData]);

  // Fetch health every 30 seconds
  useEffect(() => {
    fetchServiceHealth();
    const healthInterval = setInterval(fetchServiceHealth, 30000);
    return () => clearInterval(healthInterval);
  }, [fetchServiceHealth]);

  const sentimentData = currentMetrics ? [
    { name: 'Positive', value: currentMetrics.sentiment_analysis.positive, fill: '#16D19A' },
    { name: 'Negative', value: currentMetrics.sentiment_analysis.negative, fill: '#FF5757' },
    { name: 'Neutral', value: currentMetrics.sentiment_analysis.neutral, fill: '#FFB020' }
  ] : [];

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
      case 'healthy':
        return '#16D19A';
      case 'disconnected':
      case 'not configured':
      case 'unhealthy':
        return '#FF5757';
      default:
        return '#FFB020';
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            🤖 FANZ AI Performance Dashboard
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

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-lg">
            <h3 className="font-semibold mb-2">⚠️ System Alerts</h3>
            {alerts.map((alert, index) => (
              <div key={index} className="text-sm text-red-300">• {alert}</div>
            ))}
          </div>
        )}

        {/* Service Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">System Status</h3>
            <div 
              className="text-2xl font-bold"
              style={{ color: getHealthColor(serviceHealth?.status || 'unknown') }}
            >
              {serviceHealth?.status || 'unknown'}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Redis Cache</h3>
            <div 
              className="text-2xl font-bold"
              style={{ color: getHealthColor(serviceHealth?.redis || 'unknown') }}
            >
              {serviceHealth?.redis || 'unknown'}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">OpenAI</h3>
            <div 
              className="text-2xl font-bold"
              style={{ color: getHealthColor(serviceHealth?.openai || 'unknown') }}
            >
              {serviceHealth?.openai || 'unknown'}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Anthropic</h3>
            <div 
              className="text-2xl font-bold"
              style={{ color: getHealthColor(serviceHealth?.anthropic || 'unknown') }}
            >
              {serviceHealth?.anthropic || 'unknown'}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {currentMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Requests/Min</h3>
              <div className="text-2xl font-bold text-blue-400">
                {currentMetrics.requests_per_minute}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Response Time</h3>
              <div className="text-2xl font-bold text-green-400">
                {currentMetrics.response_time}ms
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Success Rate</h3>
              <div className="text-2xl font-bold text-green-400">
                {currentMetrics.success_rate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Cache Hit</h3>
              <div className="text-2xl font-bold text-yellow-400">
                {currentMetrics.cache_hit_rate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Active Users</h3>
              <div className="text-2xl font-bold text-purple-400">
                {currentMetrics.active_users.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Deepfakes</h3>
              <div className="text-2xl font-bold text-red-400">
                {currentMetrics.deepfake_detections}
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Over Time */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <LineChart width={500} height={300} data={metrics}>
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
                dataKey="response_time" 
                stroke="#8884d8" 
                name="Response Time (ms)"
              />
              <Line 
                type="monotone" 
                dataKey="requests_per_minute" 
                stroke="#82ca9d" 
                name="Requests/Min"
              />
            </LineChart>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Current Sentiment Analysis</h3>
            <PieChart width={500} height={300}>
              <Pie
                data={sentimentData}
                cx={250}
                cy={150}
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>

          {/* AI Service Usage */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">AI Service Usage</h3>
            <BarChart width={500} height={300} data={metrics.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="pricing_optimizations" fill="#8884d8" name="Pricing Optimizations" />
              <Bar dataKey="deepfake_detections" fill="#82ca9d" name="Deepfake Detections" />
            </BarChart>
          </div>

          {/* Success vs Error Rate */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Success vs Error Rate</h3>
            <LineChart width={500} height={300} data={metrics}>
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
                dataKey="success_rate" 
                stroke="#16D19A" 
                name="Success Rate (%)"
              />
              <Line 
                type="monotone" 
                dataKey="error_rate" 
                stroke="#FF5757" 
                name="Error Rate (%)"
              />
            </LineChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPerformanceDashboard;