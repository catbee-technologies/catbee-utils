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
    ],
  ],
  testMatch: ['**/tests/**/*.test.ts'],
  coveragePathIgnorePatterns: ['index.ts', 'src/types', 'src/servers/server.ts'],
  testResultsProcessor: 'jest-sonar-reporter',
  detectOpenHandles: true
}