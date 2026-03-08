import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f3f0ff",
          100: "#ece5ff",
          200: "#d9ccff",
          300: "#c0a3ff",
          400: "#a471ff",
          500: "#8b3dff",
          600: "#7c2d9e",
          700: "#714b9e",
          800: "#5b3d82",
          900: "#4a3368",
          950: "#2d1a47",
        },
        odoo: {
          purple: "#7c2d9e",
          "purple-dark": "#5c1f7a",
          "purple-light": "#9b59b6",
          bg: "#f8f9fa",
          nav: "#7c2d9e",
          border: "#dee2e6",
          hover: "#f0f0f0",
          text: "#495057",
          "text-muted": "#868e96",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "drop-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "drop-in": "drop-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
