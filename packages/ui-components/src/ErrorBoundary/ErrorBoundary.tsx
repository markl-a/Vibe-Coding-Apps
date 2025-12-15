import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    const { onError } = this.props;

    this.setState({
      errorInfo,
    });

    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = (): void => {
    const { onReset } = this.props;

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (onReset) {
      onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12"
        >
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-12 w-12 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  出錯了
                </h1>
                <p className="text-gray-600 mb-4">
                  應用程式遇到了一個意外錯誤。請嘗試重新整理頁面，或聯繫技術支援。
                </p>

                {error && process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-700 mb-2">
                        錯誤訊息：
                      </h2>
                      <pre className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800 overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>

                    {errorInfo && errorInfo.componentStack && (
                      <div>
                        <h2 className="text-sm font-semibold text-gray-700 mb-2">
                          組件堆疊：
                        </h2>
                        <pre className="bg-gray-50 border border-gray-200 rounded p-4 text-xs text-gray-700 overflow-x-auto max-h-64 overflow-y-auto">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    重試
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    重新整理頁面
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
