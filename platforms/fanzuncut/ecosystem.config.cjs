module.exports = {
  apps: [{
    name: "fanzuncut",
    script: "dist/index.js",
    cwd: "/var/www/fanzuncut",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3020,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "ba6b3f227dd905f0207cff3f1b1d51aaf947c0ebbc0a3ecdcd7e34409ce12b03"
    }
  }]
};
