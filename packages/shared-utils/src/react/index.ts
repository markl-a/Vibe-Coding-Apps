/**
 * React Utilities and Components
 * React工具和組件集合
 *
 * 包含:
 * - ErrorBoundary: 錯誤邊界組件，捕獲渲染錯誤
 * - AsyncBoundary: 異步邊界組件，處理異步數據和錯誤
 * - ErrorFallback: 錯誤降級UI組件
 */

// Error Boundary
export {
  ErrorBoundary,
  createErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
} from './ErrorBoundary';

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
} from './ErrorBoundary';

// Async Boundary
export {
  AsyncBoundary,
  RetryableAsyncBoundary,
  withAsyncBoundary,
  useAsyncValue,
  DefaultLoadingFallback,
  LoadingSpinner,
} from './AsyncBoundary';

export type {
  AsyncBoundaryProps,
  RetryableAsyncBoundaryProps,
} from './AsyncBoundary';

// Error Fallback UI
export {
  ErrorFallback,
  MinimalErrorFallback,
  FullPageErrorFallback,
} from './ErrorFallback';

export type {
  ErrorFallbackProps,
} from './ErrorFallback';
