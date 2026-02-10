/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/domain/$1',
    '^@application/(.*)$': '<rootDir>/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/presentation/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/index.ts',
    '!main.ts',
    '!__tests__/**',
  ],
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 40,
      lines: 35,
      statements: 35,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  verbose: true,
};
