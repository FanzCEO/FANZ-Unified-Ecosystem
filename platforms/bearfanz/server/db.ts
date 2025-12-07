import * as schema from "@shared/schema";
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const dbUrl = process.env.DATABASE_URL;

// Configure Neon for WebSocket
neonConfig.webSocketConstructor = ws;

// Create connection pool
const pool = new Pool({ 
  connectionString: dbUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  maxUses: 7500,
  allowExitOnIdle: false
});

// Initialize Drizzle with Neon
const db = drizzleNeon({ client: pool, schema });

console.log(`🐘 Connected to PostgreSQL database`);

export { db, pool };
