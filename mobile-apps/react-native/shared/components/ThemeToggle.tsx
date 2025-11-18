import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type DisplayMode = 'icons' | 'buttons' | 'segment';

interface ThemeToggleProps {
  mode?: DisplayMode;
}

/**
 * ThemeToggle - 主题切换组件
 * 支持多种显示模式
 *
 * @example
 * // 图标模式（适合导航栏）
 * <ThemeToggle mode="icons" />
 *
 * // 按钮模式（适合设置页面）
 * <ThemeToggle mode="buttons" />
 *
 * // 分段控制模式（适合内联显示）
 * <ThemeToggle mode="segment" />
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  mode = 'icons',
}) => {
  const { theme, themeMode, setThemeMode } = useTheme();

  if (mode === 'icons') {
    return (
      <View style={styles.iconsContainer}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            themeMode === 'light' && [
              styles.iconButtonActive,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setThemeMode('light')}
        >
          <Ionicons
            name="sunny"
            size={20}
            color={
              themeMode === 'light'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.iconButton,
            themeMode === 'auto' && [
              styles.iconButtonActive,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setThemeMode('auto')}
        >
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={
              themeMode === 'auto'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.iconButton,
            themeMode === 'dark' && [
              styles.iconButtonActive,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setThemeMode('dark')}
        >
          <Ionicons
            name="moon"
            size={20}
            color={
              themeMode === 'dark'
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'buttons') {
    return (
      <View style={styles.buttonsContainer}>
        {[
          { mode: 'light' as const, icon: 'sunny', label: '亮色' },
          { mode: 'auto' as const, icon: 'phone-portrait-outline', label: '跟随系统' },
          { mode: 'dark' as const, icon: 'moon', label: '暗色' },
        ].map(({ mode: m, icon, label }) => (
          <TouchableOpacity
            key={m}
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
              themeMode === m && {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
              },
            ]}
            onPress={() => setThemeMode(m)}
          >
            <Ionicons
              name={icon as any}
              size={24}
              color={
                themeMode === m
                  ? '#FFFFFF'
                  : theme.colors.text
              }
            />
            <Text
              style={[
                styles.buttonText,
                { color: theme.colors.text },
                themeMode === m && styles.buttonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // segment mode
  return (
    <View
      style={[
        styles.segmentContainer,
        {
          backgroundColor: theme.colors.backgroundSecondary,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {[
        { mode: 'light' as const, icon: 'sunny' },
        { mode: 'auto' as const, icon: 'phone-portrait-outline' },
        { mode: 'dark' as const, icon: 'moon' },
      ].map(({ mode: m, icon }) => (
        <TouchableOpacity
          key={m}
          style={[
            styles.segmentButton,
            themeMode === m && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setThemeMode(m)}
        >
          <Ionicons
            name={icon as any}
            size={18}
            color={
              themeMode === m
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  iconsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconButtonActive: {
    // backgroundColor will be set dynamically
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
