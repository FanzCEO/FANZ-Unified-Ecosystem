/**
 * 🌈 Cluster-Specific Themes
 * 
 * Individual theme definitions for each FANZ platform cluster
 * Each theme maintains unique neon identity while sharing consistent structure
 */

import { createBaseTheme, Theme } from '../base/theme';

// ===== FANZLAB THEME (Universal Portal) =====

export const fanzlabTheme: Theme = createBaseTheme({
  name: 'fanzlab',
  displayName: 'FanzLab',
  cluster: 'fanzlab',
  primaryColor: '#00FFFF', // Cyan neon
  secondaryColor: '#FF00FF', // Magenta neon
  isDark: true,
});

// ===== BOYFANZ THEME (Male Creators - Neon Red) =====

export const boyfanzTheme: Theme = createBaseTheme({
  name: 'boyfanz',
  displayName: 'BoyFanz',
  cluster: 'boyfanz',
  primaryColor: '#FF0040', // Neon Red
  secondaryColor: '#FF6B8A', // Light Red
  isDark: true,
});

// ===== GIRLFANZ THEME (Female Creators - Neon Pink) =====

export const girlfanzTheme: Theme = createBaseTheme({
  name: 'girlfanz',
  displayName: 'GirlFanz',
  cluster: 'girlfanz',
  primaryColor: '#FF0080', // Neon Pink
  secondaryColor: '#FF66B3', // Light Pink
  isDark: true,
});

// ===== DADDYFANZ THEME (Dom/Sub Community - Neon Gold) =====

export const daddyfanzTheme: Theme = createBaseTheme({
  name: 'daddyfanz',
  displayName: 'DaddyFanz',
  cluster: 'daddyfanz',
  primaryColor: '#FFD700', // Neon Gold
  secondaryColor: '#FFEB66', // Light Gold
  isDark: true,
});

// ===== PUPFANZ THEME (Pup Community - Neon Green) =====

export const pupfanzTheme: Theme = createBaseTheme({
  name: 'pupfanz',
  displayName: 'PupFanz',
  cluster: 'pupfanz',
  primaryColor: '#00FF40', // Neon Green
  secondaryColor: '#66FF80', // Light Green
  isDark: true,
});

// ===== TABOOFANZ THEME (Extreme Content - Dark Neon Blue) =====

export const taboofanzTheme: Theme = createBaseTheme({
  name: 'taboofanz',
  displayName: 'TabooFanz',
  cluster: 'taboofanz',
  primaryColor: '#0040FF', // Dark Neon Blue
  secondaryColor: '#6B80FF', // Light Blue
  isDark: true,
});

// ===== TRANSFANZ THEME (Trans Creators - Turquoise Neon) =====

export const transfanzTheme: Theme = createBaseTheme({
  name: 'transfanz',
  displayName: 'TransFanz',
  cluster: 'transfanz',
  primaryColor: '#00FFFF', // Turquoise Neon
  secondaryColor: '#66FFFF', // Light Turquoise
  isDark: true,
});

// ===== COUGARFANZ THEME (Mature Creators - Mature Gold) =====

export const cougarfanzTheme: Theme = createBaseTheme({
  name: 'cougarfanz',
  displayName: 'CougarFanz',
  cluster: 'cougarfanz',
  primaryColor: '#FFAA00', // Mature Gold
  secondaryColor: '#FFCC66', // Light Mature Gold
  isDark: true,
});

// ===== FANZCOCK THEME (Adult TikTok - XXX Red/Black) =====

