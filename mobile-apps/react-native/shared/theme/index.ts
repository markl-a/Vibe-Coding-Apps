import { lightColors, darkColors, ColorScheme } from './colors';
import { spacing, Spacing } from './spacing';
import { typography, Typography } from './typography';

export interface Theme {
  colors: ColorScheme;
  spacing: Spacing;
  typography: Typography;
  mode: 'light' | 'dark';
}

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  typography,
  mode: 'light',
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  typography,
  mode: 'dark',
};

export * from './colors';
export * from './spacing';
export * from './typography';
