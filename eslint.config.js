import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // Global ignores to skip compiled assets and build artifacts
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.output/**",
      "**/drizzle/**",
      "**/packages/api/drizzle.config.ts",
      "**/android/**",
    ],
  },
  // Base eslint rules
  eslint.configs.recommended,
  // TypeScript rules
  ...tseslint.configs.recommended,
  // Vue rules
  ...pluginVue.configs["flat/recommended"],
  // Global settings for environments
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
        ...globals.es2021,
      },
    },
  },
  // Parser options configuration for Vue Single File Components (SFC)
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        sourceType: "module",
      },
    },
  },
  // Custom project rules
  {
    rules: {
      // General JavaScript rules
      "no-console": "off", // Let developers log info
      "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
      "no-empty": "warn",
      "prefer-const": "warn",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off", // Let Gemini/OpenAI vision return flexible schema formats
      "@typescript-eslint/ban-ts-comment": "off", // Allow @ts-ignore for Framework7 libraries
      "@typescript-eslint/no-empty-object-type": "off", // Allow empty types in vite declarations

      // Vue rules
      "vue/multi-word-component-names": "off", // Framework7 pages are standard single-word names (e.g., Home.vue)
      "vue/no-v-html": "off", // Allow v-html for formatting raw currency/text when safe
      "vue/max-attributes-per-line": "off", // Defer to Prettier configuration
      "vue/attributes-order": "off", // Defer attribute ordering to developer's preference
      "vue/html-self-closing": [
        "warn",
        {
          html: {
            void: "always",
            normal: "always",
            component: "always",
          },
        },
      ],
    },
  },
  // Disable formatting rules that conflict with Prettier
  prettierConfig
);
