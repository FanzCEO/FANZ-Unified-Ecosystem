module.exports = {
  apps: [{
    name: "bearfanz",
    script: "dist/index.js",
    cwd: "/var/www/bearfanz",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3005,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "001dbf224a7b390dee1a46207ede4d1bda2b72082697ba939c201ea807df4ec5"
    }
  }]
};
