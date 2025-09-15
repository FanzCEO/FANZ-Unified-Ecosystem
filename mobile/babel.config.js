module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    // Reanimated plugin should be listed last
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.js',
          '.android.js',
          '.native.js',
          '.js',
          '.ios.ts',
          '.android.ts',
          '.native.ts',
          '.ts',
          '.ios.tsx',
          '.android.tsx',
          '.native.tsx',
          '.tsx',
          '.json',
        ],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@utils': './src/utils',
          '@constants': './src/constants',
          '@hooks': './src/hooks',
          '@store': './src/store',
          '@types': './src/types',
          '@assets': './src/assets',
          '@navigation': './src/navigation',
          '@config': './src/config',
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    // Transform for react-native-paper
    [
      'babel-plugin-react-native-paper',
      {
        theme: true,
      },
    ],
  ],
  env: {
    production: {
      plugins: [
        'react-native-paper/babel',
        'transform-remove-console',
      ],
    },
  },
};