/**
 * Async Boundary Component
 * 異步邊界組件 - 處理異步數據加載和錯誤
 */

import React, { ReactNode, Suspense, SuspenseProps } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from './ErrorBoundary';
import { ErrorFallbackProps } from './ErrorFallback';
import { createLogger } from '../logger';

const logger = createLogger('AsyncBoundary');

export interface AsyncBoundaryProps {
  /** 子組件 */
  children: ReactNode;
  /** 加載中的降級UI */
  pendingFallback?: ReactNode;
  /** 錯誤降級UI */
  errorFallback?: React.ComponentType<ErrorFallbackProps> | ReactNode;
  /** 錯誤處理回調 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** 重置時的回調 */
  onReset?: () => void;
  /** 異步邊界名稱 (用於日誌) */
  name?: string;
  /** 是否禁用日誌記錄 */
  disableLogging?: boolean;
  /** Suspense配置 */
  suspenseProps?: Omit<SuspenseProps, 'children' | 'fallback'>;
  /** ErrorBoundary額外配置 */
  errorBoundaryProps?: Partial<ErrorBoundaryProps>;
}

/**
 * 異步邊界組件
 * 結合 ErrorBoundary 和 Suspense，處理異步數據加載和錯誤
 *
 * @example 基本用法
 * ```tsx
 * <AsyncBoundary
 *   pendingFallback={<LoadingSpinner />}
 *   errorFallback={<ErrorMessage />}
 * >
 *   <AsyncComponent />
 * </AsyncBoundary>
 * ```
 *
 * @example 帶重試功能
 * ```tsx
 * <AsyncBoundary
 *   pendingFallback={<div>加載中...</div>}
 *   onError={(error) => console.error('異步錯誤:', error)}
 *   onReset={() => console.log('重試加載')}
 * >
 *   <DataComponent />
 * </AsyncBoundary>
 * ```
 */
export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  children,
  pendingFallback = <DefaultLoadingFallback />,
  errorFallback,
  onError,
  onReset,
  name,
  disableLogging = false,
  suspenseProps,
  errorBoundaryProps,
}) => {
  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      if (!disableLogging) {
        logger.error(
          `異步邊界捕獲到錯誤${name ? ` [${name}]` : ''}`,
          error,
          {
            componentStack: errorInfo.componentStack,
          }
        );
      }

      if (onError) {
        onError(error, errorInfo);
      }
    },
    [onError, name, disableLogging]
  );

  return (
    <ErrorBoundary
      fallback={errorFallback}
      onError={handleError}
      onReset={onReset}
      name={name}
      disableLogging={disableLogging}
      {...errorBoundaryProps}
    >
      <Suspense fallback={pendingFallback} {...suspenseProps}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 默認加載降級組件
 */
export const DefaultLoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        color: '#666',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner />
        <div style={{ marginTop: '1rem' }}>加載中...</div>
      </div>
    </div>
  );
};

/**
 * 加載動畫組件
 */
export const LoadingSpinner: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#3b82f6',
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${size / 10}px solid #f3f3f3`,
        borderTop: `${size / 10}px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto',
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/**
 * 用於函數組件的異步邊界HOC
 *
 * @example
 * ```tsx
 * const SafeAsyncComponent = withAsyncBoundary(MyAsyncComponent, {
 *   pendingFallback: <LoadingSpinner />,
 *   errorFallback: <ErrorMessage />,
 * });
 * ```
 */
export function withAsyncBoundary<P extends object>(
  Component: React.ComponentType<P>,
  asyncBoundaryProps?: Omit<AsyncBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <AsyncBoundary {...asyncBoundaryProps}>
      <Component {...props} />
    </AsyncBoundary>
  );

  WrappedComponent.displayName = `withAsyncBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * 異步數據狀態管理Hook
 * 處理Promise狀態並與Suspense協作
 */
export function useAsyncValue<T>(promise: Promise<T>): T {
  const [state, setState] = React.useState<{
    status: 'pending' | 'success' | 'error';
    value?: T;
    error?: Error;
  }>({ status: 'pending' });

  // 使用React的use hook (如果可用) 或自定義實現
  if (state.status === 'pending') {
    throw promise.then(
      (value) => setState({ status: 'success', value }),
      (error) => setState({ status: 'error', error })
    );
  }

  if (state.status === 'error') {
    throw state.error;
  }

  return state.value as T;
}

/**
 * 創建可重試的異步邊界
 * 提供自動重試功能
 */
export interface RetryableAsyncBoundaryProps extends AsyncBoundaryProps {
  /** 最大重試次數 */
  maxRetries?: number;
  /** 重試延遲 (毫秒) */
  retryDelay?: number;
  /** 重試策略: 'immediate' | 'exponential' | 'linear' */
  retryStrategy?: 'immediate' | 'exponential' | 'linear';
}

export const RetryableAsyncBoundary: React.FC<RetryableAsyncBoundaryProps> = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  retryStrategy = 'exponential',
  onError,
  onReset,
  ...asyncBoundaryProps
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const calculateDelay = (attempt: number): number => {
    switch (retryStrategy) {
      case 'immediate':
        return 0;
      case 'linear':
        return retryDelay * attempt;
      case 'exponential':
        return retryDelay * Math.pow(2, attempt - 1);
      default:
        return retryDelay;
    }
  };

  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      if (onError) {
        onError(error, errorInfo);
      }

      if (retryCount < maxRetries) {
        const delay = calculateDelay(retryCount + 1);
        setIsRetrying(true);

        logger.info(
          `異步邊界準備重試 (${retryCount + 1}/${maxRetries})`,
          {
            delay,
            strategy: retryStrategy,
          }
        );

        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setIsRetrying(false);
          if (onReset) {
            onReset();
          }
        }, delay);
      } else {
        logger.warn('異步邊界達到最大重試次數', {
          maxRetries,
          error: error.message,
        });
      }
    },
    [retryCount, maxRetries, retryStrategy, retryDelay, onError, onReset]
  );

  const handleReset = React.useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    if (onReset) {
      onReset();
    }
  }, [onReset]);

  if (isRetrying) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        重試中... ({retryCount}/{maxRetries})
      </div>
    );
  }

  return (
    <AsyncBoundary
      {...asyncBoundaryProps}
      onError={handleError}
      onReset={handleReset}
      key={retryCount} // 重置子組件
    >
      {children}
    </AsyncBoundary>
  );
};

export default AsyncBoundary;
