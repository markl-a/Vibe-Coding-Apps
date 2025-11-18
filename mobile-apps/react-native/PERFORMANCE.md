# React Native 性能优化指南 ⚡

本文档提供 React Native 应用性能优化的最佳实践和技巧。

## 📊 性能优化原则

### 1. 测量优先
在优化之前，先测量性能瓶颈：

```bash
# 启用性能监控
npx react-native start --reset-cache

# 使用 Flipper 进行性能分析
# 安装 Flipper: https://fbflipper.com
```

### 2. 分析工具

- **React DevTools Profiler** - 组件渲染分析
- **Flipper** - 完整的调试和性能工具
- **Reactotron** - React Native 调试工具
- **Performance Monitor** - 内置性能监视器

## 🚀 优化技巧

### 列表优化

#### 使用 FlatList 而不是 ScrollView

```typescript
// ❌ 不好 - 会渲染所有项目
<ScrollView>
  {items.map(item => <Item key={item.id} data={item} />)}
</ScrollView>

// ✅ 好 - 只渲染可见项目
<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  keyExtractor={item => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

#### 优化 FlatList 性能

```typescript
// 使用 React.memo 避免不必要的重渲染
const Item = React.memo(({ data }) => (
  <View style={styles.item}>
    <Text>{data.name}</Text>
  </View>
));

// 提供 getItemLayout 提升滚动性能
const getItemLayout = (data, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
});

<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  getItemLayout={getItemLayout}
  removeClippedSubviews={true}
/>
```

### 组件优化

#### 使用 React.memo

```typescript
// ❌ 每次父组件渲染都会重新渲染
function ExpensiveComponent({ data }) {
  // 复杂计算...
  return <View>{/* ... */}</View>;
}

// ✅ 只在 props 变化时重新渲染
const ExpensiveComponent = React.memo(({ data }) => {
  // 复杂计算...
  return <View>{/* ... */}</View>;
});

// ✅ 自定义比较函数
const ExpensiveComponent = React.memo(
  ({ data }) => {
    return <View>{/* ... */}</View>;
  },
  (prevProps, nextProps) => {
    return prevProps.data.id === nextProps.data.id;
  }
);
```

#### 使用 useMemo 和 useCallback

```typescript
function MyComponent({ items }) {
  // ❌ 每次渲染都重新计算
  const expensiveValue = calculateExpensiveValue(items);

  // ✅ 只在依赖变化时重新计算
  const expensiveValue = useMemo(
    () => calculateExpensiveValue(items),
    [items]
  );

  // ❌ 每次渲染都创建新函数
  const handlePress = () => {
    doSomething(items);
  };

  // ✅ 使用 useCallback 缓存函数
  const handlePress = useCallback(() => {
    doSomething(items);
  }, [items]);

  return <Button onPress={handlePress} />;
}
```

### 图片优化

#### 使用 FastImage

```bash
npm install react-native-fast-image
```

```typescript
import FastImage from 'react-native-fast-image';

// ✅ 使用 FastImage 替代 Image
<FastImage
  style={{ width: 200, height: 200 }}
  source={{
    uri: 'https://example.com/image.jpg',
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

#### 优化图片尺寸

```typescript
// ❌ 加载大图
<Image
  source={{ uri: 'https://example.com/huge-image.jpg' }}
  style={{ width: 100, height: 100 }}
/>

// ✅ 请求适当尺寸的图片
<Image
  source={{ uri: 'https://example.com/image-100x100.jpg' }}
  style={{ width: 100, height: 100 }}
/>
```

### 动画优化

#### 使用 react-native-reanimated

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function AnimatedComponent() {
  const offset = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const handlePress = () => {
    offset.value = withSpring(offset.value + 100);
  };

  return (
    <Animated.View style={[styles.box, animatedStyles]}>
      <Button onPress={handlePress} title="Move" />
    </Animated.View>
  );
}
```

#### 使用 useNativeDriver

```typescript
// ✅ 使用原生驱动
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // 在 UI 线程运行
}).start();

// ❌ 不使用原生驱动
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false, // 在 JS 线程运行，性能较差
}).start();
```

### 状态管理优化

#### 避免不必要的全局状态

```typescript
// ❌ 所有状态都放在全局
const globalState = {
  user: userData,
  theme: themeData,
  temporaryUIState: uiState, // 不应该在全局
};

// ✅ 只有需要共享的状态放在全局
const globalState = {
  user: userData,
  theme: themeData,
};

// 临时 UI 状态放在组件内部
function Component() {
  const [isOpen, setIsOpen] = useState(false);
}
```

#### 使用选择器避免不必要的渲染

```typescript
// Zustand 示例
const useStore = create((set) => ({
  user: { name: 'John', age: 30 },
  theme: 'dark',
  setUser: (user) => set({ user }),
}));

// ❌ 订阅整个 store
function Component() {
  const store = useStore();
  return <Text>{store.user.name}</Text>;
}

// ✅ 只订阅需要的数据
function Component() {
  const userName = useStore((state) => state.user.name);
  return <Text>{userName}</Text>;
}
```

### 网络请求优化

#### 使用请求缓存

```typescript
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 分钟缓存
    cacheTime: 10 * 60 * 1000, // 10 分钟后清除
  });

  if (isLoading) return <LoadingSpinner />;
  return <UserData data={data} />;
}
```

#### 批量请求

```typescript
// ❌ 多个单独请求
const user = await fetchUser(userId);
const posts = await fetchPosts(userId);
const comments = await fetchComments(userId);

