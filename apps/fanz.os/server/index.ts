import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { securityService, rateLimiters } from "./securityService";
import compression from "compression";
import Redis from "ioredis";
import { setupVite, serveStatic, log as viteLog } from "./vite";
import { performanceMonitor, cacheResponse, optimizeRequest, monitorMemory } from "./performanceService";
import { apiRateLimit, authRateLimit, uploadRateLimit } from "./rateLimitingService";

// Logger utility
const log = (message: string) => {
  viteLog(message, 'server');
};

// Initialize performance monitoring
monitorMemory();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors()); // Enable CORS
app.use(compression()); // Enable compression
app.use(optimizeRequest); // Security and optimization headers
app.use(performanceMonitor); // Enhanced performance monitoring

// Apply rate limiting to API routes
app.use('/api/auth', authRateLimit);
app.use('/api/upload', uploadRateLimit);
app.use('/api', apiRateLimit);

// Enable response caching for static content
app.use(cacheResponse(300)); // 5 minute cache

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
    // In a production environment, avoid re-throwing the error directly to prevent leaking sensitive information.
    // Instead, log the error appropriately.
    if (process.env.NODE_ENV !== 'production') {
      throw err;
    } else {
      log(`Error occurred: ${err.message}`);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();