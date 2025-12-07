const required = [
  "DATABASE_URL",
  "PUBLIC_DOMAIN",
  "WEB_APP_URL",
  "API_URL",
  "NODE_ENV",
  "JWT_ISS",
  "JWT_AUD",
  "JWT_SECRET",
  "JWT_ACCESS_TTL",
  "JWT_REFRESH_TTL",
];

const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error(
    "❌ Missing required env vars:\n" +
      missing.map((k) => ` - ${k}`).join("\n"),
  );
  console.error("\nSet these in Replit Secrets or your .env file");
  process.exit(1);
}

console.log("✅ ENV check passed");
