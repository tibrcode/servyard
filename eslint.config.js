import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores (generated/build/system folders)
  {
    ignores: [
      "dist",
      "node_modules",
      "android",
      "ios",
      "coverage",
      "**/*.min.js",
      "supabase/**",
    ],
  },
  // TypeScript / React code
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
      // Project-specific relaxations (adjust over time)
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": "off",
    },
  },
  // Config and build scripts: allow require() and be lenient
  {
    files: [
      "*.config.{js,ts,mjs,cjs}",
      "**/vite.config.{js,ts,mjs,cjs}",
      "**/postcss.config.{js,ts,mjs,cjs}",
      "**/tailwind.config.{js,ts,mjs,cjs}",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  // Optionally lint plain JS files in src only (avoid android assets)
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  }
);
