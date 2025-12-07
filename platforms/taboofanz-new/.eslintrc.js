module.exports = {
  root: true,
  extends: ['@taboofanz/eslint-config'],
  parserOptions: {
    project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    next: {
      rootDir: ['apps/web'],
    },
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'coverage',
    '*.config.js',
    '*.config.ts',
  ],
};
