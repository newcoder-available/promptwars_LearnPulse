import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/.netlify/**", "**/.vercel/**"],
  },
  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { window: "readonly", document: "readonly", console: "readonly", URL: "readonly", Blob: "readonly", SpeechSynthesisUtterance: "readonly" },
    },
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // React 18 automatic JSX runtime
      "react/prop-types": "off", // small internal app; JSDoc used instead
      "react/no-unescaped-entities": "off", // plain-English copy ("I'm", "it's") is valid JSX; escaping hurts readability with no functional benefit
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: { react: { version: "18.3" } },
  },
  {
    files: ["server/**/*.js", "netlify/**/*.js", "api/**/*.js", "*.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { process: "readonly", console: "readonly", fetch: "readonly", URL: "readonly", Response: "readonly" },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
