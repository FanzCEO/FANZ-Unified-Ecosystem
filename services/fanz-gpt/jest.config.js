module.exports = {
  // Basic configuration
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // TypeScript configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: false,
    }],
  },
  
  // File patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  testIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],
  
  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/types$': '<rootDir>/src/types',
    '^@/utils$': '<rootDir>/src/utils',
    '^@/services$': '<rootDir>/src/services',
    '^@/providers$': '<rootDir>/src/providers',
    '^@/middleware$': '<rootDir>/src/middleware',
    '^@/models$': '<rootDir>/src/models',
    '^@/controllers$': '<rootDir>/src/controllers',
    '^@/config$': '<rootDir>/src/config',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Timeout configuration
  testTimeout: 30000, // 30 seconds for AI API calls
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage',
      filename: 'test-report.html',
      expand: true,
    }],
  ],
  
  // Environment variables for testing
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test environment setup
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  
  // Maximum worker configuration
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],
};