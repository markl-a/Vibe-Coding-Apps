/**
 * 字体排版系统
 */

export const typography = {
  // 字体大小
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // 字重
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // 行高
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // 字体家族（可根据平台自定义）
  fontFamily: {
    regular: undefined, // 使用系统默认字体
    medium: undefined,
    bold: undefined,
  },
};

export type Typography = typeof typography;
