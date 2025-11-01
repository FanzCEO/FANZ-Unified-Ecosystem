/**
 * 🔐 FANZ Unified Ecosystem - Supabase Client
 * 
 * Centralized Supabase client configuration
 * Project: mcayxybcgxhfttvwmhgm
 * Database: 157 tables, 19 extensions, full production-ready
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Type import - will be generated after database setup
// import type { Database } from '../../database/supabase-types';

// Temporary: Use any for Database type until types are generated
type Database = any;

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mcayxybcgxhfttvwmhgm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jYXl4eWJjZ3hoZnR0dndtaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjc3MjEsImV4cCI6MjA3NzYwMzcyMX0.EBFJ8_9Z_jPrjntg9JBFFbuGuJaN1zKxoXlGk4Jln-s';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate configuration
if (!SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

/**
 * Public Supabase client (uses anon key)
 * Use for client-side operations and Row Level Security
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-application-name': 'fanz-unified-ecosystem'
      }
    }
  }
);

/**
 * Admin Supabase client (uses service role key)
 * ⚠️ Use ONLY for server-side operations that bypass RLS
 * NEVER expose this to the client
 */
export const supabaseAdmin: SupabaseClient<Database> | null = SUPABASE_SERVICE_ROLE_KEY
  ? createClient<Database>(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'x-application-name': 'fanz-unified-ecosystem-admin'
          }
        }
      }
    )
  : null;

/**
 * Get admin client (throws if not configured)
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.'
    );
  }
  return supabaseAdmin;
}

/**
 * Database configuration
 */
export const supabaseConfig = {
  url: SUPABASE_URL,
  projectId: 'mcayxybcgxhfttvwmhgm',
  region: 'us-west-1',
  
  // Database stats
  tables: 157,
  extensions: 19,
  rlsEnabled: 144,
  functions: 122,
  views: 6,
  indexes: 581,
  
  // Feature flags
  features: {
    realtime: true,
    storage: true,
    auth: true,
    functions: true,
    vectors: true,
    postgis: true
  }
};

/**
 * Helper: Execute query with automatic retry
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError;
}

/**
 * Helper: Check Supabase connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
}

/**
 * Helper: Get database stats
 */
export async function getDatabaseStats() {
  const admin = getAdminClient();
  
  const { data, error } = await admin.rpc('get_database_stats');
  
  if (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
  
  return data;
}

// Export types
export type { Database };
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Default export
export default supabase;

