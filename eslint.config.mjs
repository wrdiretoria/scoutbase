import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // react-hooks v7 introduced new rules not present when this codebase was
      // written — disable to unblock builds without mass-refactoring existing code.
      "react-hooks/set-state-in-effect": "off",
      // Stylistic — curly-quote enforcement breaks many existing JSX strings.
      "react/no-unescaped-entities": "off",
      // Internal navigation uses <a> in a few legacy components; non-critical.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
