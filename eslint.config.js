import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // These files intentionally co-locate a component with related non-component
    // exports — shadcn/ui primitives export their `cva` variants and helper
    // hooks, and our context modules pair a Provider with its consumer hook.
    // Splitting them purely to satisfy react-refresh's HMR heuristic would add
    // churn without runtime benefit, so the rule is disabled here.
    files: ["src/components/ui/**/*.{ts,tsx}", "src/hooks/**/*.tsx", "src/lib/i18n.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
