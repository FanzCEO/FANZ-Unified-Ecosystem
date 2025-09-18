module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'security',
    'node',
    'promise',
    'unicorn',
  ],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended',
    'plugin:node/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'prettier', // Must be last
  ],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { accessibility: 'explicit' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'static-field',
          'static-method',
          'instance-field',
          'constructor',
          'instance-method',
        ],
      },
    ],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      {
        selector: 'method',
        format: ['camelCase'],
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
    ],

    // Import rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',

    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',

    // Node.js rules
    'node/no-missing-import': 'off', // Handled by import/no-unresolved
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-unpublished-import': [
      'error',
      {
        allowModules: [
          'jest',
          '@types/jest',
          '@types/node',
          'ts-node',
          'tsx',
          'eslint',
          'prettier',
        ],
      },
    ],

    // Promise rules
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error',
    'promise/param-names': 'error',
    'promise/no-return-wrap': 'error',

    // Unicorn rules (selectively enabled)
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/no-null': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
      },
    ],
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/prefer-node-protocol': 'error',

    // General ESLint rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'eol-last': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      },
    ],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'computed-property-spacing': ['error', 'never'],
    'no-multi-spaces': 'error',
    'key-spacing': ['error', { beforeColon: false, afterColon: true }],
    'space-before-blocks': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'no-whitespace-before-property': 'error',
    'keyword-spacing': 'error',
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],

    // Complexity rules
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-nested-callbacks': ['warn', 3],
    'max-params': ['warn', 5],
    'max-statements': ['warn', 25],
    'max-statements-per-line': ['error', { max: 1 }],
    'max-lines-per-function': ['warn', { max: 100, skipComments: true }],

    // Best practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-return-await': 'error',
    'require-await': 'error',
    'no-await-in-loop': 'warn',
    'prefer-promise-reject-errors': 'error',
    'no-throw-literal': 'error',
    'consistent-return': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'no-fallthrough': 'error',
    'no-magic-numbers': [
      'warn',
      {
        ignore: [-1, 0, 1, 2],
        ignoreArrayIndexes: true,
        enforceConst: true,
        detectObjects: false,
      },
    ],
    'no-duplicate-imports': 'error',
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
  },
  overrides: [
    // Test files
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        'max-statements': 'off',
      },
    },
    // Demo and script files
    {
      files: ['**/scripts/**/*', '**/demo/**/*'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
        'max-statements': 'off',
        'unicorn/no-process-exit': 'off',
      },
    },
    // Configuration files
    {
      files: ['*.config.js', '*.config.ts', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        'import/no-default-export': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'unicorn/prefer-module': 'off',
      },
    },
    // Type definition files
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'import/no-default-export': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '*.min.js',
    '*.bundle.js',
    '.next/',
    '.cache/',
  ],
};