import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./server/routes";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files in production mode (bypassing Vite completely)
  const distPath = path.resolve(__dirname, "dist", "public");
  
  // Create a minimal static directory if it doesn't exist
  if (!fs.existsSync(distPath)) {
    log("Creating minimal static directory...");
    fs.mkdirSync(distPath, { recursive: true });
    
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GirlFanz</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
            padding-top: 50px;
        }
        h1 {
            font-size: 3em;
            margin-bottom: 0.5em;
        }
        .status {
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .endpoint {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }
        .success {
            color: #4ade80;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GirlFanz Server</h1>
        <div class="status">
            <p class="success">✅ Server is running successfully!</p>
            <p>The Express API server is now active and ready to handle requests.</p>
            
            <div class="endpoint">
                <strong>Health Check:</strong> GET /api/health
            </div>
            
            <div class="endpoint">
                <strong>API Base URL:</strong> http://localhost:5000/api
            </div>
            
            <p style="margin-top: 20px;">
                <small>Note: This is a minimal fallback page. The full React app will be served when Vite is properly configured.</small>
            </p>
        </div>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(distPath, "index.html"), indexHtml);
    log("✅ Created minimal static directory with index.html");
  }

  app.use(express.static(distPath));

  // Fallthrough to index.html for client-side routing
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  // Start the server
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`✨ GirlFanz server is running on port ${port}`);
    log(`📡 Health endpoint: http://localhost:${port}/api/health`);
  });
})();