# React 錯誤邊界 - 快速開始

## 安裝

```bash
npm install @vibe/shared-utils
# 或
yarn add @vibe/shared-utils
```

## 5分鐘快速開始

### 1. 最基本的錯誤邊界

```tsx
import { ErrorBoundary } from '@vibe/shared-utils';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 2. 處理異步數據加載

```tsx
import { AsyncBoundary } from '@vibe/shared-utils';

function DataPage() {
  return (
    <AsyncBoundary
      pendingFallback={<div>加載中...</div>}
      errorFallback={<div>加載失敗</div>}
    >
      <DataComponent />
    </AsyncBoundary>
  );
}
```

### 3. 自動重試

```tsx
import { RetryableAsyncBoundary } from '@vibe/shared-utils';

function UserProfile() {
  return (
    <RetryableAsyncBoundary
      maxRetries={3}
      retryDelay={1000}
    >
      <UserData />
    </RetryableAsyncBoundary>
  );
}
```

### 4. 自定義錯誤UI

```tsx
import { ErrorBoundary } from '@vibe/shared-utils';

function App() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h2>出錯了</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>重試</button>
        </div>
      )}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### 5. 使用 HOC

```tsx
import { withErrorBoundary } from '@vibe/shared-utils';

const MyComponent = () => <div>內容</div>;

export default withErrorBoundary(MyComponent, {
  fallback: <div>出錯了</div>,
});
```

## 常用組件

| 組件 | 用途 |
|------|------|
| `ErrorBoundary` | 基本錯誤邊界，捕獲渲染錯誤 |
| `AsyncBoundary` | 處理異步數據加載和錯誤 |
| `RetryableAsyncBoundary` | 帶自動重試的異步邊界 |
| `ErrorFallback` | 默認錯誤UI組件 |
| `LoadingSpinner` | 加載動畫組件 |

## 常用配置

### ErrorBoundary Props

```typescript
{
  fallback?: Component | ReactNode,    // 自定義錯誤UI
  onError?: (error, errorInfo) => {},  // 錯誤回調
  onReset?: () => {},                  // 重置回調
  resetAfter?: number,                 // 自動重置(毫秒)
  name?: string,                       // 日誌名稱
  disableLogging?: boolean,            // 禁用日誌
}
```

### AsyncBoundary Props

```typescript
{
  pendingFallback?: ReactNode,         // 加載UI
  errorFallback?: Component | ReactNode, // 錯誤UI
  onError?: (error, errorInfo) => {},  // 錯誤回調
  onReset?: () => {},                  // 重置回調
}
```

### RetryableAsyncBoundary Props

```typescript
{
  maxRetries?: number,                 // 最大重試次數
  retryDelay?: number,                 // 重試延遲(毫秒)
  retryStrategy?: 'immediate' | 'linear' | 'exponential',
  // ... 加上 AsyncBoundary 的所有 props
}
```

## 完整應用示例

```tsx
import {
  ErrorBoundary,
  AsyncBoundary,
  LoadingSpinner,
} from '@vibe/shared-utils';

function App() {
  return (
    // 1. 根級錯誤邊界
    <ErrorBoundary
      onError={(error) => {
        // 發送到錯誤監控
        console.error('應用錯誤:', error);
      }}
    >
      <Layout>
        {/* 2. 頁面級異步邊界 */}
        <AsyncBoundary
          pendingFallback={<LoadingSpinner />}
        >
          {/* 3. 組件級錯誤邊界 */}
          <ErrorBoundary name="Sidebar">
            <Sidebar />
          </ErrorBoundary>

          <ErrorBoundary name="Content">
            <Content />
          </ErrorBoundary>
        </AsyncBoundary>
      </Layout>
    </ErrorBoundary>
  );
}
```

## 最佳實踐

1. **分層使用**: 在應用、頁面、組件不同層級使用錯誤邊界
2. **記錄錯誤**: 使用 `onError` 回調發送錯誤到監控服務
3. **友好提示**: 提供清晰的錯誤信息和恢復選項
4. **環境區分**: 開發環境顯示詳情，生產環境隱藏敏感信息
5. **隔離組件**: 為關鍵組件單獨設置錯誤邊界，避免整個應用崩潰

## 下一步

- 查看 [README.md](./README.md) 了解完整文檔
- 查看 [examples.tsx](./examples.tsx) 查看更多示例
- 查看 [__tests__/ErrorBoundary.test.tsx](./__tests__/ErrorBoundary.test.tsx) 了解如何測試

## 故障排除

### 錯誤沒有被捕獲？

ErrorBoundary **不能**捕獲:
- 事件處理器中的錯誤 → 使用 try-catch 或 `useErrorHandler`
- 異步代碼 → 使用 `AsyncBoundary`
- 服務器端渲染的錯誤
- ErrorBoundary 自身的錯誤

### 如何捕獲事件處理器錯誤？

```tsx
import { useErrorHandler } from '@vibe/shared-utils';

function MyComponent() {
  const handleError = useErrorHandler();

  const onClick = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={onClick}>點擊</button>;
}
```

## 支持

遇到問題？請查看:
- 完整文檔: [README.md](./README.md)
- 示例代碼: [examples.tsx](./examples.tsx)
- 測試用例: [__tests__/ErrorBoundary.test.tsx](./__tests__/ErrorBoundary.test.tsx)
