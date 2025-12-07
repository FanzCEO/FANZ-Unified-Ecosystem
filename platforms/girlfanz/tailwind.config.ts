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
        // GirlFanz Brand Colors
        gf: {
          pink: "#FF2E7E",
          violet: "#6C2BD9", 
          cyan: "#00E5FF",
          ink: "#0A0A0B",
          graphite: "#121214",
          snow: "#F5F7FA",
          smoke: "#C7BBD3",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        
        // Semantic Colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
        sans: ["var(--font-body)", "Inter", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      boxShadow: {
        'glow-pink': '0 0 24px rgba(255, 46, 126, 0.4)',
        'glow-violet': '0 0 24px rgba(108, 43, 217, 0.4)',
        'glow-cyan': '0 0 24px rgba(0, 229, 255, 0.4)',
      },
      backgroundImage: {
        'gf-gradient': 'linear-gradient(90deg, #FF2E7E, #6C2BD9)',
        'gf-hero': 'radial-gradient(1200px 600px at 70% -10%, rgba(108, 43, 217, 0.13) 0%, #0A0A0B 60%)',
        'heatwave': 'linear-gradient(135deg, #FF2E7E 0%, #6C2BD9 50%, #00E5FF 100%)',
        'afterglow': 'linear-gradient(90deg, #FF2E7E, #6C2BD9)',
        'nightdrive': 'radial-gradient(1200px 600px at 70% -10%, rgba(108, 43, 217, 0.13) 0%, #000 60%)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 0 0 rgba(255, 46, 126, 0.7)",
          },
          "50%": {
            boxShadow: "0 0 0 10px rgba(255, 46, 126, 0)",
          },
        },
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography")
  ],
} satisfies Config;
