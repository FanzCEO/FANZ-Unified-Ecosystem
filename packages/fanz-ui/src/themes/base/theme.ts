/**
 * 🎨 Base Theme System
 * 
 * Core theme utilities and design token definitions for the FANZ ecosystem
 * Provides foundation for cluster-specific themes with consistent structure
 */

import { z } from 'zod';

// ===== DESIGN TOKEN SCHEMAS =====

export const ColorScaleSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(), // Base color
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
  950: z.string(),
});

export const SemanticColorsSchema = z.object({
  success: z.string(),
  warning: z.string(),
  error: z.string(),
  info: z.string(),
});

export const SurfaceColorsSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  muted: z.string(),
  accent: z.string(),
  border: z.string(),
  input: z.string(),
  ring: z.string(),
});

export const TypographySchema = z.object({
  fontFamily: z.object({
    sans: z.array(z.string()),
    mono: z.array(z.string()),
    display: z.array(z.string()),
  }),
  fontSize: z.object({
    xs: z.string(),
    sm: z.string(),
    base: z.string(),
    lg: z.string(),
    xl: z.string(),
    '2xl': z.string(),
    '3xl': z.string(),
    '4xl': z.string(),
    '5xl': z.string(),
  }),
  fontWeight: z.object({
    light: z.number(),
    normal: z.number(),
    medium: z.number(),
    semibold: z.number(),
    bold: z.number(),
  }),
  lineHeight: z.object({
    tight: z.number(),
    normal: z.number(),
    relaxed: z.number(),
  }),
  letterSpacing: z.object({
    tight: z.string(),
    normal: z.string(),
    wide: z.string(),
  }),
});

export const SpacingSchema = z.object({
  px: z.string(),
  0: z.string(),
  1: z.string(),
  2: z.string(),
  3: z.string(),
  4: z.string(),
  5: z.string(),
  6: z.string(),
  8: z.string(),
  10: z.string(),
  12: z.string(),
  16: z.string(),
  20: z.string(),
  24: z.string(),
  32: z.string(),
  40: z.string(),
  48: z.string(),
  56: z.string(),
  64: z.string(),
});

export const AnimationSchema = z.object({
  duration: z.object({
    fast: z.string(),
    normal: z.string(),
    slow: z.string(),
  }),
  easing: z.object({
    linear: z.string(),
    easeIn: z.string(),
    easeOut: z.string(),
    easeInOut: z.string(),
    bounce: z.string(),
  }),
  keyframes: z.record(z.string()),
});

export const BorderRadiusSchema = z.object({
  none: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  full: z.string(),
});

export const ShadowSchema = z.object({
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
  '2xl': z.string(),
  inner: z.string(),
  neon: z.string(),
  neonHover: z.string(),
});

// ===== MAIN THEME SCHEMA =====

export const ThemeSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  cluster: z.enum([
    'fanzlab',
    'boyfanz', 
    'girlfanz',
    'daddyfanz',
    'pupfanz',
    'taboofanz',
    'transfanz',
    'cougarfanz',
    'fanzcock',
  ]),
  colors: z.object({
    primary: ColorScaleSchema,
    secondary: ColorScaleSchema,
    accent: ColorScaleSchema,
    semantic: SemanticColorsSchema,
    surface: SurfaceColorsSchema,
    destructive: ColorScaleSchema,
    muted: ColorScaleSchema,
    popover: SurfaceColorsSchema,
    card: SurfaceColorsSchema,
  }),
  typography: TypographySchema,
  spacing: SpacingSchema,
  borderRadius: BorderRadiusSchema,
  shadows: ShadowSchema,
  animation: AnimationSchema,
  breakpoints: z.object({
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
    '2xl': z.string(),
  }),
  zIndex: z.object({
    dropdown: z.number(),
    sticky: z.number(),
    fixed: z.number(),
    overlay: z.number(),
    modal: z.number(),
    popover: z.number(),
    tooltip: z.number(),
  }),
});

