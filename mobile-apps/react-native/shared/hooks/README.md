# 共享自定义 Hooks 📌

这是一个实用的 React Native 自定义 Hooks 集合，提供常用功能的封装。

## 安装依赖

某些 Hooks 需要额外的依赖：

```bash
# 网络状态监听
npm install @react-native-community/netinfo

# 或
yarn add @react-native-community/netinfo
```

## Hooks 列表

### useDebounce - 防抖 Hook

延迟更新值，常用于搜索输入等场景，避免频繁触发 API 请求。

**参数:**
- `value` (T): 需要防抖的值
- `delay` (number): 延迟时间（毫秒），默认 500

**返回:** 防抖后的值

**使用示例:**

```typescript
import { useState, useEffect } from 'react';
import { useDebounce } from '../shared/hooks';

function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    // 只在用户停止输入 500ms 后才执行搜索
    if (debouncedSearch) {
      searchAPI(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <Input
      value={searchTerm}
      onChangeText={setSearchTerm}
      placeholder="搜索..."
    />
  );
}
```

---

### useToggle - 布尔值切换 Hook

简化布尔状态的管理。

**参数:**
- `initialValue` (boolean): 初始值，默认 false

**返回:** `[value, toggle, setTrue, setFalse]`

**使用示例:**

```typescript
import { useToggle } from '../shared/hooks';

function ModalExample() {
  const [isOpen, toggleOpen, openModal, closeModal] = useToggle(false);

  return (
    <View>
      <Button title="打开 Modal" onPress={openModal} />

      <Modal visible={isOpen}>
        <Button title="关闭" onPress={closeModal} />
        <Button title="切换" onPress={toggleOpen} />
      </Modal>
    </View>
  );
}
```

---

### useKeyboard - 键盘状态监听

监听键盘的显示/隐藏状态和高度。

**返回:** `{ isVisible: boolean, keyboardHeight: number }`

**使用示例:**

```typescript
import { useKeyboard } from '../shared/hooks';

function ChatScreen() {
  const { isVisible, keyboardHeight } = useKeyboard();

  return (
    <View style={{ flex: 1 }}>
      <ScrollView />

      <View
        style={{
          marginBottom: isVisible ? keyboardHeight : 0,
        }}
      >
        <TextInput placeholder="输入消息..." />
      </View>
    </View>
  );
}
```

---

### useAsync - 异步操作处理

简化异步操作的状态管理（loading、data、error）。

**参数:**
- `asyncFunction` (() => Promise<T>): 异步函数
- `immediate` (boolean): 是否立即执行，默认 true

**返回:** `[{ data, loading, error }, execute, reset]`

**使用示例:**

```typescript
import { useAsync } from '../shared/hooks';

function UserProfile({ userId }) {
  const fetchUser = async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  };

  const [{ data, loading, error }, refetch] = useAsync(fetchUser, true);

  if (loading) return <LoadingSpinner />;
  if (error) return <Text>错误: {error.message}</Text>;
  if (!data) return null;

  return (
    <View>
      <Text>{data.name}</Text>
      <Button title="刷新" onPress={refetch} />
    </View>
  );
}
```

---

### usePrevious - 获取上一次的值

获取状态的前一个值，用于比较变化。

**参数:**
- `value` (T): 需要追踪的值

**返回:** 上一次的值

**使用示例:**

```typescript
import { usePrevious } from '../shared/hooks';

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <View>
      <Text>当前: {count}</Text>
      <Text>之前: {prevCount ?? 'N/A'}</Text>
      <Text>
        变化: {prevCount !== undefined ? count - prevCount : 0}
      </Text>
      <Button
        title="增加"
        onPress={() => setCount(count + 1)}
      />
    </View>
  );
}
```

---

### useInterval - 定时器 Hook

使用 setInterval 的 React 友好版本。

**参数:**
- `callback` (() => void): 要执行的回调函数
- `delay` (number | null): 间隔时间（毫秒），null 则暂停

**使用示例:**

```typescript
import { useInterval } from '../shared/hooks';

function Timer() {
  const [count, setCount] = useState(0);
  const [delay, setDelay] = useState(1000);
  const [isRunning, setIsRunning] = useState(true);

  useInterval(
    () => {
      setCount(count + 1);
    },
    isRunning ? delay : null
  );

  return (
    <View>
      <Text style={styles.timer}>{count}</Text>
      <Button
        title={isRunning ? '暂停' : '开始'}
        onPress={() => setIsRunning(!isRunning)}
      />
      <Button
        title="重置"
        onPress={() => setCount(0)}
      />
    </View>
  );
}
```

---

### useOnlineStatus - 网络状态监听

监听网络连接状态。

**依赖:** `@react-native-community/netinfo`

**返回:** `[isOnline: boolean, networkType: string | null]`

**使用示例:**

