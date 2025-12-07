module.exports = {
  apps: [{
    name: "gayfanz",
    script: "dist/index.js",
    cwd: "/var/www/gayfanz",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3014,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "e6f6893bb4d14d1957c3a66cc510065a0c62777325a4ec18c74fa8fd09ff68ef"
    }
  }]
};
