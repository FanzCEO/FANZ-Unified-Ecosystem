import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Adult content platform color scheme
        'primary': {
          DEFAULT: 'hsl(262.1, 83.3%, 57.8%)', // Purple #6B46C1
          foreground: 'hsl(0, 0%, 100%)',
        },
        'secondary': {
          DEFAULT: 'hsl(328.3, 85.5%, 70.2%)', // Pink #EC4899
          foreground: 'hsl(0, 0%, 100%)',
        },
        'dark': 'hsl(222.2, 84%, 4.9%)', // Very dark blue #0F172A
        'slate': 'hsl(217.2, 32.6%, 17.5%)', // Dark blue-gray #1E293B
        'accent': {
          DEFAULT: 'hsl(37.7, 92.1%, 50.2%)', // Orange/Amber #F59E0B
          foreground: 'hsl(222.2, 84%, 4.9%)',
        },
        'success': 'hsl(142.1, 76.2%, 36.3%)', // Green #10B981
        
        // Base colors
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          "1": 'var(--chart-1)',
          "2": 'var(--chart-2)',
          "3": 'var(--chart-3)',
          "4": 'var(--chart-4)',
          "5": 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar-background)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          "primary-foreground": 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          "accent-foreground": 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Open Sans', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
        "slide-up": {
          from: {
            transform: "translateY(20px)",
            opacity: "0",
          },
          to: {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px hsla(262.1, 83.3%, 57.8%, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px hsla(262.1, 83.3%, 57.8%, 0.6)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(107, 70, 193, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
        'glow-accent': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for adult content platform utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.gradient-primary': {
          background: 'linear-gradient(135deg, hsl(262.1, 83.3%, 57.8%), hsl(328.3, 85.5%, 70.2%))',
        },
        '.gradient-secondary': {
          background: 'linear-gradient(135deg, hsl(328.3, 85.5%, 70.2%), hsl(37.7, 92.1%, 50.2%))',
        },
        '.glass-dark': {
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.premium-border': {
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(hsl(217.2, 32.6%, 17.5%), hsl(217.2, 32.6%, 17.5%)), linear-gradient(135deg, hsl(262.1, 83.3%, 57.8%), hsl(328.3, 85.5%, 70.2%))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'content-box, border-box',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