// ===== TYPE DEFINITIONS =====

export type ColorScale = z.infer<typeof ColorScaleSchema>;
export type SemanticColors = z.infer<typeof SemanticColorsSchema>;
export type SurfaceColors = z.infer<typeof SurfaceColorsSchema>;
export type Typography = z.infer<typeof TypographySchema>;
export type Spacing = z.infer<typeof SpacingSchema>;
export type Animation = z.infer<typeof AnimationSchema>;
export type BorderRadius = z.infer<typeof BorderRadiusSchema>;
export type Shadow = z.infer<typeof ShadowSchema>;
export type Theme = z.infer<typeof ThemeSchema>;

export type ClusterType = Theme['cluster'];

// ===== BASE DESIGN TOKENS =====

export const BASE_TYPOGRAPHY: Typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'sans-serif',
    ],
    mono: [
      'JetBrains Mono',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ],
    display: [
      'Cal Sans',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'sans-serif',
    ],
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
};

export const BASE_SPACING: Spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
};

export const BASE_BORDER_RADIUS: BorderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
};

export const BASE_SHADOWS: Shadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  neon: '0 0 20px var(--fanz-primary-500)',
  neonHover: '0 0 30px var(--fanz-primary-500), 0 0 40px var(--fanz-primary-500)',
};

