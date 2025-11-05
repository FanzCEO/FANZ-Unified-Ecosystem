import express from "express";
import { registerRoutes } from "./routes.ts";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
function log(message, source = "express") {
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
    let capturedJsonResponse = undefined;
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
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    // Setup Vite in development mode
    if (process.env.NODE_ENV !== "production") {
        const react = (await import("@vitejs/plugin-react")).default;
        const plugins = [react()];
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
            build: {
                outDir: path.resolve(__dirname, "..", "dist/public"),
                emptyOutDir: true,
            },
            server: {
                middlewareMode: true,
                hmr: { server: httpServer },
                allowedHosts: true,
                fs: {
                    strict: true,
                    deny: ["**/.*"],
                },
            },
            appType: "custom",
        });
        app.use(vite.middlewares);
        app.get(/.*/, async (req, res, next) => {
            const url = req.originalUrl;
            try {
                const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
                let template = await fs.promises.readFile(clientTemplate, "utf-8");
                template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
                const page = await vite.transformIndexHtml(url, template);
                res.status(200).set({ "Content-Type": "text/html" }).end(page);
            }
            catch (e) {
                vite.ssrFixStacktrace(e);
                next(e);
            }
        });
    }
    else {
        // Production: serve static files
        const distPath = path.resolve(__dirname, "public");
        if (!fs.existsSync(distPath)) {
            throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
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
