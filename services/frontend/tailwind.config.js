/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#ff6b6b",
          600: "#ee5a5a",
          700: "#dc4848",
        },
        dark: {
          800: "#1a1a2e",
          900: "#0c0c0c",
        },
      },
    },
  },
  plugins: [],
};
