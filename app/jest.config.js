export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/mastra'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '\\.spec\\.ts$'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'mastra/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock ESM-only packages
    '^@sindresorhus/slugify$': '<rootDir>/tests/__mocks__/slugify.js',
    '^escape-string-regexp$': '<rootDir>/tests/__mocks__/escape-string-regexp.js',
    '^p-map$': '<rootDir>/tests/__mocks__/p-map.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        resolveJsonModule: true,
        esModuleInterop: true,
      },
    }],
    '^.+\\.jsx?$': ['ts-jest', {
      tsconfig: {
        resolveJsonModule: true,
        esModuleInterop: true,
        allowJs: true,
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@sindresorhus|escape-string-regexp|@mastra|@fal-ai)/)',
  ],
};
