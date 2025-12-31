/**
 * React 錯誤邊界組件 - 使用示例
 * 這個文件包含各種使用場景的完整示例
 */

import React from 'react';
import {
  ErrorBoundary,
  AsyncBoundary,
  RetryableAsyncBoundary,
  ErrorFallback,
  MinimalErrorFallback,
  FullPageErrorFallback,
  LoadingSpinner,
  withErrorBoundary,
  withAsyncBoundary,
  useErrorHandler,
  ErrorFallbackProps,
} from './index';

// ============================================================================
// 示例 1: 基本錯誤邊界
// ============================================================================

export function Example1_BasicErrorBoundary() {
  return (
    <ErrorBoundary>
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}

// ============================================================================
// 示例 2: 自定義錯誤UI
// ============================================================================

const CustomErrorUI: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107' }}>
      <h3>自定義錯誤提示</h3>
      <p>{error.message}</p>
      <button onClick={resetError}>重試</button>
    </div>
  );
};

export function Example2_CustomErrorUI() {
  return (
    <ErrorBoundary fallback={CustomErrorUI}>
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}

// ============================================================================
// 示例 3: 錯誤處理回調
// ============================================================================

export function Example3_ErrorCallback() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 發送到錯誤監控服務
    console.error('錯誤詳情:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // 可以發送到 Sentry, LogRocket 等
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  };

  return (
    <ErrorBoundary
      onError={handleError}
      onReset={() => console.log('錯誤已重置')}
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}

// ============================================================================
// 示例 4: 自動重置錯誤
// ============================================================================

export function Example4_AutoReset() {
  return (
    <ErrorBoundary
      resetAfter={5000} // 5秒後自動重置
      fallback={
        <div>
          <p>出錯了，將在5秒後自動重試...</p>
        </div>
      }
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}

// ============================================================================
// 示例 5: 異步數據邊界
// ============================================================================

export function Example5_AsyncBoundary() {
  return (
    <AsyncBoundary
      pendingFallback={
        <div>
          <LoadingSpinner />
          <p>加載中...</p>
        </div>
      }
      errorFallback={
        <div>
          <p>加載失敗</p>
        </div>
      }
    >
      <AsyncDataComponent />
    </AsyncBoundary>
  );
}

// ============================================================================
// 示例 6: 可重試的異步邊界
// ============================================================================

export function Example6_RetryableAsyncBoundary() {
  return (
    <RetryableAsyncBoundary
      maxRetries={3}
      retryDelay={1000}
      retryStrategy="exponential"
      pendingFallback={<LoadingSpinner />}
      errorFallback={
        <div>
          <p>加載失敗，已自動重試</p>
        </div>
      }
      onError={(error) => {
        console.error('異步加載錯誤:', error);
      }}
    >
      <AsyncDataComponent />
    </RetryableAsyncBoundary>
  );
}

// ============================================================================
// 示例 7: 使用 HOC
// ============================================================================

const RiskyComponent: React.FC<{ name: string }> = ({ name }) => {
  return <div>Hello, {name}</div>;
};

const SafeComponent = withErrorBoundary(RiskyComponent, {
  fallback: <MinimalErrorFallback />,
  onError: (error) => console.error('組件錯誤:', error),
});

export function Example7_WithHOC() {
  return <SafeComponent name="User" />;
}

// ============================================================================
// 示例 8: 異步組件 HOC
// ============================================================================

const AsyncComponent: React.FC = () => {
  return <div>異步數據內容</div>;
};

const SafeAsyncComponent = withAsyncBoundary(AsyncComponent, {
  pendingFallback: <LoadingSpinner />,
  errorFallback: <div>加載失敗</div>,
});

export function Example8_AsyncHOC() {
  return <SafeAsyncComponent />;
}

// ============================================================================
// 示例 9: 完整應用結構
// ============================================================================

export function Example9_CompleteApp() {
  return (
    // 根級錯誤邊界 - 捕獲整個應用的錯誤
    <ErrorBoundary
      fallback={FullPageErrorFallback}
      onError={(error, errorInfo) => {
        // 發送到錯誤監控
        console.error('應用級錯誤:', error);
      }}
      name="App"
    >
      <Layout />
    </ErrorBoundary>
  );
}

function Layout() {
  return (
    <div>
      <Header />

      {/* 主內容異步邊界 */}
      <AsyncBoundary
        pendingFallback={<LoadingSpinner />}
        errorFallback={<div>頁面加載失敗</div>}
      >
        <MainContent />
      </AsyncBoundary>

      <Footer />
    </div>
  );
}

function MainContent() {
  return (
    <div style={{ display: 'flex' }}>
      {/* 側邊欄錯誤邊界 */}
      <ErrorBoundary
        fallback={<div>側邊欄暫時無法使用</div>}
        name="Sidebar"
      >
        <Sidebar />
      </ErrorBoundary>

      {/* 主要內容錯誤邊界 */}
      <ErrorBoundary
        fallback={<div>內容加載失敗</div>}
        name="Content"
      >
        <Content />
      </ErrorBoundary>
    </div>
  );
}

// ============================================================================
// 示例 10: 數據獲取組件
// ============================================================================

export function Example10_DataFetching() {
  return (
    <RetryableAsyncBoundary
      maxRetries={3}
      retryDelay={1000}
      retryStrategy="exponential"
      pendingFallback={
        <div>
          <LoadingSpinner size={50} color="#0066cc" />
          <p>正在加載用戶數據...</p>
        </div>
      }
      onError={(error) => {
        console.error('用戶數據加載失敗:', error);
        // analytics.track('user_data_load_error', { error: error.message });
      }}
      onReset={() => {
        console.log('重新加載用戶數據');
      }}
    >
      <UserProfileData userId="123" />
    </RetryableAsyncBoundary>
  );
}

// ============================================================================
// 示例 11: 儀表板（多個獨立錯誤邊界）
// ============================================================================

export function Example11_Dashboard() {
  return (
    <div className="dashboard">
      <h1>儀表板</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {/* 每個小部件都有獨立的錯誤邊界 */}
        <ErrorBoundary
          fallback={<MinimalErrorFallback />}
          name="Widget-Sales"
        >
          <AsyncBoundary pendingFallback={<LoadingSpinner size={30} />}>
            <SalesWidget />
          </AsyncBoundary>
        </ErrorBoundary>

        <ErrorBoundary
          fallback={<MinimalErrorFallback />}
          name="Widget-Users"
        >
          <AsyncBoundary pendingFallback={<LoadingSpinner size={30} />}>
            <UsersWidget />
          </AsyncBoundary>
        </ErrorBoundary>

        <ErrorBoundary
          fallback={<MinimalErrorFallback />}
          name="Widget-Revenue"
        >
          <AsyncBoundary pendingFallback={<LoadingSpinner size={30} />}>
            <RevenueWidget />
          </AsyncBoundary>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// ============================================================================
// 示例 12: 使用 useErrorHandler Hook
// ============================================================================

export function Example12_UseErrorHandler() {
  const handleError = useErrorHandler((error) => {
    console.error('手動錯誤處理:', error);
    // 可以在這裡做額外的錯誤處理
  });

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('API 請求失敗');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      // 拋出錯誤，讓ErrorBoundary捕獲
      handleError(error as Error);
    }
  };

  return (
    <ErrorBoundary>
      <div>
        <button onClick={fetchData}>加載數據</button>
      </div>
    </ErrorBoundary>
  );
}

// ============================================================================
// 示例 13: 不同環境的錯誤UI
// ============================================================================

export function Example13_EnvironmentBasedUI() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          error={new Error('測試錯誤')}
          showDetails={isDevelopment} // 僅在開發環境顯示詳情
          title={isDevelopment ? '開發環境錯誤' : '出錯了'}
        />
      }
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}

// ============================================================================
// 示例 14: 表單提交錯誤處理
// ============================================================================

export function Example14_FormSubmission() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const handleError = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ /* form data */ }),
      });

      if (!response.ok) {
        throw new Error('提交失敗');
      }

      alert('提交成功！');
    } catch (error) {
      handleError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交'}
        </button>
      </form>
    </ErrorBoundary>
  );
}

// ============================================================================
// 模擬組件（用於示例）
// ============================================================================

function ComponentThatMightError() {
  return <div>正常組件</div>;
}

function AsyncDataComponent() {
  return <div>異步數據</div>;
}

function Header() {
  return <header>Header</header>;
}

function Footer() {
  return <footer>Footer</footer>;
}

function Sidebar() {
  return <aside>Sidebar</aside>;
}

function Content() {
  return <main>Content</main>;
}

function UserProfileData({ userId }: { userId: string }) {
  return <div>用戶 {userId} 的資料</div>;
}

function SalesWidget() {
  return <div>銷售數據</div>;
}

function UsersWidget() {
  return <div>用戶數據</div>;
}

function RevenueWidget() {
  return <div>收入數據</div>;
}
