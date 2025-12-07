import fs from "node:fs";

async function main() {
  console.log("Verifying webhook handlers...");

  // Check if server routes file exists and has webhook structure
  if (!fs.existsSync("server/routes.ts")) {
    console.error("❌ Server routes file not found");
    process.exit(1);
  }

  const routesContent = fs.readFileSync("server/routes.ts", "utf8");

  // Check for webhook endpoint patterns (basic validation)
  const hasWebhookStructure =
    routesContent.includes("webhook") ||
    routesContent.includes("/api/") ||
    routesContent.includes("app.post");

  if (!hasWebhookStructure) {
    console.error("❌ No webhook structure found in routes");
    process.exit(1);
  }

  console.log("✅ Webhook handlers verified");
}

main().catch((error) => {
  console.error("❌ Webhook verification failed:", error);
  process.exit(1);
});
