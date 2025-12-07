module.exports = {
  apps: [{
    name: "femmefanz",
    script: "dist/index.js",
    cwd: "/var/www/femmefanz",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3013,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "b0e52fb0f8745f37fb6791d4f3c947c54e0ec4cfb57effdc40dc32614c8b93df"
    }
  }]
};
