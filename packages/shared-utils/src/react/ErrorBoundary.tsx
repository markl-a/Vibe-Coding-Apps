/**
 * React Error Boundary Component
 * React錯誤邊界組件 - 捕獲並處理渲染錯誤
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '../logger';
import { ErrorFallback, ErrorFallbackProps } from './ErrorFallback';

const logger = createLogger('ErrorBoundary');

export interface ErrorBoundaryProps {
  /** 子組件 */
  children: ReactNode;
  /** 自定義錯誤降級UI */
  fallback?: React.ComponentType<ErrorFallbackProps> | ReactNode;
  /** 錯誤處理回調 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 是否在錯誤後自動重置 (毫秒) */
  resetAfter?: number;
  /** 重置時的回調 */
  onReset?: () => void;
  /** 錯誤邊界名稱 (用於日誌) */
  name?: string;
  /** 是否禁用日誌記錄 */
  disableLogging?: boolean;
  /** 降級UI的額外props */
  fallbackProps?: Partial<ErrorFallbackProps>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * React錯誤邊界組件
 * 捕獲子組件樹中的JavaScript錯誤，記錄錯誤，並顯示降級UI
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * @example 自定義錯誤處理
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     sendToAnalytics(error, errorInfo);
 *   }}
 *   fallback={<div>出錯了</div>}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimer?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 使下一次渲染能夠顯示降級 UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, disableLogging, name, resetAfter } = this.props;

    // 更新錯誤計數
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // 記錄錯誤到logger
    if (!disableLogging) {
      logger.error(
        `錯誤邊界捕獲到錯誤${name ? ` [${name}]` : ''}`,
        error,
        {
          componentStack: errorInfo.componentStack,
          errorCount: this.state.errorCount + 1,
        }
      );
    }

    // 調用自定義錯誤處理
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (callbackError) {
        if (!disableLogging) {
          logger.error('錯誤處理回調失敗', callbackError as Error);
        }
      }
    }

    // 自動重置
    if (resetAfter && resetAfter > 0) {
      this.resetTimer = setTimeout(() => {
        this.resetErrorBoundary();
      }, resetAfter);
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  resetErrorBoundary = (): void => {
    const { onReset } = this.props;

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }

    if (onReset) {
      try {
        onReset();
      } catch (callbackError) {
        if (!this.props.disableLogging) {
          logger.error('重置回調失敗', callbackError as Error);
        }
      }
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, fallbackProps } = this.props;

    if (hasError && error) {
      // 自定義降級UI (ReactNode)
      if (fallback && !React.isValidElement(fallback) && typeof fallback !== 'function') {
        return fallback;
      }

      // 自定義降級UI (Component)
      if (fallback && typeof fallback === 'function') {
        const FallbackComponent = fallback as React.ComponentType<ErrorFallbackProps>;
        return (
          <FallbackComponent
            error={error}
            resetError={this.resetErrorBoundary}
            {...fallbackProps}
          />
        );
      }

      // 默認降級UI
      return (
        <ErrorFallback
          error={error}
          resetError={this.resetErrorBoundary}
          {...fallbackProps}
        />
      );
    }

    return children;
  }
}

/**
 * 創建帶有默認配置的錯誤邊界
 */
export function createErrorBoundary(
  defaultProps: Partial<ErrorBoundaryProps> = {}
): React.FC<Omit<ErrorBoundaryProps, keyof typeof defaultProps> & Partial<ErrorBoundaryProps>> {
  return (props) => <ErrorBoundary {...defaultProps} {...props} />;
}

/**
 * 用於函數組件的錯誤邊界HOC
 *
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <div>出錯了</div>,
 *   onError: (error) => console.error(error),
 * });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * 錯誤邊界Hook (用於函數組件內部狀態管理)
 * 注意: 這不能捕獲渲染錯誤，僅用於手動錯誤處理
 */
export function useErrorHandler(
  onError?: (error: Error) => void
): (error: Error) => void {
  return React.useCallback(
    (error: Error) => {
      if (onError) {
        onError(error);
      }
      // 拋出錯誤以被ErrorBoundary捕獲
      throw error;
    },
    [onError]
  );
}

export default ErrorBoundary;
