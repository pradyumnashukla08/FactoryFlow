/**
 * Jest configuration for FactoryFlow server tests.
 */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFilesAfterSetup: [],
  verbose: true,
  // Don't run migrations in tests automatically — the setup file handles it
  testTimeout: 15000,
};
