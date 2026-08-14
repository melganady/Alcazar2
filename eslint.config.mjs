import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Brand guardrail: raw colour values are banned outside design/tokens.css.
    // The styleguide is exempt — it prints hex values as documentation text.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    // Exempt by necessity, not convenience:
    //   styleguide — prints hex values as documentation text
    //   lib/email  — mail clients do not support CSS variables
    //   app/og     — ImageResponse renders in isolation with no stylesheet
    //   *.test.ts  — contrast tests assert on literal colour values
    ignores: [
      "app/**/styleguide/**",
      "lib/email/**",
      "app/og/**",
      "**/*.test.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Raw hex colours are banned in components — consume tokens from design/tokens.css via Tailwind classes.",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{6}\\b/]",
          message:
            "Raw hex colours are banned in components — consume tokens from design/tokens.css via Tailwind classes.",
        },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
