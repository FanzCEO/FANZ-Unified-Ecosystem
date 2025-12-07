import { aiService } from "./ai";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemeConfig {
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  borderRadius: string;
  animations: {
    duration: string;
    easing: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  customCSS?: string;
}

export class ThemeGenerator {
  
  /**
   * Generate theme from description
   */
  async generateFromDescription(description: string, brand?: string): Promise<ThemeConfig> {
    const prompt = `
You are a professional UI/UX designer and CSS expert. Create a beautiful, modern theme based on this description:

Description: ${description}
${brand ? `Brand: ${brand}` : ''}

Generate a comprehensive theme with:
1. Modern, accessible color palette for both light and dark modes
2. Professional typography choices
3. Appropriate spacing and border radius
4. Smooth animations and shadows
5. Custom CSS for unique styling

The theme should be:
- Visually appealing and modern
- Accessible (WCAG AA compliant)
- Consistent across all components
- Suitable for the described use case

Respond with a JSON object matching this TypeScript interface:

interface ThemeConfig {
  name: string;
  colors: {
    light: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      foreground: string;
      muted: string;
      mutedForeground: string;
      border: string;
      card: string;
      cardForeground: string;
      destructive: string;
      destructiveForeground: string;
      success: string;
      warning: string;
      info: string;
    };
    dark: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      foreground: string;
      muted: string;
      mutedForeground: string;
      border: string;
      card: string;
      cardForeground: string;
      destructive: string;
      destructiveForeground: string;
      success: string;
      warning: string;
      info: string;
    };
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  borderRadius: string;
  animations: {
    duration: string;
    easing: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  customCSS?: string;
}

Use modern color values (hsl format), Google Fonts, and contemporary design principles.`;

    const response = await aiService.generateResponse(prompt);
    
    try {
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      const theme = JSON.parse(jsonStr.trim());
      return this.validateTheme(theme);
    } catch (error) {
      console.error("Error parsing theme response:", error);
      throw new Error("Failed to generate valid theme");
    }
  }

  /**
   * Generate preset themes
   */
  async generatePresetTheme(preset: string): Promise<ThemeConfig> {
    const presets = {
      'corporate': 'Professional corporate theme with blue and gray tones, clean typography, suitable for business applications',
      'creative': 'Creative and vibrant theme with bold colors, modern fonts, perfect for design agencies and portfolios',
      'minimal': 'Minimal and clean theme with subtle colors, lots of whitespace, elegant typography',
      'dark': 'Dark theme with neon accents, perfect for gaming, tech, or developer tools',
      'warm': 'Warm and inviting theme with earth tones, friendly for lifestyle and wellness brands',
      'luxury': 'Luxury theme with gold accents, premium feel, elegant for high-end products',
      'playful': 'FANZ and playful theme with bright colors, rounded corners, great for kids or casual apps',
      'medical': 'Professional medical theme with calming colors, trustworthy feel, HIPAA-friendly design',
      'finance': 'Financial theme with trustworthy blues and greens, professional and secure feeling',
      'adult': 'Sophisticated adult theme with rich purples and pinks, elegant and premium feeling'
    };

    const description = presets[preset as keyof typeof presets];
    if (!description) {
      throw new Error(`Unknown preset: ${preset}`);
    }

    return this.generateFromDescription(description);
  }

  /**
   * Generate CSS from theme config
   */
  generateCSS(theme: ThemeConfig): string {
    const lightVars = Object.entries(theme.colors.light)
      .map(([key, value]) => `  --${this.kebabCase(key)}: ${this.convertToHSL(value)};`)
      .join('\n');
    
    const darkVars = Object.entries(theme.colors.dark)
      .map(([key, value]) => `  --${this.kebabCase(key)}: ${this.convertToHSL(value)};`)
      .join('\n');

    return `/* ${theme.name} Theme */
@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fonts.heading.replace(/ /g, '+'))}:wght@300;400;500;600;700&family=${encodeURIComponent(theme.fonts.body.replace(/ /g, '+'))}:wght@300;400;500;600;700&family=${encodeURIComponent(theme.fonts.mono.replace(/ /g, '+'))}:wght@400;500&display=swap');

:root {
${lightVars}
  --font-heading: "${theme.fonts.heading}", system-ui, sans-serif;
  --font-body: "${theme.fonts.body}", system-ui, sans-serif;
  --font-mono: "${theme.fonts.mono}", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
  --border-radius: ${theme.borderRadius};
  --animation-duration: ${theme.animations.duration};
  --animation-easing: ${theme.animations.easing};
  --shadow-sm: ${theme.shadows.sm};
  --shadow-md: ${theme.shadows.md};
  --shadow-lg: ${theme.shadows.lg};
  --shadow-xl: ${theme.shadows.xl};
}

.dark {
${darkVars}
}

/* Base Typography */
body {
  font-family: var(--font-body);
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
  line-height: 1.6;
  transition: color var(--animation-duration) var(--animation-easing),
              background-color var(--animation-duration) var(--animation-easing);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

code, pre {
  font-family: var(--font-mono);
}

/* Component Base Styles */
.btn {
  border-radius: var(--border-radius);
  transition: all var(--animation-duration) var(--animation-easing);
  font-weight: 500;
}

.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.btn-primary:hover {
  background-color: hsl(var(--primary) / 0.9);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.card {
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--animation-duration) var(--animation-easing);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.input {
  border: 1px solid hsl(var(--border));
  border-radius: var(--border-radius);
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: border-color var(--animation-duration) var(--animation-easing);
}

.input:focus {
  border-color: hsl(var(--primary));
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
}

/* Utility Classes */
.text-primary { color: hsl(var(--primary)); }
.text-secondary { color: hsl(var(--secondary)); }
.text-accent { color: hsl(var(--accent)); }
.text-muted { color: hsl(var(--muted-foreground)); }
.text-success { color: hsl(var(--success)); }
.text-warning { color: hsl(var(--warning)); }
.text-destructive { color: hsl(var(--destructive)); }
.text-info { color: hsl(var(--info)); }

.bg-primary { background-color: hsl(var(--primary)); }
.bg-secondary { background-color: hsl(var(--secondary)); }
.bg-accent { background-color: hsl(var(--accent)); }
.bg-muted { background-color: hsl(var(--muted)); }
.bg-card { background-color: hsl(var(--card)); }

.border-primary { border-color: hsl(var(--primary)); }
.border-secondary { border-color: hsl(var(--secondary)); }
.border-accent { border-color: hsl(var(--accent)); }

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn var(--animation-duration) var(--animation-easing);
}

.animate-slide-in {
  animation: slideIn var(--animation-duration) var(--animation-easing);
}

.animate-scale-in {
  animation: scaleIn var(--animation-duration) var(--animation-easing);
}

/* Custom Theme Styles */
${theme.customCSS || ''}`;
  }

  /**
   * Generate Tailwind CSS config
   */
  generateTailwindConfig(theme: ThemeConfig): string {
    const lightColors = Object.entries(theme.colors.light)
      .map(([key, value]) => `        ${this.kebabCase(key)}: 'hsl(var(--${this.kebabCase(key)}))'`)
      .join(',\n');

    return `const config = {
  content: [
    "./client/**/*.{js,ts,jsx,tsx}",
    "./shared/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
${lightColors}
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--border-radius)",
        md: "calc(var(--border-radius) - 2px)",
        sm: "calc(var(--border-radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn var(--animation-duration) var(--animation-easing)",
        "slide-in": "slideIn var(--animation-duration) var(--animation-easing)", 
        "scale-in": "scaleIn var(--animation-duration) var(--animation-easing)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;`;
  }

  /**
   * Validate theme configuration
   */
  private validateTheme(theme: any): ThemeConfig {
    const required = ['name', 'colors', 'fonts', 'borderRadius', 'animations', 'shadows'];
    for (const field of required) {
      if (!theme[field]) {
        throw new Error(`Theme missing required field: ${field}`);
      }
    }

    if (!theme.colors.light || !theme.colors.dark) {
      throw new Error("Theme must have both light and dark color schemes");
    }

    return theme;
  }

  /**
   * Convert color to HSL format if needed
   */
  private convertToHSL(color: string): string {
    if (color.startsWith('hsl(')) {
      return color.replace(/hsl\((.*)\)/, '$1');
    }
    // For now, assume colors are already in correct format
    return color;
  }

  /**
   * Convert camelCase to kebab-case
   */
  private kebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}