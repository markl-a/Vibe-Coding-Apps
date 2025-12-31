# React 錯誤邊界組件

完整的 React 錯誤處理解決方案，包含錯誤邊界、異步數據處理和友好的錯誤UI。

## 組件列表

### 1. ErrorBoundary - 基本錯誤邊界
### 2. AsyncBoundary - 異步數據錯誤處理
### 3. ErrorFallback - 錯誤UI組件

---

## 使用示例

### 1. 基本錯誤邊界 (ErrorBoundary)

#### 最簡單的用法

```tsx
import { ErrorBoundary } from '@vibe/shared-utils';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### 自定義錯誤UI

```tsx
import { ErrorBoundary } from '@vibe/shared-utils';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>出錯了，請稍後再試</div>}
      onError={(error, errorInfo) => {
        console.error('錯誤:', error);
        console.error('組件堆棧:', errorInfo.componentStack);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### 使用自定義錯誤組件

```tsx
import { ErrorBoundary, ErrorFallbackProps } from '@vibe/shared-utils';

const CustomErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div>
      <h2>自定義錯誤頁面</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>重試</button>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### 自動重置錯誤

```tsx
import { ErrorBoundary } from '@vibe/shared-utils';

function App() {
  return (
    <ErrorBoundary
      resetAfter={5000} // 5秒後自動重置
      onReset={() => console.log('錯誤已重置')}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

#### 使用 HOC 包裝組件

```tsx
import { withErrorBoundary } from '@vibe/shared-utils';

const MyComponent = () => {
  return <div>我的組件</div>;
};

// 包裝組件
const SafeComponent = withErrorBoundary(MyComponent, {
  fallback: <div>出錯了</div>,
  onError: (error) => console.error(error),
});

// 使用
function App() {
  return <SafeComponent />;
}
```

---

### 2. 異步邊界 (AsyncBoundary)

#### 處理異步數據加載

```tsx
import { AsyncBoundary, LoadingSpinner } from '@vibe/shared-utils';

function App() {
  return (
    <AsyncBoundary
      pendingFallback={<LoadingSpinner />}
      errorFallback={<div>加載失敗</div>}
    >
      <AsyncDataComponent />
    </AsyncBoundary>
  );
}
```

#### 自定義加載和錯誤UI

```tsx
import { AsyncBoundary } from '@vibe/shared-utils';

const LoadingUI = () => (
  <div>
    <div className="spinner" />
    <p>正在加載數據...</p>
  </div>
);

const ErrorUI = ({ error, resetError }) => (
  <div>
    <h3>加載失敗</h3>
    <p>{error.message}</p>
    <button onClick={resetError}>重新加載</button>
  </div>
);

function App() {
  return (
    <AsyncBoundary
      pendingFallback={<LoadingUI />}
      errorFallback={ErrorUI}
      onError={(error) => {
        // 發送錯誤到監控服務
        console.error('異步錯誤:', error);
      }}
    >
      <DataComponent />
    </AsyncBoundary>
  );
}
```

#### 使用可重試的異步邊界

```tsx
import { RetryableAsyncBoundary } from '@vibe/shared-utils';

function App() {
  return (
    <RetryableAsyncBoundary
      maxRetries={3}
      retryDelay={1000}
      retryStrategy="exponential" // 'immediate' | 'linear' | 'exponential'
      pendingFallback={<div>加載中...</div>}
      onError={(error) => console.error('異步錯誤:', error)}
    >
      <DataComponent />
    </RetryableAsyncBoundary>
  );
}
```

#### 使用 HOC

```tsx
import { withAsyncBoundary } from '@vibe/shared-utils';

const AsyncComponent = () => {
  // 異步數據加載組件
  return <div>數據內容</div>;
};

const SafeAsyncComponent = withAsyncBoundary(AsyncComponent, {
  pendingFallback: <div>加載中...</div>,
  errorFallback: <div>加載失敗</div>,
});

function App() {
  return <SafeAsyncComponent />;
}
```

---

### 3. 錯誤降級UI (ErrorFallback)

#### 默認錯誤UI

```tsx
import { ErrorFallback } from '@vibe/shared-utils';

// 在ErrorBoundary中使用（自動）
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 或直接使用
<ErrorFallback
  error={new Error('出錯了')}
  resetError={() => console.log('重置')}
  title="應用錯誤"
  showDetails={true}
/>
```

#### 簡潔版錯誤UI

```tsx
import { MinimalErrorFallback } from '@vibe/shared-utils';

<MinimalErrorFallback
  error={new Error('出錯了')}
  resetError={() => window.location.reload()}
/>
```

#### 全屏錯誤UI

```tsx
import { FullPageErrorFallback } from '@vibe/shared-utils';

<FullPageErrorFallback
  error={new Error('應用崩潰')}
  resetError={() => window.location.reload()}
  title="應用程序錯誤"
  showDetails={process.env.NODE_ENV === 'development'}
/>
```

---

## 完整示例

### 示例 1: 完整應用錯誤處理

```tsx
import React from 'react';
import {
  ErrorBoundary,
  AsyncBoundary,
  FullPageErrorFallback,
  LoadingSpinner,
} from '@vibe/shared-utils';

// 根組件錯誤邊界
function App() {
  return (
    <ErrorBoundary
      fallback={FullPageErrorFallback}
      onError={(error, errorInfo) => {
        // 發送到錯誤監控服務
        sendToErrorTracking(error, errorInfo);
      }}
      name="App"
    >
      <Layout />
    </ErrorBoundary>
  );
}

// 頁面級別異步邊界
function Layout() {
  return (
    <div>
      <Header />
      <AsyncBoundary
        pendingFallback={<LoadingSpinner />}
        onError={(error) => {
          console.error('頁面加載錯誤:', error);
        }}
      >
        <MainContent />
      </AsyncBoundary>
    </div>
  );
}

// 組件級別錯誤邊界
function MainContent() {
  return (
    <div>
      <ErrorBoundary
        fallback={<div>此區域暫時無法使用</div>}
        name="Sidebar"
      >
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary
        fallback={<div>內容加載失敗</div>}
        name="Content"
      >
        <Content />
      </ErrorBoundary>
    </div>
  );
}
```

### 示例 2: 數據獲取組件

```tsx
import React, { Suspense } from 'react';
import {
  RetryableAsyncBoundary,
  LoadingSpinner,
} from '@vibe/shared-utils';

function UserProfile({ userId }: { userId: string }) {
  return (
    <RetryableAsyncBoundary
      maxRetries={3}
      retryDelay={1000}
      retryStrategy="exponential"
      pendingFallback={
        <div>
          <LoadingSpinner />
          <p>加載用戶資料...</p>
        </div>
      }
      onError={(error) => {
        console.error('用戶資料加載失敗:', error);
        // 發送到分析服務
        analytics.track('user_profile_load_error', {
          userId,
          error: error.message,
        });
      }}
    >
      <UserProfileContent userId={userId} />
    </RetryableAsyncBoundary>
  );
}
```

### 示例 3: 嵌套錯誤邊界

```tsx
import React from 'react';
import {
  ErrorBoundary,
  AsyncBoundary,
  MinimalErrorFallback,
} from '@vibe/shared-utils';

function Dashboard() {
  return (
    <div className="dashboard">
      {/* 整個儀表板的錯誤邊界 */}
      <ErrorBoundary
        name="Dashboard"
        onError={(error) => console.error('儀表板錯誤:', error)}
      >
        {/* 每個小部件都有自己的錯誤邊界 */}
        <div className="widgets">
          <ErrorBoundary
            fallback={<MinimalErrorFallback />}
            name="Widget1"
          >
            <AsyncBoundary pendingFallback={<div>加載中...</div>}>
              <Widget1 />
            </AsyncBoundary>
          </ErrorBoundary>

          <ErrorBoundary
            fallback={<MinimalErrorFallback />}
            name="Widget2"
          >
            <AsyncBoundary pendingFallback={<div>加載中...</div>}>
              <Widget2 />
            </AsyncBoundary>
          </ErrorBoundary>

          <ErrorBoundary
            fallback={<MinimalErrorFallback />}
            name="Widget3"
          >
            <AsyncBoundary pendingFallback={<div>加載中...</div>}>
              <Widget3 />
            </AsyncBoundary>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
}
```

### 示例 4: 使用 Hook 手動處理錯誤

```tsx
import React from 'react';
import { useErrorHandler } from '@vibe/shared-utils';

function MyComponent() {
  const handleError = useErrorHandler((error) => {
    // 自定義錯誤處理
    console.error('自定義錯誤處理:', error);
  });

  const handleClick = async () => {
    try {
      const data = await fetchData();
      // 處理數據
    } catch (error) {
      // 拋出錯誤，讓ErrorBoundary捕獲
      handleError(error as Error);
    }
  };

  return (
    <button onClick={handleClick}>
      加載數據
    </button>
  );
}

// 包裝在ErrorBoundary中
function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

---

## 功能特點

### ErrorBoundary
- ✅ 捕獲React組件樹中的渲染錯誤
- ✅ 自動記錄錯誤到logger
- ✅ 支持自定義錯誤UI
- ✅ 支持錯誤重置/重試
- ✅ 支持自動重置（定時）
- ✅ 支持錯誤回調
- ✅ TypeScript完整類型支持
- ✅ 提供HOC和工廠函數

### AsyncBoundary
- ✅ 結合ErrorBoundary和Suspense
- ✅ 處理異步數據加載
- ✅ 自定義加載UI
- ✅ 自定義錯誤UI
- ✅ 支持自動重試（可配置次數和策略）
- ✅ 指數退避重試策略
- ✅ 錯誤和重置回調

### ErrorFallback
- ✅ 友好的錯誤信息顯示
- ✅ 支持重試按鈕
- ✅ 支持重新加載頁面
- ✅ 開發模式顯示詳細錯誤信息
- ✅ 自定義樣式支持
- ✅ 提供簡潔版和全屏版

---

## TypeScript 類型

所有組件都提供完整的TypeScript類型定義：

```typescript
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  AsyncBoundaryProps,
  RetryableAsyncBoundaryProps,
  ErrorFallbackProps,
} from '@vibe/shared-utils';
```

---

## 最佳實踐

1. **分層錯誤邊界**: 在應用的不同層級使用錯誤邊界
   - 根級別: 捕獲整個應用的崩潰
   - 頁面級別: 防止一個頁面的錯誤影響其他頁面
   - 組件級別: 隔離組件錯誤

2. **錯誤日誌**: 始終記錄錯誤到監控服務
   ```tsx
   <ErrorBoundary
     onError={(error, errorInfo) => {
       errorTrackingService.captureException(error, {
         context: errorInfo,
       });
     }}
   >
   ```

3. **友好的錯誤信息**: 給用戶提供清晰的錯誤說明和操作建議

4. **開發vs生產**: 在開發環境顯示詳細錯誤，生產環境顯示友好信息
   ```tsx
   <ErrorFallback
     error={error}
     showDetails={process.env.NODE_ENV === 'development'}
   />
   ```

5. **異步數據**: 使用AsyncBoundary處理數據獲取
   ```tsx
   <AsyncBoundary
     pendingFallback={<Loading />}
     errorFallback={<Error />}
   >
     <DataComponent />
   </AsyncBoundary>
   ```

---

## 注意事項

1. ErrorBoundary **不能**捕獲以下錯誤:
   - 事件處理器中的錯誤（使用try-catch）
   - 異步代碼（setTimeout、Promise等）
   - 服務器端渲染
   - ErrorBoundary自身拋出的錯誤

2. 對於事件處理器，使用 try-catch 或 useErrorHandler hook

3. 確保在生產環境中不洩露敏感錯誤信息

---

## 相關資源

- [React Error Boundaries 官方文檔](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [React Suspense 官方文檔](https://react.dev/reference/react/Suspense)
