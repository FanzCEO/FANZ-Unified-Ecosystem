import fs from "node:fs";
import path from "node:path";

async function main() {
  console.log("Verifying API contracts...");

  // Check if key API route files exist
  const apiFiles = [
    "server/routes.ts",
    "server/storage.ts",
    "shared/schema.ts",
  ];

  for (const file of apiFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ API file missing: ${file}`);
      process.exit(1);
    }
  }

  // Read routes file and check for basic API endpoints
  const routesContent = fs.readFileSync("server/routes.ts", "utf8");

  const requiredRoutes = [
    "/api/platforms",
    "/api/services",
    "/api/featured/creators",
    "/api/videos/featured",
  ];

  for (const route of requiredRoutes) {
    if (!routesContent.includes(route)) {
      console.error(`❌ Required API route missing: ${route}`);
      process.exit(1);
    }
  }

  console.log("✅ API contracts verified");
}

main().catch((error) => {
  console.error("❌ Contract verification failed:", error);
  process.exit(1);
});