// ✅ 批量请求
const [user, posts, comments] = await Promise.all([
  fetchUser(userId),
  fetchPosts(userId),
  fetchComments(userId),
]);
```

### Bundle 大小优化

#### 代码分割

```typescript
// 使用动态导入
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

#### 分析 Bundle 大小

```bash
# 生成 bundle 分析报告
npx react-native-bundle-visualizer
```

#### 移除未使用的代码

```bash
# 启用 Hermes 引擎（默认启用）
# android/app/build.gradle
project.ext.react = [
    enableHermes: true
]

# 启用 ProGuard（Android）
def enableProguardInReleaseBuilds = true
```

## 🎯 最佳实践

### 1. 避免内联函数和对象

```typescript
// ❌ 每次渲染都创建新对象和函数
<Component
  style={{ margin: 10 }}
  onPress={() => doSomething()}
/>

// ✅ 使用 StyleSheet 和 useCallback
const styles = StyleSheet.create({
  container: { margin: 10 },
});

const handlePress = useCallback(() => {
  doSomething();
}, []);

<Component style={styles.container} onPress={handlePress} />
```

### 2. 优化条件渲染

```typescript
// ❌ 总是渲染组件
{isVisible && <ExpensiveComponent />}
{!isVisible && <View />}

// ✅ 只在需要时渲染
{isVisible ? <ExpensiveComponent /> : null}

// ✅ 使用显示/隐藏而不是挂载/卸载（如果组件初始化昂贵）
<View style={{ display: isVisible ? 'flex' : 'none' }}>
  <ExpensiveComponent />
</View>
```

### 3. 使用键值优化列表

```typescript
// ❌ 使用索引作为 key
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// ✅ 使用稳定的唯一 ID
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

### 4. 延迟加载非关键组件

```typescript
function Screen() {
  const [showHeavyComponent, setShowHeavyComponent] = useState(false);

  useEffect(() => {
    // 页面加载后再加载重组件
    const timer = setTimeout(() => {
      setShowHeavyComponent(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View>
      <CriticalContent />
      {showHeavyComponent && <HeavyComponent />}
    </View>
  );
}
```

### 5. 使用 InteractionManager

```typescript
import { InteractionManager } from 'react-native';

function Screen() {
  useEffect(() => {
    // 等待动画完成后执行
    InteractionManager.runAfterInteractions(() => {
      // 执行复杂操作
      loadHeavyData();
    });
  }, []);
}
```

## 📈 性能监控

### 启用性能监控

```typescript
// App.tsx
if (__DEV__) {
  require('react-native-performance');
}

// 监控屏幕加载时间
import { performance } from 'react-native-performance';

function Screen() {
  useEffect(() => {
    const mark = performance.mark('screen-mount');

    return () => {
      performance.measure('screen-duration', mark);
    };
  }, []);
}
```

### 使用 Flipper

1. 安装 Flipper: https://fbflipper.com
2. 启用 React DevTools 插件
3. 使用 Performance 插件分析性能

## 🔍 常见性能问题

### 1. 频繁的重渲染

**问题**: 组件频繁重渲染

**解决**:
- 使用 `React.memo`
- 使用 `useMemo` 和 `useCallback`
- 检查是否有不必要的状态更新

### 2. 列表滚动卡顿

**问题**: 长列表滚动不流畅

**解决**:
- 使用 `FlatList` 而不是 `ScrollView`
- 提供 `getItemLayout`
- 启用 `removeClippedSubviews`
- 减少 `Item` 组件复杂度

### 3. 图片加载慢

**问题**: 图片加载影响性能

**解决**:
- 使用 `react-native-fast-image`
- 预加载关键图片
- 使用适当尺寸的图片
- 实现图片懒加载

### 4. 动画卡顿

**问题**: 动画不流畅

**解决**:
- 使用 `react-native-reanimated`
- 启用 `useNativeDriver`
- 避免在动画期间更新状态

## 📝 性能检查清单

- [ ] 使用 FlatList 渲染长列表
- [ ] 为 FlatList 提供 getItemLayout
- [ ] 使用 React.memo 包装纯组件
- [ ] 使用 useMemo 缓存计算结果
- [ ] 使用 useCallback 缓存函数
- [ ] 使用 FastImage 替代 Image
- [ ] 优化图片尺寸
- [ ] 动画使用 useNativeDriver
- [ ] 避免内联函数和对象
- [ ] 使用稳定的 key
- [ ] 实现代码分割
- [ ] 启用 Hermes 引擎
- [ ] 移除 console.log
- [ ] 使用生产模式构建

## 工具推荐

- **Flipper** - 调试和性能分析
- **React DevTools** - 组件分析
- **Why Did You Render** - 查找不必要的渲染
- **Bundle Visualizer** - 分析 bundle 大小
- **React Native Performance** - 性能监控

## 参考资源

- [React Native 性能官方文档](https://reactnative.dev/docs/performance)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Query 文档](https://tanstack.com/query)

---

**记住**: 过早优化是万恶之源。先测量，再优化！
