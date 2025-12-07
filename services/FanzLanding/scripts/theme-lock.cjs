const fs = require("node:fs");
const crypto = require("node:crypto");

const protectedFiles = [
  "client/src/index.css",
  "tailwind.config.ts",
  "client/src/components/ui",
].filter((f) => fs.existsSync(f));

const newHash = crypto.createHash("sha256");
for (const f of protectedFiles) {
  if (fs.statSync(f).isDirectory()) {
    // Hash all files in ui directory
    const files = fs.readdirSync(f, { recursive: true });
    files.forEach((file) => {
      if (fs.statSync(`${f}/${file}`).isFile()) {
        newHash.update(fs.readFileSync(`${f}/${file}`));
      }
    });
  } else {
    newHash.update(fs.readFileSync(f));
  }
}

const hashFile = ".theme-lock.hash";
const mode = process.argv[2] || "check";

if (mode === "write") {
  fs.writeFileSync(hashFile, newHash.digest("hex"));
  console.log("🔒 Theme baseline written");
} else {
  const baseline = fs.existsSync(hashFile)
    ? fs.readFileSync(hashFile, "utf8").trim()
    : "";
  const current = newHash.digest("hex");
  if (!baseline) {
    console.error("❌ No theme baseline. Run: npm run theme:lock");
    process.exit(1);
  }
  if (baseline !== current) {
    console.error("❌ Theme files changed. Refusing to proceed.");
    process.exit(2);
  }
  console.log("✅ Theme intact");
}
