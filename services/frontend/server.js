import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use PORT from environment or default to 5000
const PORT = process.env.PORT || 5000;

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle health check endpoint for deployment
  if (req.url === "/__replit_health_check__" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle API requests - proxy to backend
  if (req.url.startsWith("/api")) {
    // For now, return a placeholder response
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "API endpoint - backend services available",
        status: "ready",
      }),
    );
    return;
  }

  // Serve static files from dist directory
  let filePath = path.join(
    __dirname,
    "dist",
    req.url === "/" ? "index.html" : req.url,
  );

  // Check if dist directory exists, if not, build first
  const distPath = path.join(__dirname, "dist");
  if (!fs.existsSync(distPath)) {
    res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("Application is building, please wait...");
    return;
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // For client-side routing, serve index.html
    filePath = path.join(__dirname, "dist", "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Serve index.html as fallback for client-side routing
      const indexPath = path.join(__dirname, "dist", "index.html");
      fs.readFile(indexPath, (indexErr, indexContent) => {
        if (indexErr) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(indexContent);
      });
      return;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
});

// Listen on all interfaces (0.0.0.0) for deployment
server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `FANZ Frontend Server running on http://0.0.0.0:${PORT}`,
  );
  console.log(`Health check available at http://0.0.0.0:${PORT}/health`);
});
