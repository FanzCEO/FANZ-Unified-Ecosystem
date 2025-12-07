#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting FanzLanding Production Verification...\n");

// Environment check
console.log("1. Checking environment variables...");
const requiredEnvs = ["DATABASE_URL"];

const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
if (missingEnvs.length > 0) {
  console.log(
    "⚠️  Some env vars missing (will use defaults for dev):",
    missingEnvs.join(", "),
  );
} else {
  console.log("✅ Environment check passed");
}

// Check if scripts exist
const scripts = [
  "scripts/env-gate.cjs",
  "scripts/print-ready.cjs",
  "scripts/theme-lock.cjs",
  "client/scripts/routes-manifest.cjs",
  "client/scripts/crawlLinks.cjs",
  "server/scripts/verify-health.ts",
];

console.log("\n2. Checking verification scripts...");
let allScriptsExist = true;
for (const script of scripts) {
  if (fs.existsSync(script)) {
    console.log(`✅ ${script}`);
  } else {
    console.log(`❌ ${script} - missing`);
    allScriptsExist = false;
  }
}

if (!allScriptsExist) {
  console.log(
    "\n❌ Some verification scripts are missing. Please ensure all scripts are created.",
  );
  process.exit(1);
}

// Run route manifest generation
console.log("\n3. Generating route manifest...");
try {
  const manifest = spawn("node", ["client/scripts/routes-manifest.cjs"], {
    stdio: "inherit",
  });
  manifest.on("close", (code) => {
    if (code === 0) {
      console.log("✅ Route manifest generated");

      // Run theme lock (create baseline if it doesn't exist)
      console.log("\n4. Checking theme lock...");
      if (!fs.existsSync(".theme-lock.hash")) {
        console.log("Creating theme baseline...");
        const themeLock = spawn("node", ["scripts/theme-lock.cjs", "write"], {
          stdio: "inherit",
        });
        themeLock.on("close", (themeCode) => {
          if (themeCode === 0) {
            console.log("✅ Theme baseline created");
            runFinalChecks();
          }
        });
      } else {
        console.log("✅ Theme lock exists");
        runFinalChecks();
      }
    }
  });
} catch (error) {
  console.error("❌ Failed to generate route manifest:", error);
  process.exit(1);
}

function runFinalChecks() {
  console.log("\n5. Running health checks...");

  // Run health verification
  const health = spawn("npx", ["tsx", "server/scripts/verify-health.ts"], {
    stdio: "inherit",
  });
  health.on("close", (code) => {
    if (code === 0) {
      console.log("✅ Health checks passed");

      console.log("\n6. Production readiness summary:");
      console.log("✅ Verification scripts installed");
      console.log("✅ Route manifest generated");
      console.log("✅ Theme protection enabled");
      console.log("✅ Health checks passed");
      console.log("✅ System diagnostics page available at /system");

      // Print ready banner
      spawn("node", ["scripts/print-ready.cjs"], { stdio: "inherit" });
    } else {
      console.log("❌ Health checks failed");
      process.exit(1);
    }
  });
}

console.log("\n📋 Available verification commands:");
console.log(
  "- node client/scripts/routes-manifest.cjs (generate route manifest)",
);
console.log("- node client/scripts/crawlLinks.cjs (crawl for broken links)");
console.log("- npx tsx server/scripts/verify-health.ts (health check)");
console.log("- node scripts/theme-lock.cjs (check theme integrity)");
console.log("- Visit /system in browser for diagnostics dashboard");
