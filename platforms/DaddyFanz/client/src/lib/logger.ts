interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  error?: any;
  metadata?: Record<string, any>;
}

class ClientLogger {
  private isDevelopment = import.meta.env.DEV;

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context);
  }

  error(message: string, context?: LogContext) {
    console.error(`[ERROR] ${message}`, context);
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }
}

export const logger = new ClientLogger();
