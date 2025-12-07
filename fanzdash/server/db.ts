import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const dbUrl = process.env.DATABASE_URL;
const isSqlite = dbUrl.startsWith("sqlite:");
const isPostgres = dbUrl.startsWith("postgresql:") || dbUrl.startsWith("postgres:");

// FanzDash is the admin dashboard - it accesses ALL schemas for cross-platform management
const platformId = process.env.PLATFORM_ID || 'fanzdash';

let db: any;
let pool: any = null;

// Initialize database with error handling
async function initializeDatabase() {
  try {
    if (isSqlite) {
      // Try SQLite configuration with better-sqlite3
      try {
        const Database = (await import('better-sqlite3')).default;
        const { drizzle } = await import('drizzle-orm/better-sqlite3');

        const sqlite = new Database(dbUrl.replace("sqlite:", ""));
        db = drizzle(sqlite, { schema });
        console.log(`🗄️ Connected to SQLite database: ${dbUrl.replace("sqlite:", "")}`);
      } catch (sqliteError: any) {
        console.warn(`⚠️ SQLite connection failed, falling back to mock database:`, sqliteError.message);
        // Create a mock database for development
        db = {
          select: () => ({ from: () => ({ limit: () => [] }) }),
          insert: () => ({ values: () => ({ returning: () => [] }) }),
          update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
          delete: () => ({ where: () => ({ returning: () => [] }) }),
        };
      }
    } else if (isPostgres) {
      // PostgreSQL/Supabase configuration - FanzDash uses shared schema primarily
      // but can query any platform schema via explicit schema.table references
      const pg = await import('pg');
      const { drizzle } = await import('drizzle-orm/node-postgres');

      pool = new pg.default.Pool({
        connectionString: dbUrl,
        max: 10,                     // Maximum pool size
        idleTimeoutMillis: 30000,    // 30 seconds idle timeout
        connectionTimeoutMillis: 5000, // 5 seconds connection timeout
        allowExitOnIdle: false       // Keep pool alive
      });

      // FanzDash uses shared schema for SSO and can access all platform schemas
      pool.on('connect', (client: any) => {
        client.query(`SET search_path TO ${platformId}, shared, public`);
      });

      db = drizzle(pool, { schema });
      console.log(`🐘 Connected to PostgreSQL database (schema: ${platformId} - Admin Dashboard)`);
    } else {
      throw new Error(`Unsupported database URL: ${dbUrl}`);
    }
  } catch (error: any) {
    console.error(`❌ Database connection failed:`, error.message);
    console.log(`🔧 Using mock database for development`);

    // Mock database for development when real connection fails
    db = {
      select: () => ({ from: () => ({ limit: () => [] }) }),
      insert: () => ({ values: () => ({ returning: () => [] }) }),
      update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
      delete: () => ({ where: () => ({ returning: () => [] }) }),
    };
  }
}

// Initialize immediately
await initializeDatabase();

// Export platform schema name for direct queries if needed
export const platformSchema = platformId;
export const sharedSchema = 'shared';

// List of all platform schemas for cross-platform queries
export const allPlatformSchemas = [
  'FanzDash', 'girlfanz', 'gayfanz', 'bearfanz', 'cougarfanz',
  'pupfanz', 'femmefanz', 'transfanz', 'southernfanz', 'taboofanz',
  'guyz', 'dlbroz', 'fanzuncut'
];

export { db, pool };
