/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  testTimeout: 30000,
};
