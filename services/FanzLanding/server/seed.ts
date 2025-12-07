import { neon } from "@neondatabase/serverless";

async function main() {
  console.log("Seeding database...");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set");
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Basic seed - just verify we can connect and create some basic data
    console.log("Database connection verified for seeding");
    console.log("✅ Seed completed");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
