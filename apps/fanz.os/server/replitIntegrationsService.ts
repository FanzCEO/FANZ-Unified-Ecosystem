import { Request, Response } from 'express';
import { ObjectStorageService } from './objectStorage';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Replit Platform Integrations Service
 * Manages integration with all Replit platform services:
 * - Replit Auth (already implemented)
 * - Object Storage (App Storage)
 * - SQL Database
 * - Deployment API
 * - File System API
 */

export interface ReplitServiceStatus {
  auth: boolean;
  database: boolean;
  objectStorage: boolean;
  deployment: boolean;
}

export class ReplitIntegrationsService {
  private objectStorageService: ObjectStorageService;

  constructor() {
    this.objectStorageService = new ObjectStorageService();
  }

  /**
   * Get status of all Replit platform services
   */
  async getServiceStatus(): Promise<ReplitServiceStatus> {
    const status: ReplitServiceStatus = {
      auth: false,
      database: false,
      objectStorage: false,
      deployment: false
    };

    // Check Replit Auth
    try {
      status.auth = !!(process.env.REPL_ID && process.env.REPLIT_DOMAINS);
    } catch (error) {
      console.error('Replit Auth check failed:', error);
    }

    // Check Database
    try {
      await db.select().from(users).limit(1);
      status.database = true;
    } catch (error) {
      console.error('Database check failed:', error);
    }

    // Check Object Storage
    try {
      const publicPaths = this.objectStorageService.getPublicObjectSearchPaths();
      const privateDir = this.objectStorageService.getPrivateObjectDir();
      status.objectStorage = !!(publicPaths.length > 0 && privateDir);
    } catch (error) {
      console.error('Object Storage check failed:', error);
    }

    // Check Deployment Environment
    try {
      status.deployment = !!(process.env.REPL_ID && process.env.REPLIT_DOMAINS);
    } catch (error) {
      console.error('Deployment check failed:', error);
    }

    return status;
  }

  /**
   * Get comprehensive Replit environment information
   */
  getReplitEnvironmentInfo() {
    return {
      replId: process.env.REPL_ID,
      replitDomains: process.env.REPLIT_DOMAINS?.split(',') || [],
      replitUser: process.env.REPLIT_USER,
      replitUser_: process.env.REPLIT_USER_,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      databaseUrl: process.env.DATABASE_URL ? 'Connected' : 'Not Connected',
      objectStorage: {
        publicPaths: process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',') || [],
        privateDir: process.env.PRIVATE_OBJECT_DIR || null
      }
    };
  }

  /**
   * Initialize all Replit platform integrations
   */
  async initializeIntegrations(): Promise<void> {
    const status = await this.getServiceStatus();
    
    console.log('🚀 Initializing Replit Platform Integrations...');
    console.log(`✅ Auth: ${status.auth ? 'Connected' : 'Not Connected'}`);
    console.log(`✅ Database: ${status.database ? 'Connected' : 'Not Connected'}`);
    console.log(`✅ Object Storage: ${status.objectStorage ? 'Connected' : 'Not Connected'}`);
    console.log(`✅ Deployment: ${status.deployment ? 'Connected' : 'Not Connected'}`);

    if (!status.auth) {
      console.warn('⚠️  Replit Auth not properly configured');
    }
    
    if (!status.database) {
      console.error('❌ Database connection failed');
    }
    
    if (!status.objectStorage) {
      console.error('❌ Object Storage not configured');
    }

    console.log('🎉 Replit Platform Integration Complete!');
  }

  /**
   * Get deployment information
   */
  getDeploymentInfo() {
    return {
      isDeployed: !!process.env.REPL_DEPLOYMENT,
      replId: process.env.REPL_ID,
      domains: process.env.REPLIT_DOMAINS?.split(',') || [],
      environment: process.env.NODE_ENV,
      port: process.env.PORT || '5000',
      uptime: process.uptime()
    };
  }

  /**
   * Health check endpoint for monitoring
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    services: ReplitServiceStatus;
    deployment: any;
    uptime: number;
  }> {
    const services = await this.getServiceStatus();
    const deployment = this.getDeploymentInfo();
    
    const allHealthy = Object.values(services).every(s => s);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
      deployment,
      uptime: process.uptime()
    };
  }

  /**
   * Get object storage configuration
   */
  getObjectStorageConfig() {
    try {
      return {
        bucketId: process.env.PRIVATE_OBJECT_DIR?.split('/')[1] || null,
        publicPaths: this.objectStorageService.getPublicObjectSearchPaths(),
        privateDir: this.objectStorageService.getPrivateObjectDir(),
        configured: true
      };
    } catch (error) {
      return {
        bucketId: null,
        publicPaths: [],
        privateDir: null,
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test file system operations
   */
  async testFileSystemAccess(): Promise<boolean> {
    try {
      const fs = await import('fs');
      const testPath = '/tmp/replit_test.txt';
      
      // Write test file
      await fs.promises.writeFile(testPath, 'Replit Integration Test');
      
      // Read test file
      const content = await fs.promises.readFile(testPath, 'utf-8');
      
      // Clean up
      await fs.promises.unlink(testPath);
      
      return content === 'Replit Integration Test';
    } catch (error) {
      console.error('File system test failed:', error);
      return false;
    }
  }

  /**
   * Execute shell commands (using Replit's exec API capabilities)
   */
  async executeCommand(command: string): Promise<{
    success: boolean;
    output?: string;
    error?: string;
  }> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        output: stdout,
        error: stderr || undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Singleton instance
export const replitIntegrations = new ReplitIntegrationsService();