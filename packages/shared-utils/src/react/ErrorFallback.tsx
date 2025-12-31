/**
 * Error Fallback UI Component
 * 錯誤降級UI組件 - 顯示友好的錯誤信息
 */

import React from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError?: () => void;
  title?: string;
  showDetails?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 默認錯誤降級UI組件
 * 顯示錯誤信息並提供重試功能
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = '出錯了',
  showDetails = process.env.NODE_ENV === 'development',
  className = '',
  style = {},
}) => {
  const containerStyle: React.CSSProperties = {
    padding: '2rem',
    margin: '2rem auto',
    maxWidth: '600px',
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    ...style,
  };

  const titleStyle: React.CSSProperties = {
    color: '#c33',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
  };

  const messageStyle: React.CSSProperties = {
    color: '#666',
    fontSize: '1rem',
    marginBottom: '1rem',
    lineHeight: '1.5',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#c33',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '0.5rem 1.5rem',
    fontSize: '1rem',
    cursor: 'pointer',
    marginRight: '0.5rem',
  };

  const detailsStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#333',
    maxHeight: '300px',
    overflowY: 'auto',
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className={className} style={containerStyle} role="alert">
      <h2 style={titleStyle}>{title}</h2>

      <p style={messageStyle}>
        {error.message || '應用程序遇到了意外錯誤。請嘗試重新加載頁面。'}
      </p>

      <div>
        {resetError && (
          <button
            onClick={resetError}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#a22';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#c33';
            }}
          >
            重試
          </button>
        )}

        <button
          onClick={handleReload}
          style={{
            ...buttonStyle,
            backgroundColor: '#666',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#666';
          }}
        >
          重新加載頁面
        </button>
      </div>

      {showDetails && error.stack && (
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#666', marginBottom: '0.5rem' }}>
            錯誤詳情 (開發模式)
          </summary>
          <div style={detailsStyle}>
            <strong>錯誤類型:</strong> {error.name}
            {'\n\n'}
            <strong>錯誤信息:</strong> {error.message}
            {'\n\n'}
            <strong>堆棧跟蹤:</strong>
            {'\n'}
            {error.stack}
          </div>
        </details>
      )}
    </div>
  );
};

/**
 * 簡潔版錯誤降級組件
 */
export const MinimalErrorFallback: React.FC<Pick<ErrorFallbackProps, 'error' | 'resetError'>> = ({
  error,
  resetError,
}) => {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        color: '#c33',
      }}
      role="alert"
    >
      <strong>錯誤:</strong> {error.message}
      {resetError && (
        <>
          {' '}
          <button
            onClick={resetError}
            style={{
              marginLeft: '0.5rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: '#c33',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            重試
          </button>
        </>
      )}
    </div>
  );
};

/**
 * 全屏錯誤降級組件
 */
export const FullPageErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = '應用程序錯誤',
  showDetails = process.env.NODE_ENV === 'development',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#f5f5f5',
      }}
    >
      <ErrorFallback
        error={error}
        resetError={resetError}
        title={title}
        showDetails={showDetails}
        style={{
          margin: 0,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
};

export default ErrorFallback;
