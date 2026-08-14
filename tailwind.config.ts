import type { Config } from "tailwindcss";

/*
 * The theme maps exclusively to tokens in design/tokens.css.
 * Default Tailwind palettes and text sizes are removed on purpose:
 * bg-red-500 or text-sm do not exist in this project.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      navy: "rgb(var(--rein-navy-rgb) / <alpha-value>)",
      chalk: "rgb(var(--chalk-rgb) / <alpha-value>)",
      steel: "rgb(var(--steel-rgb) / <alpha-value>)",
      surface: "rgb(var(--surface-rgb) / <alpha-value>)",
      paper: "rgb(var(--paper-rgb) / <alpha-value>)",
      graphite: "rgb(var(--graphite-rgb) / <alpha-value>)",
      rule: "rgb(var(--rule-rgb) / <alpha-value>)",
    },
    fontFamily: {
      display: ["var(--font-barlow-condensed)", "sans-serif"],
      text: ["var(--font-barlow)", "sans-serif"],
    },
    fontSize: {
      "display-xl": "var(--text-display-xl)",
      "display-l": "var(--text-display-l)",
      "display-m": "var(--text-display-m)",
      "display-s": "var(--text-display-s)",
      eyebrow: "var(--text-eyebrow)",
      "body-l": "var(--text-body-l)",
      body: "var(--text-body)",
      "body-s": "var(--text-body-s)",
      micro: "var(--text-micro)",
    },
    letterSpacing: {
      none: "0",
      "display-s": "var(--track-display-s)",
      "display-m": "var(--track-display-m)",
      "display-l": "var(--track-display-l)",
      hero: "var(--track-hero)",
      eyebrow: "var(--track-eyebrow)",
    },
    extend: {
      transitionTimingFunction: { brand: "var(--ease-brand)" },
      transitionDuration: { fast: "var(--dur-fast)", slow: "var(--dur-slow)" },
      maxWidth: { container: "var(--container)" },
    },
  },
  plugins: [],
};

export default config;
