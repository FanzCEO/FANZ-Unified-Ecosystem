/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0A0A0B',
          800: '#111216'
        },
        slate: {
          600: '#6A7380'
        },
        neon: {
          pink: '#FF2DA1',
          cyan: '#19F0FF'
        },
        acid: {
          lime: '#C8FF3D'
        },
        infra: {
          500: '#FF3B5C',
          700: '#C3112C'
        },
        uv: {
          500: '#7A2CFF',
          700: '#4A1BB2'
        },
        steel: {
          400: '#9BA3AE',
          300: '#C7D0DA'
        },
        glass: {
          200: '#E6F0FF'
        },
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        accent: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 12px rgba(255,45,161,0.6), 0 0 24px rgba(25,240,255,0.35)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 20px rgba(0,0,0,0.35)',
      },
      dropShadow: {
        glow: '0 0 0.6rem #FF2DA1',
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        'sexy': '1.5rem',
        'ultra': '2rem',
        'organic': '2.5rem',
      },
      letterSpacing: {
        'flow': '0.02em',
        'airy': '0.05em',
        'sensual': '0.03em',
        'tight': '-0.02em',
        'loose': '0.04em',
      },
      backgroundImage: {
        'grad-brand': 'linear-gradient(90deg, #FF2DA1 0%, #7A2CFF 50%, #19F0FF 100%)',
        'grad-lime': 'linear-gradient(90deg, #C8FF3D 0%, #19F0FF 100%)',
        'grid': 'linear-gradient(#111216 1px, transparent 1px), linear-gradient(90deg, #111216 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px'
      },
      animation: {
        scan: 'scan 2.2s linear infinite',
        flicker: 'flicker 3s linear infinite',
        neonbuzz: 'neonbuzz 6s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        flicker: {
          '0%, 15%, 18%, 22%, 62%, 64%, 70%, 100%': { opacity: '1' },
          '16%, 23%, 63%': { opacity: '0.55' },
          '24%': { opacity: '0.8' }
        },
        neonbuzz: {
          '0%': { filter: 'brightness(1)' },
          '8%': { filter: 'brightness(1.25)' },
          '9%': { filter: 'brightness(0.6)' },
          '10%': { filter: 'brightness(1.3)' },
          '50%': { filter: 'brightness(1.05)' },
          '51%': { filter: 'brightness(0.7)' },
          '52%': { filter: 'brightness(1.2)' },
          '100%': { filter: 'brightness(1)' }
        }
      }
    }
  },
  plugins: []
}
