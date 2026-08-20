module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.test.[jt]s?(x)',
    '**/tests/api/**/*.test.[jt]s?(x)',
    '**/backend/tests/**/*.test.[jt]s?(x)'
  ],
  setupFiles: ['<rootDir>/tests/setupTests.js'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@exodus|isomorphic-dompurify|jsdom)/)',
  ],
};
