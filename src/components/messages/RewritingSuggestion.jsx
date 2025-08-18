// components/messages/RewritingSuggestion.jsx
import React from 'react';
import { Button } from '../common/Button';

const RewritingSuggestion = ({ 
  originalText, 
  suggestion, 
  isLoading, 
  onApply, 
  onDismiss 
}) => {
  if (!suggestion && !isLoading) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: '0',
      right: '0',
      background: 'white',
      border: '1px solid #e1e5e9',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      marginBottom: '8px',
      zIndex: 1000,
      animation: 'slideUp 0.2s ease-out'
    }}>
      {isLoading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px',
          gap: '12px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #f3f4f6',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            더 나은 표현을 찾고 있어요...
          </span>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <img src='./logo.png' style={{ width: "20px", height: "20px"  }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              더 나은 표현
            </span>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '8px',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              borderLeft: '3px solid #ef4444'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                minWidth: '35px'
              }}>원본:</span>
              <span style={{
                fontSize: '14px',
                lineHeight: '1.4',
                flex: 1,
                color: '#dc2626'
              }}>{originalText}</span>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: '#f0f9ff',
              borderLeft: '3px solid #3b82f6'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                minWidth: '35px'
              }}>제안:</span>
              <span style={{
                fontSize: '14px',
                lineHeight: '1.4',
                flex: 1,
                color: '#1d4ed8'
              }}>{suggestion}</span>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <Button
              onClick={onApply}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              적용
            </Button>
            <Button
              onClick={onDismiss}
              style={{
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              무시
            </Button>
          </div>
        </div>
      )}
      
      
    </div>
  );
};

export default RewritingSuggestion;