/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
  resetMocks: true,
  resetModules: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'cobertura'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'test-results.xml'
      }
    ]
  ],
  moduleNameMapper: {
    "^@catbee/utils$": "<rootDir>/src",
    "^@catbee/utils/(.*)$": "<rootDir>/src/$1"
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ['**/tests/**/*.test.ts'],
  coveragePathIgnorePatterns: ['index.ts', 'src/types', 'src/servers/server.ts'],
  testResultsProcessor: 'jest-sonar-reporter',
  detectOpenHandles: true,
  setupFilesAfterEnv: ['<rootDir>/tests/__mocks__/default.mock.ts'],
};
