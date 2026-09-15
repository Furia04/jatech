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
        // SAT Design Tokens
        outline: '#475569',
        'outline-variant': '#1e2532',
        background: '#090b0e',
        surface: '#0f1217',
        'surface-container-lowest': '#090b0e',
        'surface-container-low': '#12161e',
        'surface-container': '#151922',
        'surface-container-high': '#1a202c',
        'surface-container-highest': '#222938',
        'on-surface': '#f1f5f9',
        'on-surface-variant': '#94a3b8',
        'on-background': '#f1f5f9',
        primary: '#f59e0b',
        'primary-container': '#d97706',
        'on-primary': '#000000',
        'on-primary-container': '#fef3c7',
        secondary: '#94a3b8',
        'secondary-container': '#1e293b',
        'on-secondary': '#0f172a',
        'on-secondary-container': '#e2e8f0',
        tertiary: '#10b981',
        'tertiary-container': '#065f46',
        'on-tertiary': '#000000',
        'on-tertiary-container': '#d1fae5',
        error: '#f87171',
        'error-container': '#7f1d1d',
        'on-error': '#ffffff',
        'on-error-container': '#fecaca',
        'surface-variant': '#1e2532',
        'inverse-surface': '#f1f5f9',
        'inverse-on-surface': '#090b0e',
        'surface-dim': '#090b0e',
        'surface-bright': '#222938',
        'surface-tint': '#f59e0b',
      },
      spacing: {
        'sidebar-width': '240px',
        'table-cell-padding-v': '8px',
        'container-margin': '24px',
        gutter: '16px',
        unit: '4px',
        'table-cell-padding-h': '12px',
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        sans: ["var(--font-inter)", "Plus Jakarta Sans", "Geist", "system-ui", "sans-serif"],
        'mono-data': ['JetBrains Mono', 'monospace'],
        'label-caps': ['JetBrains Mono', 'monospace'],
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
