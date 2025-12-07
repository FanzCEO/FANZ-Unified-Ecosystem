import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

async function main() {
  console.log("Starting health checks...");

  // Check database connection
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }

    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    console.log("✅ Database connection OK");
  } catch (error) {
    console.error(
      "❌ Database connection failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }

  // Check required environment variables (relaxed for dev)
  const criticalEnvs = ["DATABASE_URL"];
  const optionalEnvs = ["WEB_APP_URL", "API_URL", "NODE_ENV"];

  for (const env of criticalEnvs) {
    if (!process.env[env]) {
      console.error(`❌ Missing critical environment variable: ${env}`);
      process.exit(1);
    }
  }

  for (const env of optionalEnvs) {
    if (!process.env[env]) {
      console.log(`⚠️  Optional env var missing: ${env} (using defaults)`);
    }
  }
  console.log("✅ Environment variables OK");

  // Check if critical files exist
  const criticalFiles = [
    "client/src/App.tsx",
    "client/src/main.tsx",
    "server/index.ts",
    "shared/schema.ts",
  ];

  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Critical file missing: ${file}`);
      process.exit(1);
    }
  }
  console.log("✅ Critical files present");

  console.log("✅ All health checks passed");
}

main().catch((error) => {
  console.error("❌ Health check failed:", error);
  process.exit(1);
});
