const fs = require("node:fs");
const path = require("node:path");

const routes = [
  "/",
  "/platforms-services",
  "/compliance",
  "/login",
  "/register",
  "/ref/:code",
  "/status",
  "/blog",
  "/blog/:slug",
  "/legal/privacy",
  "/legal/terms",
  "/legal/acceptable-use",
  "/legal/2257",
  "/compliance/kyc",
  "/compliance/star-consent",
  "/compliance/documents",
  "/contact",
  "/careers",
  "/accessibility",
  "/system",
  "/*",
];

const manifest = routes.map((r) => ({
  path: r,
  component: "Auto",
  requiresAuth: false,
}));

fs.mkdirSync(path.resolve("client/dist"), { recursive: true });
fs.writeFileSync(
  path.resolve("client/dist/routeManifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log("✅ routeManifest.json written with", manifest.length, "routes");
