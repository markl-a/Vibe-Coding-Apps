/**
 * 颜色主题配置
 * 支持亮色和暗色模式
 */

export const lightColors = {
  // 主色调
  primary: '#5B5FFF',
  primaryLight: '#8E92FF',
  primaryDark: '#3D42CC',

  // 辅助色
  secondary: '#6C757D',
  success: '#28A745',
  warning: '#FFC107',
  danger: '#DC3545',
  info: '#17A2B8',

  // 背景色
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  backgroundTertiary: '#E9ECEF',

  // 文字颜色
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textDisabled: '#CCCCCC',

  // 边框颜色
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  borderDark: '#CCCCCC',

  // 卡片颜色
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',

  // 输入框
  input: '#F5F5F5',
  inputBorder: '#E0E0E0',
  inputFocus: '#5B5FFF',

  // 状态颜色
  active: '#5B5FFF',
  inactive: '#999999',
  disabled: '#E0E0E0',

  // 特殊颜色
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBackground: '#FFFFFF',
  divider: '#E0E0E0',
};

export const darkColors = {
  // 主色调（暗色模式下稍微调亮）
  primary: '#7B7FFF',
  primaryLight: '#9FA3FF',
  primaryDark: '#5B5FFF',

  // 辅助色（调整为适合暗背景）
  secondary: '#8E9298',
  success: '#34D058',
  warning: '#FFD966',
  danger: '#F85149',
  info: '#58A6FF',

  // 背景色（深色系）
  background: '#0D1117',
  backgroundSecondary: '#161B22',
  backgroundTertiary: '#21262D',

  // 文字颜色（调整为适合深色背景）
  text: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textDisabled: '#484F58',

  // 边框颜色
  border: '#30363D',
  borderLight: '#21262D',
  borderDark: '#484F58',

  // 卡片颜色
  card: '#161B22',
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  // 输入框
  input: '#0D1117',
  inputBorder: '#30363D',
  inputFocus: '#7B7FFF',

  // 状态颜色
  active: '#7B7FFF',
  inactive: '#6E7681',
  disabled: '#30363D',

  // 特殊颜色
  overlay: 'rgba(0, 0, 0, 0.7)',
  modalBackground: '#161B22',
  divider: '#30363D',
};

export type ColorScheme = typeof lightColors;
