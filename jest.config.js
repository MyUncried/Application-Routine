/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  // Le runner Windows sature en lançant trop de workers React Native en parallèle.
  // Deux workers gardent la suite rapide sans provoquer de faux timeouts à 30 s.
  maxWorkers: 2,
  testTimeout: 30000,
};
