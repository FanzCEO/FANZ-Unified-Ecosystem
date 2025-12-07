import React, { useEffect, useState } from 'react';
import { AdExplanation } from '../types';
import { useFanzAds } from '../providers/FanzAdProvider';

export interface WhyThisAdProps {
  adId: string;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

/**
 * WhyThisAd Component
 * Provides transparency about why a specific ad was shown to the user
 */
export const WhyThisAd: React.FC<WhyThisAdProps> = ({
  adId,
  onClose,
  isOpen,
  className = ''
}) => {
  const { apiBaseUrl, userHash, debug } = useFanzAds();
  const [explanation, setExplanation] = useState<AdExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch explanation when modal opens
  useEffect(() => {
    if (isOpen && adId) {
      fetchExplanation();
    }
  }, [isOpen, adId]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${apiBaseUrl}/ads/${adId}/why`, window.location.origin);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (userHash) {
        headers['X-FANZ-User'] = userHash;
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch explanation: ${response.status}`);
      }

      const data = await response.json();
      setExplanation(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ad explanation';
      setError(errorMessage);
      
      if (debug) {
        console.error('[FANZ Ads] WhyThisAd error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const formatWeight = (weight: number): string => {
    return `${Math.round(weight * 100)}%`;
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'targeting':
        return '🎯';
      case 'behavior':
        return '👤';
      case 'context':
        return '📍';
      case 'creative':
        return '🎨';
      default:
        return '📊';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fanz-ad-transparency-modal ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="why-this-ad-title"
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 
            id="why-this-ad-title"
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827'
            }}
          >
            Why this ad?
          </h2>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0',
              lineHeight: 1
            }}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: '20px',
            maxHeight: 'calc(80vh - 140px)',
            overflowY: 'auto'
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
              Loading explanation...
            </div>
          )}

          {error && (
            <div 
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                color: '#dc2626'
              }}
            >
              {error}
            </div>
          )}

          {explanation && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
                We use several factors to determine which ads to show you:
              </p>

              {/* Factors */}
              <div style={{ marginBottom: '24px' }}>
                {explanation.factors.map((factor, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    <span style={{ marginRight: '12px', fontSize: '16px' }}>
                      {getCategoryIcon(factor.category)}
                    </span>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                        {factor.reason}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>
                        {factor.category} • Weight: {formatWeight(factor.weight)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Transparency info */}
              {explanation.transparency && (
                <div
                  style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>
                    About this advertiser
                  </h3>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#111827' }}>Advertiser:</strong>
                    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
                      {explanation.transparency.advertiser}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#111827' }}>Category:</strong>
                    <span style={{ marginLeft: '8px', fontSize: '14px', color: '#6b7280' }}>
                      {explanation.transparency.category}
                    </span>
                  </div>

                  {explanation.transparency.dataUsed && explanation.transparency.dataUsed.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '14px', color: '#111827' }}>Data used:</strong>
                      <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '14px', color: '#6b7280' }}>
                        {explanation.transparency.dataUsed.map((data, index) => (
                          <li key={index} style={{ marginBottom: '2px' }}>{data}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Ad transparency by FANZ
          </div>
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};