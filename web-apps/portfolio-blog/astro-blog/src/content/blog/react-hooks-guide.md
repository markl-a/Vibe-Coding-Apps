---
title: 'React Hooks 完整指南：從基礎到進階'
description: '深入淺出講解 React Hooks 的使用方式，包括 useState、useEffect、自訂 Hooks 等核心概念與實戰技巧。'
pubDate: 2025-11-05
author: '技術部落格'
tags: ['React', 'JavaScript', 'Hooks']
---

## React Hooks 簡介

React Hooks 在 React 16.8 引入，讓我們能在函式組件中使用 state 和其他 React 特性，不再需要 class 組件。

## 常用 Hooks

### 1. useState - 狀態管理

最基本的 Hook，用於在函式組件中新增 state：

```javascript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>計數：{count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}
```

**重點提示：**
- State 更新是非同步的
- 使用函式更新可以避免閉包問題：`setCount(prev => prev + 1)`

### 2. useEffect - 副作用處理

處理副作用（API 呼叫、訂閱、手動 DOM 操作等）：

```javascript
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 副作用：獲取用戶資料
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));

    // 清理函式（可選）
    return () => {
      console.log('組件卸載或 userId 改變');
    };
  }, [userId]); // 依賴陣列

  if (!user) return <div>載入中...</div>;

  return <div>{user.name}</div>;
}
```

**依賴陣列的三種情況：**

1. `[]` - 只在掛載時執行一次
2. `[dep1, dep2]` - 當依賴改變時執行
3. 無依賴陣列 - 每次渲染都執行（通常不建議）

### 3. useContext - 跨組件共享資料

避免 props drilling 的問題：

```javascript
import { createContext, useContext } from 'react';

const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return <ThemedButton />;
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>按鈕</button>;
}
```

### 4. useRef - 引用 DOM 或保存值

兩個主要用途：

**1. 引用 DOM 元素：**

```javascript
function TextInput() {
  const inputRef = useRef(null);

  const focusInput = () => {
    inputRef.current.focus();
  };

  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>聚焦輸入框</button>
    </>
  );
}
```

**2. 保存可變值（不觸發重新渲染）：**

```javascript
function Timer() {
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      console.log('Tick');
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);
}
```

### 5. useMemo & useCallback - 效能優化

**useMemo** - 記憶計算結果：

```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

**useCallback** - 記憶函式：

```javascript
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

## 自訂 Hooks

建立可重用的邏輯：

```javascript
// useLocalStorage.js
import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// 使用
function App() {
  const [name, setName] = useLocalStorage('name', 'Guest');

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  );
}
```

## Hooks 使用規則

### 1. 只在頂層呼叫

❌ 錯誤：

```javascript
if (condition) {
  const [state, setState] = useState(0); // 錯誤！
}
```

✅ 正確：

```javascript
const [state, setState] = useState(0);

if (condition) {
  // 使用 state
}
```

### 2. 只在 React 函式中呼叫

- ✅ React 函式組件
- ✅ 自訂 Hooks
- ❌ 普通 JavaScript 函式

## 最佳實踐

### 1. 合理拆分 state

```javascript
// ❌ 不好
const [state, setState] = useState({
  name: '',
  email: '',
  age: 0
});

// ✅ 更好
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);
```

### 2. 提取自訂 Hooks

當邏輯可重用時，提取成自訂 Hook：

```javascript
// useFetch.js
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

### 3. 避免過度優化

不要過早使用 `useMemo` 和 `useCallback`。只在確實有效能問題時才使用。

## 總結

React Hooks 提供了：

- 更簡潔的程式碼
- 更好的邏輯重用
- 更容易測試
- 更好的 TypeScript 支援

掌握 Hooks 是現代 React 開發的必備技能！

## 延伸閱讀

- [React 官方文檔 - Hooks](https://react.dev/reference/react)
- [useHooks - 實用 Hooks 集合](https://usehooks.com/)
