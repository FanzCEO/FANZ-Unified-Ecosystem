import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async (config) => {
    // Security hardening for Vite in Storybook
    config.build = config.build || {}
    config.build.minify = 'esbuild' // Use esbuild instead of terser to avoid eval
    config.build.sourcemap = false  // Disable sourcemaps for security
    
    config.optimizeDeps = config.optimizeDeps || {}
    config.optimizeDeps.include = [
      // Pre-bundle common deps to avoid runtime module loading
      'react',
      'react-dom',
      '@storybook/blocks',
    ]
    
    // Ensure CSP-friendly worker handling
    config.worker = config.worker || {}
    config.worker.format = 'es'
    
    return config
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: [
    // Only serve local static assets, no remote CDNs
    '../public',
  ],
}

export default config