// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // `example/` is a local, git-ignored Expo Router 57 reference scaffold
    // used to check current API conventions; it is not part of the app.
    // `tools/catalogue-admin/generated/` : domaine transpilé, non versionné (build-domain.mjs).
    ignores: ["dist/*", "example/*", "tools/catalogue-admin/generated/*"],
  }
]);