export const fanzcockTheme: Theme = {
  ...createBaseTheme({
    name: 'fanzcock',
    displayName: 'FanzCock',
    cluster: 'fanzcock',
    primaryColor: '#FF0000', // XXX Red
    secondaryColor: '#000000', // Black
    isDark: true,
  }),
  // Custom overrides for FanzCock's unique XXX Red/Black aesthetic
  colors: {
    ...createBaseTheme({
      name: 'fanzcock',
      displayName: 'FanzCock',
      cluster: 'fanzcock',
      primaryColor: '#FF0000',
      secondaryColor: '#000000',
      isDark: true,
    }).colors,
    surface: {
      background: '#000000', // Pure black background
      foreground: '#FF0000', // Red text
      muted: '#1A0000',      // Very dark red
      accent: '#330000',     // Dark red accent
      border: '#660000',     // Red border
      input: '#1A0000',      // Dark red input
      ring: '#FF0000',       // Red focus ring
    },
  },
};

// ===== THEME REGISTRY =====

export const themes = {
  fanzlab: fanzlabTheme,
  boyfanz: boyfanzTheme,
  girlfanz: girlfanzTheme,
  daddyfanz: daddyfanzTheme,
  pupfanz: pupfanzTheme,
  taboofanz: taboofanzTheme,
  transfanz: transfanzTheme,
  cougarfanz: cougarfanzTheme,
  fanzcock: fanzcockTheme,
} as const;

export type ThemeName = keyof typeof themes;

// ===== THEME UTILITIES =====

/**
 * Get theme by cluster name
 */
export function getThemeByCluster(cluster: string): Theme {
  const theme = themes[cluster as ThemeName];
  if (!theme) {
    throw new Error(`Unknown cluster: ${cluster}`);
  }
  return theme;
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes);
}

/**
 * Get theme names
 */
export function getThemeNames(): ThemeName[] {
  return Object.keys(themes) as ThemeName[];
}

/**
 * Check if theme name is valid
 */
export function isValidTheme(name: string): name is ThemeName {
  return name in themes;
}

/**
 * Get theme colors for quick reference
 */
export function getThemeColors() {
  return {
    fanzlab: { primary: '#00FFFF', secondary: '#FF00FF', name: 'Universal Portal' },
    boyfanz: { primary: '#FF0040', secondary: '#FF6B8A', name: 'Male Creators' },
    girlfanz: { primary: '#FF0080', secondary: '#FF66B3', name: 'Female Creators' },
    daddyfanz: { primary: '#FFD700', secondary: '#FFEB66', name: 'Dom/Sub Community' },
    pupfanz: { primary: '#00FF40', secondary: '#66FF80', name: 'Pup Community' },
    taboofanz: { primary: '#0040FF', secondary: '#6B80FF', name: 'Extreme Content' },
    transfanz: { primary: '#00FFFF', secondary: '#66FFFF', name: 'Trans Creators' },
    cougarfanz: { primary: '#FFAA00', secondary: '#FFCC66', name: 'Mature Creators' },
    fanzcock: { primary: '#FF0000', secondary: '#000000', name: 'Adult TikTok' },
  };
}

/**
 * Generate CSS for all themes
 */
export function generateAllThemesCSS(): string {
  return getAllThemes()
    .map(theme => {
      const properties = Object.entries({
        ...Object.fromEntries(
          Object.entries(theme.colors.primary).map(([key, value]) => [`--fanz-primary-${key}`, value])
        ),
        ...Object.fromEntries(
          Object.entries(theme.colors.secondary).map(([key, value]) => [`--fanz-secondary-${key}`, value])
        ),
        ...Object.fromEntries(
          Object.entries(theme.colors.surface).map(([key, value]) => [`--fanz-${key}`, value])
        ),
        '--fanz-neon-glow': `0 0 20px ${theme.colors.primary[500]}`,
        '--fanz-neon-glow-hover': `0 0 30px ${theme.colors.primary[500]}, 0 0 40px ${theme.colors.primary[500]}`,
      }).map(([prop, val]) => `  ${prop}: ${val};`).join('\n');

      return `
/* ${theme.displayName} Theme */
:root[data-theme="${theme.name}"],
.theme-${theme.name} {
${properties}
}

/* Cluster-specific overrides */
.cluster-${theme.cluster} {
${properties}
}
`;
    })
    .join('\n');
}

// ===== DEFAULT EXPORT =====