```typescript
import { useOnlineStatus } from '../shared/hooks';

function App() {
  const [isOnline, networkType] = useOnlineStatus();

  return (
    <View>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            您当前处于离线状态
          </Text>
        </View>
      )}

      <Text>网络类型: {networkType ?? '未知'}</Text>

      <Button
        title="同步数据"
        disabled={!isOnline}
        onPress={syncData}
      />
    </View>
  );
}
```

---

### useAppState - 应用状态监听

监听应用前后台切换。

**参数:**
- `onChange` ((status: AppStateStatus) => void): 状态改变回调（可选）

**返回:** 当前应用状态 ('active' | 'background' | 'inactive')

**使用示例:**

```typescript
import { useAppState } from '../shared/hooks';

function DataScreen() {
  const [data, setData] = useState([]);

  const appState = useAppState((status) => {
    if (status === 'active') {
      // 应用回到前台时刷新数据
      console.log('应用回到前台');
      refreshData();
    } else if (status === 'background') {
      // 应用进入后台时保存数据
      console.log('应用进入后台');
      saveData();
    }
  });

  const refreshData = async () => {
    const newData = await fetchData();
    setData(newData);
  };

  return (
    <View>
      <Text>应用状态: {appState}</Text>
      <FlatList data={data} />
    </View>
  );
}
```

---

## 完整示例

结合多个 Hooks 的实际应用：

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import {
  useDebounce,
  useAsync,
  useOnlineStatus,
  useAppState,
  useToggle,
} from '../shared/hooks';
import { Input, Button, LoadingSpinner, EmptyState } from '../shared/components';

interface Product {
  id: string;
  name: string;
  price: number;
}

function ProductSearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline] = useOnlineStatus();
  const [showFilters, toggleFilters] = useToggle(false);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // 监听应用状态
  useAppState((status) => {
    if (status === 'active') {
      console.log('应用激活，可以刷新数据');
    }
  });

  // 搜索产品
  const searchProducts = async (): Promise<Product[]> => {
    if (!debouncedSearch) return [];

    const response = await fetch(
      `/api/products?q=${debouncedSearch}`
    );
    return response.json();
  };

  const [{ data, loading, error }, refetch] = useAsync(
    searchProducts,
    false
  );

  // 当搜索词改变时执行搜索
  useEffect(() => {
    if (debouncedSearch) {
      refetch();
    }
  }, [debouncedSearch]);

  return (
    <View style={styles.container}>
      {/* 离线提示 */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>离线模式</Text>
        </View>
      )}

      {/* 搜索输入 */}
      <Input
        leftIcon="search-outline"
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="搜索产品..."
      />

      {/* 筛选按钮 */}
      <Button
        title={showFilters ? '隐藏筛选' : '显示筛选'}
        onPress={toggleFilters}
        variant="outline"
      />

      {/* 加载状态 */}
      {loading && <LoadingSpinner text="搜索中..." />}

      {/* 错误状态 */}
      {error && (
        <Text style={styles.error}>错误: {error.message}</Text>
      )}

      {/* 结果列表 */}
      {!loading && data && data.length > 0 && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
          )}
        />
      )}

      {/* 空状态 */}
      {!loading && data && data.length === 0 && debouncedSearch && (
        <EmptyState
          icon="search-outline"
          title="未找到产品"
          description="请尝试其他搜索词"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  offlineBanner: {
    backgroundColor: '#FFA500',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  offlineText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  error: {
    color: '#DC3545',
    textAlign: 'center',
    marginTop: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 16,
    color: '#5B5FFF',
  },
});

export default ProductSearchScreen;
```

## 最佳实践

1. **性能优化**: 使用 `useCallback` 和 `useMemo` 避免不必要的重渲染
2. **清理副作用**: 确保在组件卸载时清理监听器和定时器
3. **错误处理**: 始终处理异步操作中的错误
4. **类型安全**: 使用 TypeScript 泛型确保类型安全
5. **可测试性**: 保持 Hooks 逻辑独立，便于单元测试

## 创建自定义 Hook 的建议

1. **命名**: 以 `use` 开头
2. **职责单一**: 每个 Hook 只做一件事
3. **可复用**: 设计通用的 API
4. **文档完善**: 包含清晰的 JSDoc 注释
5. **示例代码**: 提供实际使用示例

## 未来计划

- [ ] useForm - 表单处理 Hook
- [ ] usePagination - 分页处理 Hook
- [ ] useLocalStorage - 本地存储 Hook (AsyncStorage)
- [ ] useOrientation - 屏幕方向监听 Hook
- [ ] usePermissions - 权限请求 Hook
- [ ] useCamera - 相机功能 Hook
- [ ] useLocation - 位置服务 Hook
- [ ] useBiometrics - 生物识别 Hook

## 贡献

欢迎贡献新的 Hooks 或改进现有 Hooks！
