import React from 'react';
import { useFanzAds } from '../providers/FanzAdProvider';
import { AdMetrics } from '../types';

export interface AdAnalyticsProps {
  showDetailed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AdAnalytics Component
 * Displays real-time ad performance metrics
 */
export const AdAnalytics: React.FC<AdAnalyticsProps> = ({
  showDetailed = false,
  className = '',
  style
}) => {
  const { metrics, errors, debug, enableAnalytics } = useFanzAds();

  if (!enableAnalytics && !debug) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const getMetricColor = (value: number, good: number, excellent: number): string => {
    if (value >= excellent) return '#10b981';
    if (value >= good) return '#f59e0b';
    return '#ef4444';
  };

  if (showDetailed) {
    return (
      <div
        className={`fanz-ad-analytics-detailed ${className}`}
        style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          ...style
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          Ad Performance
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {/* Impressions */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              {formatNumber(metrics.impressions)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>Impressions</div>
          </div>

          {/* Viewable Impressions */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              {formatNumber(metrics.viewableImpressions)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>Viewable</div>
          </div>

          {/* Clicks */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
              {formatNumber(metrics.clicks)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>Clicks</div>
          </div>

          {/* CTR */}
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: getMetricColor(metrics.ctr, 1, 2),
                marginBottom: '4px' 
              }}
            >
              {formatPercentage(metrics.ctr)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>CTR</div>
          </div>

          {/* Viewability Rate */}
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{ 
                fontSize: '20px', 
                fontFrequency: '700', 
                color: getMetricColor(metrics.viewabilityRate, 50, 70),
                marginBottom: '4px' 
              }}
            >
              {formatPercentage(metrics.viewabilityRate)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>Viewability</div>
          </div>

          {/* Revenue */}
          {metrics.revenue !== undefined && metrics.revenue > 0 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                ${metrics.revenue.toFixed(2)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>Revenue</div>
            </div>
          )}
        </div>

        {/* Error Count */}
        {errors.length > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626', marginBottom: '4px' }}>
              {errors.length} Error{errors.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b' }}>
              Recent: {errors[errors.length - 1]?.message}
            </div>
          </div>
        )}

        {debug && (
          <div style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
            Debug mode enabled • Real-time metrics
          </div>
        )}
      </div>
    );
  }

  // Simple view
  return (
    <div
      className={`fanz-ad-analytics-simple ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6b7280',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        ...style
      }}
    >
      <span>{formatNumber(metrics.impressions)} imp</span>
      <span>•</span>
      <span style={{ color: getMetricColor(metrics.ctr, 1, 2) }}>
        {formatPercentage(metrics.ctr)} CTR
      </span>
      <span>•</span>
      <span style={{ color: getMetricColor(metrics.viewabilityRate, 50, 70) }}>
        {formatPercentage(metrics.viewabilityRate)} view
      </span>
      
      {errors.length > 0 && (
        <>
          <span>•</span>
          <span style={{ color: '#ef4444' }}>{errors.length} err</span>
        </>
      )}
    </div>
  );
};

export default AdAnalytics;