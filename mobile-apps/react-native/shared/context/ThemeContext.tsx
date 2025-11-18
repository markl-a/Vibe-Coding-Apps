import React, { createContext, useContext, ReactNode } from 'react';
import { Theme } from '../theme';
import { useTheme as useThemeHook } from '../hooks/useTheme';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider - 主题上下文提供者
 * 在应用根部使用，为整个应用提供主题支持
 *
 * @example
 * import { ThemeProvider } from './shared/context/ThemeContext';
 *
 * export default function App() {
 *   return (
 *     <ThemeProvider>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, themeMode, setThemeMode] = useThemeHook();
  const isDark = theme.mode === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme - 在组件中使用主题
 *
 * @example
 * import { useTheme } from './shared/context/ThemeContext';
 *
 * function MyComponent() {
 *   const { theme, isDark, setThemeMode } = useTheme();
 *
 *   return (
 *     <View style={{ backgroundColor: theme.colors.background }}>
 *       <Text style={{ color: theme.colors.text }}>
 *         当前模式: {isDark ? '暗色' : '亮色'}
 *       </Text>
 *       <Button onPress={() => setThemeMode('dark')} />
 *     </View>
 *   );
 * }
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用');
  }
  return context;
};
