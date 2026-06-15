import { useColorScheme } from 'react-native';

// ---- Palette ---------------------------------------------------------------

export const palette = {
  // Vivid Orange — approved accent color
  orange: '#F55B00',
  orangeDark: '#FF7933',

  white: '#FFFFFF',
  black: '#000000',

  // Neutral scale (light → dark)
  gray50:  '#F8F8F8',
  gray100: '#F0F0F0',
  gray200: '#E5E5E5',
  gray300: '#CCCCCC',
  gray400: '#AAAAAA',
  gray500: '#888888',
  gray600: '#666666',
  gray700: '#444444',
  gray800: '#2A2A2A',
  gray900: '#1A1A1A',

  green: '#34C759',
  red:   '#FF3B30',
} as const;

// ---- Semantic color tokens -------------------------------------------------

export interface ThemeColors {
  accent:        string;
  background:    string;
  surface:       string;
  border:        string;
  textPrimary:   string;
  textSecondary: string;
  textMuted:     string;
  sectionBg:     string;
  success:       string;
  error:         string;
}

const light: ThemeColors = {
  accent:        palette.orange,
  background:    palette.gray50,
  surface:       palette.white,
  border:        palette.gray200,
  textPrimary:   palette.gray900,
  textSecondary: palette.gray600,
  textMuted:     palette.gray400,
  sectionBg:     palette.gray100,
  success:       palette.green,
  error:         palette.red,
};

const dark: ThemeColors = {
  accent:        palette.orangeDark,
  background:    '#121212',
  surface:       '#1E1E1E',
  border:        '#333333',
  textPrimary:   '#F0F0F0',
  textSecondary: '#AAAAAA',
  textMuted:     '#666666',
  sectionBg:     '#2A2A2A',
  success:       palette.green,
  error:         palette.red,
};

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

// ---- Spacing ---------------------------------------------------------------

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
} as const;

// ---- Typography scale ------------------------------------------------------

export const fontSize = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    20,
  xl:    24,
  xxl:   32,
  jumbo: 40,
} as const;

// ---- Border radius ---------------------------------------------------------

export const radius = {
  sm:   6,
  md:   10,
  lg:   16,
  full: 9999,
} as const;
