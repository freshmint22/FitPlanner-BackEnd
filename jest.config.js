module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 👉 Carga variables desde .env.test antes de correr Jest
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Use our TS setup that seeds the test database
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
};
