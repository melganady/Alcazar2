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
      iron: "rgb(var(--iron-grey-rgb) / <alpha-value>)",
      ash: "rgb(var(--ash-wood-rgb) / <alpha-value>)",
      pine: "rgb(var(--pine-smoke-rgb) / <alpha-value>)",
      linen: "rgb(var(--nordic-linen-rgb) / <alpha-value>)",
      frost: "rgb(var(--frost-white-rgb) / <alpha-value>)",
      rule: "rgb(var(--rule-rgb) / <alpha-value>)",
    },
    fontFamily: {
      display: ["var(--font-jost)", "sans-serif"],
      text: ["var(--font-montserrat)", "sans-serif"],
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
