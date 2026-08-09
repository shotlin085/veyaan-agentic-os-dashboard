import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Standard shadcn/assistant-ui tokens (background/foreground/card/
        // popover/primary/secondary/muted/destructive/input/ring below, plus
        // `accent` and `border` merged into this project's own existing
        // color objects right after) — required by components pulled from
        // the assistant-ui registry (Thread, Composer, Message, etc.),
        // mapped in globals.css onto this project's own black/cyan/purple
        // palette rather than shadcn's default theme.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        bg: {
          app: "#060911",
          surface: {
            1: "#0A0F1D",
            2: "#111827",
            3: "#1F2937",
          },
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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
          DEFAULT: "hsl(var(--border))",
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
  plugins: [
    require("tailwindcss-animate"),
    // v3 equivalent of the assistant-ui registry's Tailwind-v4-only
    // `@custom-variant data-open`/`data-closed` at-rules (removed from
    // globals.css) - lets pulled components use `data-open:`/`data-closed:`
    // class prefixes for their Radix collapsible open/close animations.
    plugin(({ addVariant }) => {
      addVariant("data-open", '&:where([data-state="open"], [data-open]:not([data-open="false"]))');
      addVariant("data-closed", '&:where([data-state="closed"], [data-closed]:not([data-closed="false"]))');
    }),
  ],
};

export default config;
