const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // Support for SVG files
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@screens': path.resolve(__dirname, 'src/screens'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@constants': path.resolve(__dirname, 'src/constants'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
    assetExts: [
      'bmp',
      'gif',
      'jpg',
      'jpeg',
      'png',
      'psd',
      'svg',
      'webp',
      'mp4',
      'webm',
      'wav',
      'mp3',
      'aac',
      'm4a',
      'aiff',
      'caf',
      'ttf',
      'otf',
      'woff',
      'woff2',
      'json',
    ],
    sourceExts: [
      'js',
      'jsx',
      'ts',
      'tsx',
      'json',
      'svg',
    ],
    platforms: ['ios', 'android', 'native', 'web'],
  },
  watchFolders: [
    path.resolve(__dirname, '../backend/src/types'),
    path.resolve(__dirname, '../shared'),
  ],
  maxWorkers: 2,
  resetCache: false,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);