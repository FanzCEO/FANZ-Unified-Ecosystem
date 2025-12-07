import { Request, Response } from 'express';
import { replitIntegrations } from '../replitIntegrationsService';

/**
 * Replit Integration Controller
 * Handles all Replit platform service endpoints
 */
export class ReplitIntegrationController {

  /**
   * Get status of all Replit services
   * GET /api/replit/status
   */
  async getServiceStatus(req: Request, res: Response) {
    try {
      const status = await replitIntegrations.getServiceStatus();
      res.json({
        success: true,
        services: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Service status check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check service status'
      });
    }
  }

  /**
   * Get comprehensive environment information
   * GET /api/replit/environment
   */
  async getEnvironmentInfo(req: Request, res: Response) {
    try {
      const envInfo = replitIntegrations.getReplitEnvironmentInfo();
      res.json({
        success: true,
        environment: envInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Environment info retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get environment information'
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/replit/health
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const health = await replitIntegrations.healthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        success: health.status === 'healthy',
        health
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        status: 'unhealthy'
      });
    }
  }

  /**
   * Get deployment information
   * GET /api/replit/deployment
   */
  async getDeploymentInfo(req: Request, res: Response) {
    try {
      const deploymentInfo = replitIntegrations.getDeploymentInfo();
      res.json({
        success: true,
        deployment: deploymentInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Deployment info retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get deployment information'
      });
    }
  }

  /**
   * Get object storage configuration
   * GET /api/replit/storage
   */
  async getStorageConfig(req: Request, res: Response) {
    try {
      const storageConfig = replitIntegrations.getObjectStorageConfig();
      res.json({
        success: true,
        storage: storageConfig,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Storage config retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get storage configuration'
      });
    }
  }

  /**
   * Test file system operations
   * POST /api/replit/test/filesystem
   */
  async testFileSystem(req: Request, res: Response) {
    try {
      const result = await replitIntegrations.testFileSystemAccess();
      res.json({
        success: true,
        fileSystemAccess: result,
        message: result ? 'File system access working' : 'File system access failed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('File system test failed:', error);
      res.status(500).json({
        success: false,
        error: 'File system test failed'
      });
    }
  }

  /**
   * Execute system command (admin only)
   * POST /api/replit/execute
   */
  async executeCommand(req: Request, res: Response) {
    try {
      // Security check - only allow for admin users
      const user = (req as any).user;
      if (!user || user.claims?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { command } = req.body;
      if (!command || typeof command !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Command is required'
        });
      }

      // Whitelist allowed commands for security
      const allowedCommands = [
        'uptime',
        'date',
        'whoami',
        'ls -la',
        'df -h',
        'free -m',
        'ps aux',
        'npm --version',
        'node --version',
        'git status'
      ];

      if (!allowedCommands.some(allowed => command.startsWith(allowed))) {
        return res.status(403).json({
          success: false,
          error: 'Command not allowed'
        });
      }

      const result = await replitIntegrations.executeCommand(command);
      res.json({
        success: result.success,
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Command execution failed:', error);
      res.status(500).json({
        success: false,
        error: 'Command execution failed'
      });
    }
  }

  /**
   * Initialize all integrations
   * POST /api/replit/initialize
   */
  async initializeIntegrations(req: Request, res: Response) {
    try {
      await replitIntegrations.initializeIntegrations();
      const status = await replitIntegrations.getServiceStatus();
      
      res.json({
        success: true,
        message: 'Replit integrations initialized',
        services: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Integration initialization failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize integrations'
      });
    }
  }
}