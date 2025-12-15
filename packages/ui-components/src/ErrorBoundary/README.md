# ErrorBoundary 組件

ErrorBoundary 是一個 React 組件，用於捕獲子組件樹中的 JavaScript 錯誤，記錄這些錯誤，並顯示一個友好的備用 UI。

## 功能特性

- ✅ 捕獲子組件的 JavaScript 錯誤
- ✅ 顯示友好的錯誤 UI（支持自定義）
- ✅ 支持重試按鈕重置錯誤狀態
- ✅ 支持錯誤日誌記錄回調
- ✅ 開發模式下顯示詳細錯誤信息
- ✅ 完整的 TypeScript 支持

## 基本使用

```tsx
import { ErrorBoundary } from '@vibe/ui-components';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## API

### Props

| 屬性名 | 類型 | 必填 | 說明 |
|--------|------|------|------|
| `children` | `ReactNode` | ✅ | 要被錯誤邊界保護的子組件 |
| `fallback` | `ReactNode` | ❌ | 自定義的錯誤 UI |
| `onError` | `(error: Error, errorInfo: ErrorInfo) => void` | ❌ | 錯誤發生時的回調函數 |
| `onReset` | `() => void` | ❌ | 重置錯誤狀態時的回調函數 |

## 使用示例

### 1. 基本使用（使用預設錯誤 UI）

```tsx
import { ErrorBoundary } from '@vibe/ui-components';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 2. 自定義錯誤 UI

```tsx
import { ErrorBoundary } from '@vibe/ui-components';

function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-container">
          <h1>糟糕！出錯了</h1>
          <p>請稍後再試</p>
        </div>
      }
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 3. 錯誤日誌記錄

```tsx
import { ErrorBoundary } from '@vibe/ui-components';

function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 發送錯誤到日誌服務
    console.error('Error caught:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // 可以發送到 Sentry、LogRocket 等服務
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 4. 處理重置邏輯

```tsx
import { ErrorBoundary } from '@vibe/ui-components';
import { useState } from 'react';

function App() {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    // 執行清理邏輯
    console.log('Resetting application state...');

    // 強制重新渲染
    setResetKey(prev => prev + 1);
  };

  return (
    <ErrorBoundary key={resetKey} onReset={handleReset}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 5. 多層錯誤邊界

```tsx
import { ErrorBoundary } from '@vibe/ui-components';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>應用程式層級錯誤</div>}
      onError={(error) => console.error('App error:', error)}
    >
      <Header />

      <main>
        <ErrorBoundary
          fallback={<div>側邊欄載入失敗</div>}
          onError={(error) => console.error('Sidebar error:', error)}
        >
          <Sidebar />
        </ErrorBoundary>

        <ErrorBoundary
          fallback={<div>內容載入失敗</div>}
          onError={(error) => console.error('Content error:', error)}
        >
          <Content />
        </ErrorBoundary>
      </main>

      <Footer />
    </ErrorBoundary>
  );
}
```

### 6. 與第三方服務集成

```tsx
import { ErrorBoundary } from '@vibe/ui-components';
import * as Sentry from '@sentry/react';

function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 發送到 Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## 注意事項

1. **ErrorBoundary 無法捕獲的錯誤**：
   - 事件處理器中的錯誤（使用 try-catch）
   - 異步代碼（setTimeout、Promise 等）
   - 服務端渲染的錯誤
   - ErrorBoundary 自身的錯誤

2. **開發 vs 生產環境**：
   - 開發環境下會顯示詳細的錯誤信息和組件堆疊
   - 生產環境下只顯示友好的錯誤 UI

3. **最佳實踐**：
   - 在應用程式的適當層級放置 ErrorBoundary
   - 為不同的功能區域使用多個 ErrorBoundary
   - 始終提供 `onError` 回調來記錄錯誤
   - 考慮提供重試或恢復機制

## 預設錯誤 UI 特性

預設的錯誤 UI 包含：

- 🎨 美觀的錯誤圖標和排版
- 🔄 重試按鈕（重置錯誤狀態）
- 🔃 重新整理頁面按鈕
- 🐛 開發模式下的錯誤詳情（錯誤訊息、組件堆疊）
- 📱 響應式設計

## TypeScript 類型

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}
```

## 相關資源

- [React 錯誤邊界文檔](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Error Boundary 最佳實踐](https://react.dev/reference/react/Component#static-getderivedstatefromerror)
