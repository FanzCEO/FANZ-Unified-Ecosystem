import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // TabooFanz Brand Colors - Neon Noir + Cyber Fetish + Goth Club
        taboo: {
          // Backgrounds
          bg: {
            DEFAULT: '#0a0a0c', // Ultra-dark charcoal
            secondary: '#121216',
            tertiary: '#1a1a1f',
          },
          // Surfaces (cards, panels)
          surface: {
            DEFAULT: '#1e1b2e', // Deep violet/midnight plum
            hover: '#252236',
            active: '#2c2840',
          },
          // Primary Accent - Neon Magenta
          accent: {
            primary: '#ff00ff', // Neon magenta
            'primary-hover': '#e600e6',
            'primary-muted': '#ff00ff20',
          },
          // Secondary Accent - Electric Cyan (glitch accent)
          glitch: {
            DEFAULT: '#00ffff', // Electric cyan
            hover: '#00e6e6',
            muted: '#00ffff20',
          },
          // Border
          border: {
            DEFAULT: '#2d2d35', // Soft cool gray
            hover: '#3d3d45',
          },
          // Status Colors
          danger: '#ff3366', // Hot red
          success: '#39ff14', // Acid/toxic green
          warning: '#ffaa00',
          info: '#00aaff',
        },
        // Shadcn/UI compatible mappings
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(255, 0, 255, 0.6)',
          },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        glitch: 'glitch 0.3s ease-in-out',
        scanline: 'scanline 8s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-taboo':
          'linear-gradient(135deg, rgba(255,0,255,0.1) 0%, rgba(0,255,255,0.1) 100%)',
        'neon-glow':
          'linear-gradient(90deg, transparent, rgba(255,0,255,0.4), transparent)',
        scanlines:
          'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 2px, transparent 3px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
