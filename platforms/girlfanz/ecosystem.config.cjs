module.exports = {
  apps: [{
    name: 'girlfanz',
    script: 'dist/index.js',
    cwd: '/var/www/girlfanz',
    node_args: '--no-warnings',
    env: {
      NODE_ENV: 'production',
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
      PORT: 3015
    }
  }]
};
