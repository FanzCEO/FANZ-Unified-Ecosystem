module.exports = {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,

  // Line formatting
  printWidth: 100,
  endOfLine: 'lf',

  // Bracket formatting
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow function parentheses
  arrowParens: 'always',

  // HTML/JSX formatting
  htmlWhitespaceSensitivity: 'css',
  insertPragma: false,
  requirePragma: false,

  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'preserve',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
