export default {
  testEnvironment: "node",
  transform: { "^.+\\.(t|j)sx?$": ["@swc/jest"] },
  moduleFileExtensions: ["ts", "tsx", "js"],
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};


