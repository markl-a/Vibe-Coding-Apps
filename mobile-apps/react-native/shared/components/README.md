# 共享 UI 组件库 🎨

这是一个跨应用共用的 React Native UI 组件库，提供一致的设计和用户体验。

## 安装

这些组件使用了以下依赖：

```bash
npm install @expo/vector-icons
# 或
yarn add @expo/vector-icons
```

## 组件列表

### Button - 按钮组件

功能强大的按钮组件，支持多种样式和状态。

**Props:**
- `title` (string, required): 按钮文字
- `onPress` (function, required): 点击回调
- `variant` ('primary' | 'secondary' | 'outline' | 'danger'): 按钮样式
- `size` ('small' | 'medium' | 'large'): 按钮大小
- `disabled` (boolean): 是否禁用
- `loading` (boolean): 是否显示加载状态
- `style` (ViewStyle): 自定义容器样式
- `textStyle` (TextStyle): 自定义文字样式

**使用示例:**

```typescript
import { Button } from '../shared/components';

// 基础用法
<Button title="点击我" onPress={() => console.log('Clicked!')} />

// 不同样式
<Button title="主要按钮" variant="primary" onPress={handlePrimary} />
<Button title="次要按钮" variant="secondary" onPress={handleSecondary} />
<Button title="轮廓按钮" variant="outline" onPress={handleOutline} />
<Button title="危险按钮" variant="danger" onPress={handleDanger} />

// 不同大小
<Button title="小按钮" size="small" onPress={handleClick} />
<Button title="中按钮" size="medium" onPress={handleClick} />
<Button title="大按钮" size="large" onPress={handleClick} />

// 加载状态
<Button title="提交" loading={isLoading} onPress={handleSubmit} />

// 禁用状态
<Button title="禁用" disabled onPress={handleClick} />
```

---

### Card - 卡片组件

灵活的卡片容器，支持阴影和点击事件。

**Props:**
- `children` (ReactNode, required): 卡片内容
- `style` (ViewStyle): 自定义样式
- `onPress` (function): 点击回调（可选）
- `elevation` (number): 阴影深度 (0-5)

**使用示例:**

```typescript
import { Card } from '../shared/components';

// 基础用法
<Card>
  <Text>卡片内容</Text>
</Card>

// 可点击的卡片
<Card onPress={() => navigation.navigate('Details')}>
  <Text>点击查看详情</Text>
</Card>

// 自定义阴影
<Card elevation={4}>
  <Text>更深的阴影</Text>
</Card>
```

---

### Input - 输入框组件

功能完整的输入框，支持标签、错误提示和图标。

**Props:**
- 所有 `TextInput` 的 props
- `label` (string): 输入框标签
- `error` (string): 错误提示文字
- `leftIcon` (IconName): 左侧图标
- `rightIcon` (IconName): 右侧图标
- `onRightIconPress` (function): 右侧图标点击回调
- `containerStyle` (ViewStyle): 容器样式

**使用示例:**

```typescript
import { Input } from '../shared/components';
import { useState } from 'react';

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [showPassword, setShowPassword] = useState(false);

// 基础用法
<Input
  label="邮箱"
  value={email}
  onChangeText={setEmail}
  placeholder="请输入邮箱"
/>

// 带图标
<Input
  label="用户名"
  leftIcon="person-outline"
  value={username}
  onChangeText={setUsername}
/>

// 密码输入（带显示/隐藏）
<Input
  label="密码"
  leftIcon="lock-closed-outline"
  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
  onRightIconPress={() => setShowPassword(!showPassword)}
  secureTextEntry={!showPassword}
  value={password}
  onChangeText={setPassword}
/>

// 错误状态
<Input
  label="手机号"
  value={phone}
  onChangeText={setPhone}
  error="请输入有效的手机号码"
/>
```

---

### LoadingSpinner - 加载指示器

显示加载状态的组件。

**Props:**
- `size` ('small' | 'large'): 指示器大小
- `color` (string): 颜色
- `text` (string): 加载文字
- `fullScreen` (boolean): 是否全屏显示
- `style` (ViewStyle): 自定义样式

**使用示例:**

```typescript
import { LoadingSpinner } from '../shared/components';

// 基础用法
<LoadingSpinner />

// 带文字
<LoadingSpinner text="加载中..." />

// 全屏加载
<LoadingSpinner fullScreen text="正在加载数据..." />

// 自定义颜色和大小
<LoadingSpinner size="small" color="#FF6B6B" />
```

---

### EmptyState - 空状态组件

显示空状态和操作提示。

**Props:**
- `icon` (IconName): 图标名称
- `title` (string, required): 标题
- `description` (string): 描述文字
- `actionText` (string): 操作按钮文字
- `onAction` (function): 操作按钮回调
- `style` (ViewStyle): 自定义样式

**使用示例:**

```typescript
import { EmptyState } from '../shared/components';

// 基础用法
<EmptyState
  title="暂无数据"
  description="目前还没有任何内容"
/>

// 带操作按钮
<EmptyState
  icon="cart-outline"
  title="购物车是空的"
  description="快去添加一些商品吧"
  actionText="去购物"
  onAction={() => navigation.navigate('Shop')}
/>

// 自定义图标
<EmptyState
  icon="search-outline"
  title="未找到结果"
  description="请尝试其他搜索词"
/>
```

---

## 完整示例

```typescript
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  Card,
  Input,
  LoadingSpinner,
  EmptyState,
} from '../shared/components';

export default function ComponentShowcase() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setHasData(true);
    }, 2000);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="处理中..." />;
  }

  if (!hasData) {
    return (
      <EmptyState
        icon="cloud-upload-outline"
        title="开始使用"
        description="输入您的邮箱开始体验"
        actionText="了解更多"
        onAction={() => console.log('Learn more')}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Input
          label="邮箱地址"
          leftIcon="mail-outline"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
        />

        <Button
          title="提交"
          onPress={handleSubmit}
          variant="primary"
          size="large"
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
  },
});
```

## 设计规范

### 颜色
- Primary: `#5B5FFF`
- Secondary: `#6C757D`
- Danger: `#DC3545`
- Background: `#F5F5F5`
- Text: `#333333`
- Text Secondary: `#666666`
- Border: `#E0E0E0`

### 间距
- Small: 8px
- Medium: 16px
- Large: 24px
- XLarge: 32px

### 圆角
- Small: 4px
- Medium: 8px
- Large: 12px

### 阴影
- Elevation 2: 默认卡片阴影
- Elevation 4: 悬浮元素
- Elevation 8: Modal 对话框

## 最佳实践

1. **保持一致性**: 在整个应用中使用相同的组件
2. **类型安全**: 充分利用 TypeScript 类型检查
3. **可访问性**: 添加适当的 `accessibilityLabel`
4. **性能**: 使用 `React.memo` 优化不必要的重渲染
5. **主题化**: 考虑添加主题切换支持

## 未来计划

- [ ] 添加 Avatar 组件
- [ ] 添加 Badge 组件
- [ ] 添加 Modal 组件
- [ ] 添加 Toast 通知组件
- [ ] 添加 BottomSheet 组件
- [ ] 添加主题系统
- [ ] 添加动画效果
- [ ] 添加深色模式支持

## 贡献

欢迎贡献新组件或改进现有组件！
