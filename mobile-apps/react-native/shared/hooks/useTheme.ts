import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../theme';

type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = '@app_theme_mode';

/**
 * useTheme - 主题管理 Hook
 * 支持亮色、暗色和自动模式
 *
 * @returns [当前主题, 主题模式, 切换主题函数]
 *
 * @example
 * const [theme, themeMode, setThemeMode] = useTheme();
 *
 * // 使用主题颜色
 * <View style={{ backgroundColor: theme.colors.background }}>
 *   <Text style={{ color: theme.colors.text }}>Hello</Text>
 * </View>
 *
 * // 切换主题
 * <Button onPress={() => setThemeMode('dark')} />
 */
export function useTheme(): [
  Theme,
  ThemeMode,
  (mode: ThemeMode) => Promise<void>
] {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

  // 初始化时加载保存的主题设置
  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        setThemeModeState(saved as ThemeMode);
      }
    } catch (error) {
      console.error('加载主题设置失败:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('保存主题设置失败:', error);
    }
  };

  // 确定实际使用的主题
  const getActualTheme = (): Theme => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  };

  return [getActualTheme(), themeMode, setThemeMode];
}
