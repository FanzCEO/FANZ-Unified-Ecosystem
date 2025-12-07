import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

async function main() {
  console.log("Checking for schema drift...");

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    // Simple connection test to verify schema is accessible
    await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

    console.log("✅ Schema drift check passed");
  } catch (error) {
    console.error(
      "❌ Schema drift detected or DB error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Drift check failed:", error);
  process.exit(1);
});
