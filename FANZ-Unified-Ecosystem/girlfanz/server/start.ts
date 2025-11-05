import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import replitAuthRouter from "./replitAuth.js";





const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const httpServer = createServer(app);
  
  app.use("/api/auth/replit", replitAuthRouter);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add aggressive cache-busting headers for development
  app.use((req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      // Aggressive cache prevention for development
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      // Prevent ETag caching
      res.removeHeader('ETag');
      res.removeHeader('Last-Modified');
    }
    next();
  });

  // Setup Vite in development mode
  if (process.env.NODE_ENV !== "production") {
    const reactSwc = (await import("@vitejs/plugin-react-swc")).default;
    
    const plugins = [
      reactSwc()
    ];
    
    // Add Replit plugins in development mode
    try {
      const { default: devBanner } = await import("@replit/vite-plugin-dev-banner");
      const { default: cartographer } = await import("@replit/vite-plugin-cartographer");
      const { default: errorModal } = await import("@replit/vite-plugin-runtime-error-modal");
      
      plugins.push(devBanner(), cartographer(), errorModal());
    } catch (err) {
      log("Replit plugins not available (optional)", "vite");
    }
    
    const vite = await createViteServer({
      configFile: false,
      plugins,
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "..", "client", "src"),
          "@shared": path.resolve(__dirname, "..", "shared"),
          "@assets": path.resolve(__dirname, "..", "attached_assets"),
        },
      },
      root: path.resolve(__dirname, "..", "client"),
      cacheDir: path.resolve(__dirname, "..", "node_modules", ".vite"),
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-dom/client',
          'wouter',
          '@tanstack/react-query',
          'zod',
          'react-hook-form',
          '@hookform/resolvers/zod'
        ],
        exclude: ['@replit/vite-plugin-dev-banner', '@replit/vite-plugin-cartographer', '@replit/vite-plugin-runtime-error-modal'],
        force: false,
        esbuildOptions: {
          target: 'esnext'
        }
      },
      build: {
        outDir: path.resolve(__dirname, "..", "dist/public"),
        emptyOutDir: true,
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom', 'react-dom/client'],
              'vendor-router': ['wouter'],
              'vendor-query': ['@tanstack/react-query'],
              'vendor-forms': ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
              'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-toast']
            }
          }
        }
      },
      server: {
        middlewareMode: true,
        hmr: false,
        allowedHosts: true as const,
        fs: {
          strict: true,
          deny: ["**/.*"],
        },
        watch: {
          usePolling: false,
          interval: 100
        }
      },
      appType: "custom",
      logLevel: 'info'
    });

    app.use(vite.middlewares);
    
    // Fallback handler for HTML - let Vite transform it properly
    app.get(/.*/, async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
        const template = await fs.promises.readFile(clientTemplate, "utf-8");
        const html = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production: serve static files
    const distPath = path.resolve(__dirname, "public");

    if (!fs.existsSync(distPath)) {
      throw new Error(
        `Could not find the build directory: ${distPath}, make sure to build the client first`,
      );
    }

    app.use(express.static(distPath));

    app.get(/.*/, (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
