import pino from "pino";

const level = process.env.NODE_ENV === "production" ? "info" : "debug";

export const logger = pino({
  level,
  transport: process.env.NODE_ENV !== "production" ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  target?: string;
  metadata?: Record<string, any>;
}

export const createLogger = (context: LogContext = {}) => {
  return logger.child(context);
};

// Audit logging for compliance
export const auditLogger = {
  log: async (context: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, any>;
    req?: any;
  }) => {
    const { req, ...logData } = context;
    
    // Log to audit system
    logger.info({
      type: "audit",
      ...logData,
      ipAddress: req?.ip,
      userAgent: req?.get("user-agent"),
      timestamp: new Date().toISOString(),
    }, "Audit log");

    // Store in audit_logs table via storage
    try {
      const { storage } = await import("./storage");
      await storage.createAuditLog({
        ...logData,
        ipAddress: req?.ip,
        userAgent: req?.get("user-agent"),
      });
    } catch (error) {
      logger.error({ error }, "Failed to save audit log to database");
    }
  },
};