export default themes;

// ===== INDIVIDUAL THEME EXPORTS =====

export {
  fanzlabTheme,
  boyfanzTheme,
  girlfanzTheme,
  daddyfanzTheme,
  pupfanzTheme,
  taboofanzTheme,
  transfanzTheme,
  cougarfanzTheme,
  fanzcockTheme,
};

// ===== THEME METADATA =====

export const themeMetadata = {
  fanzlab: {
    name: 'FanzLab',
    description: 'Universal portal with cyan/magenta neon aesthetic',
    target: 'Universal access point for all FANZ platforms',
    colors: ['#00FFFF', '#FF00FF'],
    category: 'universal',
  },
  boyfanz: {
    name: 'BoyFanz',
    description: 'Male creator platform with bold neon red branding',
    target: 'Male content creators and their audiences',
    colors: ['#FF0040', '#FF6B8A'],
    category: 'creator',
  },
  girlfanz: {
    name: 'GirlFanz',
    description: 'Female creator platform with vibrant neon pink',
    target: 'Female content creators and their audiences',
    colors: ['#FF0080', '#FF66B3'],
    category: 'creator',
  },
  daddyfanz: {
    name: 'DaddyFanz',
    description: 'Dom/Sub community with prestigious gold theming',
    target: 'BDSM and Dom/Sub community members',
    colors: ['#FFD700', '#FFEB66'],
    category: 'community',
  },
  pupfanz: {
    name: 'PupFanz',
    description: 'Pup community with energetic neon green',
    target: 'Pup play community and enthusiasts',
    colors: ['#00FF40', '#66FF80'],
    category: 'community',
  },
  taboofanz: {
    name: 'TabooFanz',
    description: 'Extreme content platform with dark neon blue',
    target: 'Creators and consumers of extreme adult content',
    colors: ['#0040FF', '#6B80FF'],
    category: 'specialized',
  },
  transfanz: {
    name: 'TransFanz',
    description: 'Trans creator platform with turquoise neon',
    target: 'Transgender creators and supportive community',
    colors: ['#00FFFF', '#66FFFF'],
    category: 'creator',
  },
  cougarfanz: {
    name: 'CougarFanz',
    description: 'Mature creator platform with sophisticated gold',
    target: 'Mature creators and age-gap content',
    colors: ['#FFAA00', '#FFCC66'],
    category: 'creator',
  },
  fanzcock: {
    name: 'FanzCock',
    description: 'Adult TikTok with intense XXX red/black aesthetic',
    target: 'Short-form adult video content',
    colors: ['#FF0000', '#000000'],
    category: 'social',
  },
};

// ===== ACCESSIBILITY HELPERS =====

/**
 * Get high contrast variant of theme for accessibility
 */
export function getHighContrastTheme(themeName: ThemeName): Theme {
  const baseTheme = themes[themeName];
  
  return {
    ...baseTheme,
    name: `${baseTheme.name}-high-contrast`,
    displayName: `${baseTheme.displayName} (High Contrast)`,
    colors: {
      ...baseTheme.colors,
      surface: {
        background: '#000000',
        foreground: '#FFFFFF',
        muted: '#1A1A1A',
        accent: '#333333',
        border: '#666666',
        input: '#1A1A1A',
        ring: baseTheme.colors.primary[500],
      },
    },
  };
}

/**
 * Check if theme meets WCAG contrast requirements
 */
export function validateThemeContrast(theme: Theme): boolean {
  // Simplified contrast check - in reality, you'd use a proper color contrast library
  const bg = theme.colors.surface.background;
  const fg = theme.colors.surface.foreground;
  
  // This is a placeholder - implement proper contrast ratio calculation
  return getLuminance(bg) !== getLuminance(fg);
}

/**
 * Get relative luminance of a color (simplified)
 */
function getLuminance(hex: string): number {
  // Simplified luminance calculation
  const color = parseInt(hex.replace('#', ''), 16);
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}