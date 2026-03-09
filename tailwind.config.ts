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
        /* ─── PandaPoss Purple System ─── */
        brand: {
          50:  "#F5F1FF",
          100: "#EDE5FF",
          200: "#D9CCFF",
          300: "#A98BFF",    /* hover / selección */
          400: "#8B5CFF",
          500: "#6C3BFF",    /* ★ principal */
          600: "#5B2ED9",
          700: "#4B22B3",    /* headers / sidebar dark */
          800: "#3B1A8F",
          900: "#2D136E",
          950: "#1A0B42",
        },
        /* ─── Neutros – superficies ─── */
        surface: {
          bg:     "#F6F7FB",
          card:   "#FFFFFF",
          border: "#E6E8F0",
          text:   "#1F2430",
          muted:  "#6B7280",
        },
        /* ─── Estados operativos restaurante ─── */
        estado: {
          nuevo:     "#6C3BFF",     /* morado – nuevo pedido   */
          preparando:"#F59E0B",     /* amarillo – en preparación */
          listo:     "#10B981",     /* verde – listo             */
          urgente:   "#EF4444",     /* rojo – urgente            */
          libre:     "#9CA3AF",     /* gris – mesa libre         */
        },
      },
      borderRadius: {
        xl:   "0.75rem",   /* 12px – radio principal */
        "2xl":"1rem",
        "3xl":"1.5rem",
        lg:   "0.625rem",
        md:   "0.5rem",
        sm:   "0.375rem",
      },
      boxShadow: {
        card:     "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        elevated: "0 4px 12px rgba(0,0,0,0.08)",
        glow:     "0 0 20px rgba(108,59,255,0.15)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to:   { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "drop-in": {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(108,59,255,0.2)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(108,59,255,0)" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.2s ease-out",
        "slide-in":   "slide-in 0.3s ease-out",
        "scale-in":   "scale-in 0.2s ease-out",
        "drop-in":    "drop-in 0.15s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
