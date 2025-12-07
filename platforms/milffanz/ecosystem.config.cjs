module.exports = {
  apps: [{
    name: "milffanz",
    script: "dist/index.js",
    cwd: "/var/www/milffanz",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3017,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "35ee3eb90f894d8ad3aecd6a629528a24babd9d298ef74a0e85d04a658093b33"
    }
  }]
};
