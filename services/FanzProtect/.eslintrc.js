// FanzProtect Legal Platform - ESLint Configuration
// Comprehensive linting rules for TypeScript, React, and Node.js

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y',
    'import',
    'security',
    'promise'
  ],
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  },
  rules: {
    // =============================================
    // GENERAL RULES
    // =============================================
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],

    // =============================================
    // TYPESCRIPT RULES
    // =============================================
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-import-type-side-effects': 'error',

    // =============================================
    // REACT RULES
    // =============================================
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript instead
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // =============================================
    // IMPORT RULES
    // =============================================
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always'
      }
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-unused-modules': 'warn',

    // =============================================
    // SECURITY RULES (Critical for Legal Platform)
    // =============================================
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',

    // =============================================
    // PROMISE RULES
    // =============================================
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error',
    'promise/param-names': 'error',
    'promise/no-return-wrap': 'error'
  },
  overrides: [
    // =============================================
    // BACKEND/SERVER SPECIFIC RULES
    // =============================================
    {
      files: ['server/**/*.ts', 'server/**/*.js'],
      env: {
        node: true,
        browser: false
      },
      rules: {
        'no-console': 'off', // Allow console in server code
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-nodejs-modules': 'off'
      }
    },

    // =============================================
    // FRONTEND SPECIFIC RULES
    // =============================================
    {
      files: ['src/**/*.tsx', 'src/**/*.ts'],
      env: {
        browser: true,
        node: false
      },
      rules: {
        'jsx-a11y/anchor-is-valid': 'off', // Next.js Link component
        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn'
      }
    },

    // =============================================
    // TEST FILES
    // =============================================
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'test/**/*.ts',
        'tests/**/*.ts'
      ],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'security/detect-object-injection': 'off'
      }
    },

    // =============================================
    // CONFIGURATION FILES
    // =============================================
    {
      files: [
        '*.config.js',
        '*.config.ts',
        '.eslintrc.js',
        'vite.config.ts',
        'tailwind.config.js'
      ],
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },

    // =============================================
    // LEGAL SENSITIVE FILES (Extra Security)
    // =============================================
    {
      files: [
        'server/services/**/*.ts',
        'shared/schema.ts',
        'server/websocket/**/*.ts'
      ],
      rules: {
        'security/detect-object-injection': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unsafe-assignment': 'error',
        '@typescript-eslint/no-unsafe-member-access': 'error',
        '@typescript-eslint/no-unsafe-call': 'error',
        '@typescript-eslint/no-unsafe-return': 'error'
      }
    }
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    '.next/',
    'coverage/',
    '*.min.js',
    'public/',
    '.docker/',
    'docker-compose.yml'
  ]
};