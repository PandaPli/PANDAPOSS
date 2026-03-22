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
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        /* ─── PandaPoss Indigo Premium System ─── */
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",    /* ★ principal hover */
          600: "#4f46e5",    /* ★ principal */
          700: "#4338ca",    
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        /* ─── Neutros – superficies Slate ─── */
        surface: {
          bg:     "#f8fafc",
          card:   "#ffffff",
          border: "#e2e8f0",
          text:   "#0f172a",
          muted:  "#64748b",
        },
        /* ─── Estados operativos restaurante ─── */
        estado: {
          nuevo:     "#4f46e5",     /* violeta oscuro – nuevo pedido   */
          preparando:"#f59e0b",     /* amarillo – en preparación */
          listo:     "#10b981",     /* verde – listo             */
          urgente:   "#ef4444",     /* rojo – urgente            */
          libre:     "#94a3b8",     /* gris oscuro – mesa libre         */
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
        "shrink": {
          from: { width: "100%" },
          to:   { width: "0%" },
        },
      },
      animation: {
        "fade-in":    "fade-in 0.2s ease-out",
        "slide-in":   "slide-in 0.3s ease-out",
        "scale-in":   "scale-in 0.2s ease-out",
        "drop-in":    "drop-in 0.15s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "shrink":     "shrink 3s linear forwards",
      },
    },
  },
  plugins: [],
};

export default config;
