// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", "build-check/**", "web-preview/**", ".expo/**"],
  },
  {
    files: ["scripts/**/*.cjs", "tests/**/*.cjs", "eslint.config.js"],
    languageOptions: {
      globals: { Buffer: "readonly", __dirname: "readonly", module: "readonly", require: "readonly", process: "readonly", console: "readonly", URL: "readonly" },
    },
  },
]);
