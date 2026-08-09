import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          app: "#060911",
          surface: {
            1: "#0A0F1D",
            2: "#111827",
            3: "#1F2937",
          },
        },
        accent: {
          cyan: "#00F0FF",
          purple: "#7C3AED",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          working: "#3B82F6",
          waiting: "#8B5CF6",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          glow: "rgba(0, 240, 255, 0.25)",
          active: "#00F0FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 240, 255, 0.15)",
        purpleGlow: "0 0 20px rgba(124, 58, 237, 0.2)",
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spinSlow: "spin 12s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