export const BASE_ANIMATION: Animation = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  keyframes: {
    fadeIn: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    slideUp: `
      @keyframes slideUp {
        from { 
          opacity: 0; 
          transform: translateY(10px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
    `,
    pulse: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `,
    neonGlow: `
      @keyframes neonGlow {
        0%, 100% { 
          box-shadow: 0 0 5px var(--fanz-primary-500),
                      0 0 10px var(--fanz-primary-500),
                      0 0 15px var(--fanz-primary-500);
        }
        50% { 
          box-shadow: 0 0 10px var(--fanz-primary-500),
                      0 0 20px var(--fanz-primary-500),
                      0 0 30px var(--fanz-primary-500);
        }
      }
    `,
  },
};

export const BASE_BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const BASE_Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// ===== SEMANTIC COLOR DEFINITIONS =====

export const BASE_SEMANTIC_COLORS: SemanticColors = {
  success: '#10B981', // Emerald-500
  warning: '#F59E0B', // Amber-500
  error: '#EF4444',   // Red-500
  info: '#3B82F6',    // Blue-500
};

// ===== UTILITY FUNCTIONS =====

/**
 * Generate a color scale from a base neon color
 */
export function generateColorScale(baseColor: string): ColorScale {
  // This is a simplified version - in reality, you'd use a color manipulation library
  // like chroma-js or polished to generate proper color scales
  return {
    50: lighten(baseColor, 0.95),
    100: lighten(baseColor, 0.9),
    200: lighten(baseColor, 0.75),
    300: lighten(baseColor, 0.6),
    400: lighten(baseColor, 0.3),
    500: baseColor, // Base neon color
    600: darken(baseColor, 0.1),
    700: darken(baseColor, 0.2),
    800: darken(baseColor, 0.3),
    900: darken(baseColor, 0.4),
    950: darken(baseColor, 0.5),
  };
}

/**
 * Create surface colors based on theme mode (light/dark)
 */
export function createSurfaceColors(isDark = true): SurfaceColors {
  if (isDark) {
    return {
      background: '#0A0A0A',
      foreground: '#FAFAFA',
      muted: '#1A1A1A',
      accent: '#262626',
      border: '#2A2A2A',
      input: '#1A1A1A',
      ring: '#404040',
    };
  } else {
    return {
      background: '#FFFFFF',
      foreground: '#0A0A0A',
      muted: '#F5F5F5',
      accent: '#F0F0F0',
      border: '#E5E5E5',
      input: '#FFFFFF',
      ring: '#D1D5DB',
    };
  }
}

/**
 * Create theme-specific shadows with neon glow effects
 */
export function createNeonShadows(primaryColor: string): Shadow {
  return {
    ...BASE_SHADOWS,
    neon: `0 0 20px ${primaryColor}`,
    neonHover: `0 0 30px ${primaryColor}, 0 0 40px ${primaryColor}`,
  };
}

/**
 * Validate theme configuration
 */
export function validateTheme(theme: unknown): Theme {
  try {
    return ThemeSchema.parse(theme);
  } catch (error) {
    throw new Error(`Invalid theme configuration: ${error}`);
  }
}

/**
 * Create base theme structure
 */
export function createBaseTheme(config: {
  name: string;
  displayName: string;
  cluster: ClusterType;
  primaryColor: string;
  secondaryColor?: string;
  isDark?: boolean;
}): Theme {
  const {
    name,
    displayName,
    cluster,
    primaryColor,
    secondaryColor = primaryColor,
    isDark = true,
  } = config;

  const primary = generateColorScale(primaryColor);
  const secondary = generateColorScale(secondaryColor);
  const surface = createSurfaceColors(isDark);
  const shadows = createNeonShadows(primaryColor);

  return {
    name,
    displayName,
    cluster,
    colors: {
      primary,
      secondary,
      accent: primary, // Use primary as accent by default
      semantic: BASE_SEMANTIC_COLORS,
      surface,
      destructive: generateColorScale('#EF4444'), // Red-500
      muted: generateColorScale('#6B7280'), // Gray-500
      popover: surface,
      card: surface,
    },
    typography: BASE_TYPOGRAPHY,
    spacing: BASE_SPACING,
    borderRadius: BASE_BORDER_RADIUS,
    shadows,
    animation: BASE_ANIMATION,
    breakpoints: BASE_BREAKPOINTS,
    zIndex: BASE_Z_INDEX,
  };
}

// ===== COLOR MANIPULATION UTILITIES =====

/**
 * Lighten a hex color by a given amount (0-1)
 */
function lighten(hex: string, amount: number): string {
  const color = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((color >> 16) + amount * (255 - (color >> 16))));
  const g = Math.min(255, Math.floor(((color >> 8) & 0x00FF) + amount * (255 - ((color >> 8) & 0x00FF))));
  const b = Math.min(255, Math.floor((color & 0x0000FF) + amount * (255 - (color & 0x0000FF))));
  
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

/**
 * Darken a hex color by a given amount (0-1)
 */
function darken(hex: string, amount: number): string {
  const color = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((color >> 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(((color >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.floor((color & 0x0000FF) * (1 - amount)));
  
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

/**
 * Convert theme to CSS custom properties
 */
export function themeToCSSProperties(theme: Theme): Record<string, string> {
  const cssProps: Record<string, string> = {};

  // Colors
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssProps[`--fanz-primary-${key}`] = value;
  });

  Object.entries(theme.colors.secondary).forEach(([key, value]) => {
    cssProps[`--fanz-secondary-${key}`] = value;
  });

  Object.entries(theme.colors.surface).forEach(([key, value]) => {
    cssProps[`--fanz-${key}`] = value;
  });

  // Typography
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssProps[`--fanz-text-${key}`] = value;
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssProps[`--fanz-space-${key}`] = value;
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssProps[`--fanz-radius-${key}`] = value;
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssProps[`--fanz-shadow-${key}`] = value;
  });

  return cssProps;
}

/**
 * Generate CSS for theme
 */
export function generateThemeCSS(theme: Theme): string {
  const properties = themeToCSSProperties(theme);
  
  const cssRules = Object.entries(properties)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');

  return `
:root[data-theme="${theme.name}"] {
${cssRules}
}

.theme-${theme.name} {
${cssRules}
}

/* Cluster-specific styles */
.cluster-${theme.cluster} {
${cssRules}
}
`;
}