# 主题系统 🎨

完整的主题系统，支持亮色模式、暗色模式和自动切换。

## 功能特点

- 🌞 亮色模式
- 🌙 暗色模式
- 🔄 自动跟随系统
- 💾 主题偏好持久化
- 🎯 TypeScript 类型支持
- 🎨 一致的设计系统

## 安装

主题系统需要以下依赖：

```bash
npm install @react-native-async-storage/async-storage
# 或
yarn add @react-native-async-storage/async-storage
```

## 快速开始

### 1. 在应用根部添加 ThemeProvider

```typescript
import React from 'react';
import { ThemeProvider } from './shared/context/ThemeContext';
import App from './App';

export default function Root() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}
```

### 2. 在组件中使用主题

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './shared/context/ThemeContext';

function MyComponent() {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.text }}>
        当前模式: {isDark ? '暗色' : '亮色'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

### 3. 添加主题切换

```typescript
import { ThemeToggle } from './shared/components/ThemeToggle';

function SettingsScreen() {
  return (
    <View>
      <Text>主题设置</Text>
      <ThemeToggle mode="buttons" />
    </View>
  );
}
```

## API 参考

### ThemeProvider

根级组件，为应用提供主题上下文。

```typescript
<ThemeProvider>
  <App />
</ThemeProvider>
```

### useTheme Hook

在组件中访问主题。

```typescript
const { theme, themeMode, setThemeMode, isDark } = useTheme();
```

**返回值:**
- `theme`: 当前主题对象
- `themeMode`: 主题模式 ('light' | 'dark' | 'auto')
- `setThemeMode`: 切换主题函数
- `isDark`: 是否为暗色模式（布尔值）

### ThemeToggle 组件

主题切换控件，支持多种显示模式。

**Props:**
- `mode`: 显示模式
  - `'icons'`: 图标模式（适合导航栏）
  - `'buttons'`: 按钮模式（适合设置页面）
  - `'segment'`: 分段控制（适合内联显示）

**示例:**

```typescript
// 图标模式
<ThemeToggle mode="icons" />

// 按钮模式（默认）
<ThemeToggle mode="buttons" />

// 分段控制
<ThemeToggle mode="segment" />
```

## 主题结构

### 颜色（Colors）

```typescript
const { theme } = useTheme();

// 主色调
theme.colors.primary
theme.colors.primaryLight
theme.colors.primaryDark

// 辅助色
theme.colors.secondary
theme.colors.success
theme.colors.warning
theme.colors.danger
theme.colors.info

// 背景色
theme.colors.background
theme.colors.backgroundSecondary
theme.colors.backgroundTertiary

// 文字颜色
theme.colors.text
theme.colors.textSecondary
theme.colors.textTertiary
theme.colors.textDisabled

// 边框颜色
theme.colors.border
theme.colors.borderLight
theme.colors.borderDark

// 其他
theme.colors.card
theme.colors.input
theme.colors.divider
```

### 间距（Spacing）

```typescript
const { theme } = useTheme();

theme.spacing.xs   // 4px
theme.spacing.sm   // 8px
theme.spacing.md   // 16px
theme.spacing.lg   // 24px
theme.spacing.xl   // 32px
theme.spacing.xxl  // 48px
theme.spacing.xxxl // 64px
```

### 排版（Typography）

```typescript
const { theme } = useTheme();

// 字体大小
theme.typography.fontSize.xs    // 11
theme.typography.fontSize.sm    // 13
theme.typography.fontSize.md    // 15
theme.typography.fontSize.lg    // 17
theme.typography.fontSize.xl    // 20
theme.typography.fontSize.xxl   // 24
theme.typography.fontSize.xxxl  // 32

// 字重
theme.typography.fontWeight.light     // 300
theme.typography.fontWeight.regular   // 400
theme.typography.fontWeight.medium    // 500
theme.typography.fontWeight.semibold  // 600
theme.typography.fontWeight.bold      // 700

// 行高
theme.typography.lineHeight.tight    // 1.2
theme.typography.lineHeight.normal   // 1.5
theme.typography.lineHeight.relaxed  // 1.75
```

## 完整示例

### 基础使用

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './shared/context/ThemeContext';

function ProductCard({ product }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
          },
        ]}
      >
        {product.name}
      </Text>

      <Text
        style={[
          styles.price,
          {
            color: theme.colors.primary,
            fontSize: theme.typography.fontSize.xl,
          },
        ]}
      >
        ${product.price}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
  },
  price: {
    fontWeight: 'bold',
  },
});
```

### 设置页面示例

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from './shared/context/ThemeContext';
import { ThemeToggle } from './shared/components/ThemeToggle';

function SettingsScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View
        style={[
          styles.section,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
            },
          ]}
        >
          外观设置
        </Text>

        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          主题模式
        </Text>

        <ThemeToggle mode="buttons" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
```

### 响应式主题组件

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './shared/context/ThemeContext';

function ThemedButton({ title, onPress, variant = 'primary' }) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'danger':
        return theme.colors.danger;
      default:
        return theme.colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          padding: theme.spacing.md,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.semibold,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
  },
});
```

## 最佳实践

1. **始终使用主题颜色**
   ```typescript
   // ✅ 好的做法
   backgroundColor: theme.colors.background

   // ❌ 避免硬编码
   backgroundColor: '#FFFFFF'
   ```

2. **使用间距系统**
   ```typescript
   // ✅ 好的做法
   padding: theme.spacing.md

   // ❌ 避免任意值
   padding: 16
   ```

3. **使用排版系统**
   ```typescript
   // ✅ 好的做法
   fontSize: theme.typography.fontSize.lg

   // ❌ 避免任意值
   fontSize: 17
   ```

4. **分离样式和主题**
   ```typescript
   // ✅ 好的做法 - 静态样式分离
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       padding: 16,
     },
   });

   // 动态主题样式内联
   <View style={[styles.container, { backgroundColor: theme.colors.background }]} />
   ```

## 自定义主题

### 扩展颜色

在 `shared/theme/colors.ts` 中添加自定义颜色：

```typescript
export const lightColors = {
  // ... 现有颜色
  custom: '#FF6B6B',
  customLight: '#FF8E8E',
};

export const darkColors = {
  // ... 现有颜色
  custom: '#FF7B7B',
  customLight: '#FF9E9E',
};
```

### 自定义字体

在 `shared/theme/typography.ts` 中配置：

```typescript
export const typography = {
  // ...
  fontFamily: {
    regular: 'YourFont-Regular',
    medium: 'YourFont-Medium',
    bold: 'YourFont-Bold',
  },
};
```

## 故障排查

### 主题未生效

确保应用被 `ThemeProvider` 包裹：

```typescript
// App.tsx
export default function App() {
  return (
    <ThemeProvider>
      {/* 你的应用 */}
    </ThemeProvider>
  );
}
```

### 主题不持久

检查 AsyncStorage 权限和配置。

### TypeScript 错误

确保导入正确的类型：

```typescript
import { Theme } from './shared/theme';
```

## 许可证

MIT License
