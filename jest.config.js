module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/backend/tests/**/*.test.[jt]s?(x)'
  ],
  setupFiles: ['<rootDir>/backend/tests/setupTests.js'],
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
