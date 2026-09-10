import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#050508",
          dark: "#030305",
          light: "#0a0a12",
        },
        cyber: {
          surface: "#0e0e18",
          card: "rgba(13, 13, 23, 0.7)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-bright": "rgba(255, 255, 255, 0.2)",
        },
        neon: {
          violet: "#8b5cf6",
          purple: "#a855f7",
          cyan: "#06b6d4",
          blue: "#3b82f6",
          emerald: "#10b981",
          teal: "#22d3ee",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "radar-sweep": "radar-sweep 4s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      boxShadow: {
        "neon-violet": "0 0 25px -5px rgba(139, 92, 246, 0.45), 0 0 10px -3px rgba(139, 92, 246, 0.3)",
        "neon-cyan": "0 0 25px -5px rgba(6, 182, 212, 0.45), 0 0 10px -3px rgba(6, 182, 212, 0.3)",
        "neon-emerald": "0 0 20px -5px rgba(16, 185, 129, 0.45)",
        "glass-inner": "inset 0 1px 0 0 rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
