import { Request, Response } from "express";
import { db } from "./db";
import { logger } from "./logger";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk?: HealthCheck;
  };
}

interface HealthCheck {
  status: "pass" | "fail" | "warn";
  time: string;
  output?: string;
  details?: Record<string, any>;
}

class HealthService {
  private startTime = Date.now();

  async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      await db.execute("SELECT 1");
      const responseTime = Date.now() - start;
      
      return {
        status: responseTime < 100 ? "pass" : "warn",
        time: `${responseTime}ms`,
        details: { responseTime },
      };
    } catch (error) {
      logger.error(`Database health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        status: "fail",
        time: `${Date.now() - start}ms`,
        output: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async checkMemory(): Promise<HealthCheck> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssUsedMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Warn if heap usage is over 80% or RSS over 2GB
    const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const status = heapUsagePercent > 80 || rssUsedMB > 2048 ? "warn" : "pass";
    
    return {
      status,
      time: "0ms",
      details: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${rssUsedMB}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        heapUsagePercent: Math.round(heapUsagePercent),
      },
    };
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const [database, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    const checks = { database, memory };
    const allPassing = Object.values(checks).every(check => check.status === "pass");
    const anyWarning = Object.values(checks).some(check => check.status === "warn");
    const anyFailing = Object.values(checks).some(check => check.status === "fail");

    let status: HealthStatus["status"];
    if (anyFailing) {
      status = "unhealthy";
    } else if (anyWarning) {
      status = "degraded";
    } else {
      status = "healthy";
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || "unknown",
      checks,
    };
  }
}

const healthService = new HealthService();

export const healthEndpoints = {
  // Basic health check
  basic: async (req: Request, res: Response) => {
    try {
      const health = await healthService.getHealthStatus();
      const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      });
    }
  },

  // Ready check (for load balancers)
  ready: async (req: Request, res: Response) => {
    try {
      const dbCheck = await healthService.checkDatabase();
      if (dbCheck.status === "fail") {
        return res.status(503).json({ status: "not ready", reason: "database unavailable" });
      }
      res.json({ status: "ready" });
    } catch (error) {
      res.status(503).json({ status: "not ready", error: "readiness check failed" });
    }
  },

  // Live check (for orchestrators)
  live: async (req: Request, res: Response) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  },
};
