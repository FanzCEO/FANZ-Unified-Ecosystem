import type { Preview } from '@storybook/react'
import '../src/index.css'

// Import MSW only for Storybook - never in production
import { initialize, mswLoader } from 'msw-storybook-addon'

// Initialize MSW for Storybook with security constraints
if (typeof window !== 'undefined') {
  initialize({
    onUnhandledRequest: 'warn',
    // Restrict service worker scope to Storybook only
    serviceWorker: {
      url: '/mockServiceWorker.js',
      options: {
        scope: '/storybook',
      },
    },
  })
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    // Security headers for Storybook
    docs: {
      // Disable external iframe loading for security
      inlineStories: true,
    },
    // Configure viewport to prevent external resource loading
    viewport: {
      disable: false,
    },
  },
  loaders: [
    // MSW loader - only active in Storybook environment
    mswLoader,
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme
      
      return (
        <div 
          className={theme === 'dark' ? 'dark' : ''}
          style={{
            minHeight: '100vh',
            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            padding: '1rem',
          }}
        >
          <Story />
        </div>
      )
    },
  ],
}

export default preview