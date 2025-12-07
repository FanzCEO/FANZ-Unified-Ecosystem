/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    // Include FANZ ads client components
    '../packages/fanz-ads-client/src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // FANZ Brand Colors
      colors: {
        // Brand palette
        'fanz-primary': '#7C4DFF',
        'fanz-secondary': '#00D1FF', 
        'fanz-accent': '#FF3D71',
        'fanz-success': '#16D19A',
        'fanz-warning': '#FFB020',
        'fanz-error': '#FF5757',
        
        // Sub-brand colors
        'boyfanz': '#FF1744',
        'girlfanz': '#FF2D95',
        'pupfanz': '#39FF14',
        'taboofanz': '#9C27FF',
        'daddiesfanz': '#276EF1',
        'cougarfanz': '#FFD600',
        
        // Dark theme optimized
        gray: {
          950: '#0a0a0a',
          900: '#12131a',
          800: '#1e1f26',
          700: '#2a2b32',
          600: '#36373e',
        }
      },
      
      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      
      // Spacing for ad layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
      },
      
      // Border radius for modern look
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Box shadows
      boxShadow: {
        'glow': '0 0 0.6rem currentColor, 0 0 1.8rem color-mix(in oklch, currentColor 60%, transparent)',
        'ad': '0 8px 25px -8px rgba(0, 0, 0, 0.3)',
      },
      
      // Background gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'fanz-mesh': 'radial-gradient(1000px 500px at 10% 10%, color-mix(in oklch, var(--brand-color, #7C4DFF) 25%, transparent), transparent), radial-gradient(800px 400px at 90% 20%, rgba(124, 58, 237, 0.14), transparent)',
        'fanz-scanlines': 'repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0 1px, transparent 1px 3px)',
      },
      
      // Animation
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      
      // Container
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
    },
  },
  plugins: [
    // Custom plugin for ad container utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.ad-container-header': {
          width: '100%',
          minHeight: '90px',
          '@screen md': {
            minHeight: '60px',
          },
        },
        '.ad-container-sidebar': {
          width: '100%',
          minHeight: '250px',
        },
        '.ad-container-footer': {
          width: '100%',
          minHeight: '90px',
        },
        '.ad-container-hero': {
          width: '100%',
          minHeight: '250px',
          '@screen lg': {
            minHeight: '400px',
          },
        },
        '.ad-container-native': {
          width: '100%',
          minHeight: '200px',
        },
        '.ad-container-widget': {
          width: '100%',
          minHeight: '150px',
        },
        // Hover effects for ads
        '.hover-lift': {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.ad'),
          },
        },
        // Brand color utilities
        '.text-brand': {
          color: 'var(--brand-color, #7C4DFF)',
        },
        '.bg-brand': {
          backgroundColor: 'var(--brand-color, #7C4DFF)',
        },
        '.border-brand': {
          borderColor: 'var(--brand-color, #7C4DFF)',
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
};