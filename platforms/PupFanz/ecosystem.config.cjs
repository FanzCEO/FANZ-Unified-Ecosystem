module.exports = {
  apps: [{
    name: "pupfanz",
    script: "dist/index.js",
    cwd: "/var/www/pupfanz",
    node_args: "--no-warnings",
    env: {
      NODE_ENV: "production",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      PORT: 3007,
      DATABASE_URL: "postgresql://postgres:Dg1FcM4jk5XkKE3B@db.mcayxybcgxhfttvwmhgm.supabase.co:6543/postgres?sslmode=require",
      SESSION_SECRET: "ea7c1158d42d27ba94bfa090f417448d99028a708c384ace05ad5571912b469e"
    }
  }]
};
