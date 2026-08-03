module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.[jt]s?(x)',
    '**/tests/api/**/*.[jt]s?(x)',
    '**/backend/tests/**/*.[jt]s?(x)'
  ],
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
