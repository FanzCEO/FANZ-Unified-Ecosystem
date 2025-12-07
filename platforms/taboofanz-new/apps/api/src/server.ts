import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './context';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'taboofanz-api',
    timestamp: new Date().toISOString(),
  });
});

// tRPC handler
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`❌ tRPC error on path '${path}':`, error);
    },
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`
  🌙 TabooFanz API Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ Running on port ${PORT}
  📡 tRPC endpoint: http://localhost:${PORT}/trpc
  🔍 Health check: http://localhost:${PORT}/health
  ━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export { app };
