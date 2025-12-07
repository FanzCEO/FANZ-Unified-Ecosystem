module.exports = {
  apps: [{
    name: "daddyfanz",
    script: "dist/index.js",
    cwd: "/var/www/daddyfanz",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3011,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "b110b5d147419257c95dac120d3e84a1941a986ab516ba82afdb0d1ad441d569"
    }
  }]
};
