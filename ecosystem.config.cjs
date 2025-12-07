// PM2 Ecosystem Configuration for FANZ Monorepo
// Deploy all platforms from a single config

module.exports = {
  apps: [
    // Creator Platforms
    {
      name: 'boyfanz',
      cwd: './platforms/boyfanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        PLATFORM_ID: 'boyfanz',
        PLATFORM_NAME: 'BoyFanz'
      }
    },
    {
      name: 'brofanz',
      cwd: './platforms/brofanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        PLATFORM_ID: 'brofanz',
        PLATFORM_NAME: 'BroFanz'
      }
    },
    {
      name: 'daddyfanz',
      cwd: './platforms/DaddyFanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        PLATFORM_ID: 'daddyfanz',
        PLATFORM_NAME: 'DaddyFanz'
      }
    },
    {
      name: 'girlfanz',
      cwd: './platforms/girlfanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        PLATFORM_ID: 'girlfanz',
        PLATFORM_NAME: 'GirlFanz'
      }
    },
    {
      name: 'pupfanz',
      cwd: './platforms/PupFanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        PLATFORM_ID: 'pupfanz',
        PLATFORM_NAME: 'PupFanz'
      }
    },
    {
      name: 'southernfanz',
      cwd: './platforms/SouthernFanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3018,
        PLATFORM_ID: 'southernfanz',
        PLATFORM_NAME: 'SouthernFanz'
      }
    },
    {
      name: 'taboofanz',
      cwd: './platforms/taboofanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        PLATFORM_ID: 'taboofanz',
        PLATFORM_NAME: 'TabooFanz'
      }
    },
    {
      name: 'transfanz',
      cwd: './platforms/transfanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3009,
        PLATFORM_ID: 'transfanz',
        PLATFORM_NAME: 'TransFanz'
      }
    },
    {
      name: 'fanzuncut',
      cwd: './platforms/fanzuncut',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
        PLATFORM_ID: 'fanzuncut',
        PLATFORM_NAME: 'FanzUncut'
      }
    },
    {
      name: 'bearfanz',
      cwd: './platforms/bearfanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
        PLATFORM_ID: 'bearfanz',
        PLATFORM_NAME: 'BearFanz'
      }
    },
    {
      name: 'cougarfanz',
      cwd: './platforms/cougarfanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3011,
        PLATFORM_ID: 'cougarfanz',
        PLATFORM_NAME: 'CougarFanz'
      }
    },
    {
      name: 'femmefanz',
      cwd: './platforms/femmefanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3012,
        PLATFORM_ID: 'femmefanz',
        PLATFORM_NAME: 'FemmeFanz'
      }
    },
    {
      name: 'gayfanz',
      cwd: './platforms/gayfanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3013,
        PLATFORM_ID: 'gayfanz',
        PLATFORM_NAME: 'GayFanz'
      }
    },
    {
      name: 'milffanz',
      cwd: './platforms/milffanz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3014,
        PLATFORM_ID: 'milffanz',
        PLATFORM_NAME: 'MilfFanz'
      }
    },
    {
      name: 'guyz',
      cwd: './platforms/guyz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3015,
        PLATFORM_ID: 'guyz',
        PLATFORM_NAME: 'Guyz'
      }
    },
    {
      name: 'dlbroz',
      cwd: './platforms/dlbroz',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3016,
        PLATFORM_ID: 'dlbroz',
        PLATFORM_NAME: 'DLBroz'
      }
    },

    // Infrastructure Apps
    {
      name: 'fanzdash',
      cwd: './apps/fanzdash',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        PLATFORM_ID: 'fanzdash',
        PLATFORM_NAME: 'FANZDash'
      }
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'root',
      host: '67.217.54.66',
      ref: 'origin/main',
      repo: 'git@github.com:FanzCEO/fanz-monorepo.git',
      path: '/var/www/fanz-monorepo',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
