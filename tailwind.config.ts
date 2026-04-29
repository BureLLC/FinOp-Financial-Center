import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "finops-black":       "#080B12",
        "finops-navy":        "#0D1117",
        "finops-card":        "#111827",
        "finops-border":      "#1E2A3B",
        "finops-blue":        "#2563EB",
        "finops-blue-bright": "#3B82F6",
        "finops-blue-glow":   "#60A5FA",
        "finops-cyan":        "#06B6D4",
        "finops-silver":      "#94A3B8",
        "finops-white":       "#F1F5F9",
        "finops-green":       "#10B981",
        "finops-red":         "#EF4444",
        "finops-amber":       "#F59E0B",
        "finops-purple":      "#8B5CF6",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "finops-gradient": "linear-gradient(135deg, #080B12 0%, #0D1117 50%, #0A0F1E 100%)",
        "blue-glow":       "radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)",
        "card-gradient":   "linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(13,17,23,0.95) 100%)",
      },
      boxShadow: {
        "blue-glow":    "0 0 20px rgba(37,99,235,0.3), 0 0 40px rgba(37,99,235,0.1)",
        "blue-glow-sm": "0 0 10px rgba(37,99,235,0.25)",
        "card":         "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
        "card-hover":   "0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(37,99,235,0.15)",
      },
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "pulse-blue": "pulseBlue 2s ease-in-out infinite",
        "float":      "float 3s ease-in-out infinite",
        "glow":       "glow 2s ease-in-out infinite alternate",
        "slide-in":   "slideIn 0.3s ease-out",
        "fade-in":    "fadeIn 0.4s ease-out",
        "ticker":     "ticker 30s linear infinite",
      },
      keyframes: {
        pulseBlue: {
          "0%, 100%": { boxShadow: "0 0 10px rgba(37,99,235,0.3)" },
          "50%":      { boxShadow: "0 0 25px rgba(37,99,235,0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        glow: {
          from: { textShadow: "0 0 8px rgba(96,165,250,0.4)" },
          to:   { textShadow: "0 0 20px rgba(96,165,250,0.8)" },
        },
        slideIn: {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        ticker: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
