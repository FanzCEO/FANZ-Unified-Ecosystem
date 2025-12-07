import { Request, Response, NextFunction } from "express";
import { authService, JWTPayload } from "../auth";
import { storage } from "../storage";
import { logger } from "../logger";

// Define authenticated user type for JWT auth
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const payload = authService.verifyToken(token);
    const user = await storage.getUser(payload.userId);

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Invalid or inactive user" });
    }

    req.user = {
      id: user.id,
      email: user.email!,
      role: user.role!,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    };

    next();
  } catch (error) {
    logger.warn(`JWT authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Get role from either JWT user or from database lookup for Replit users
    const userRole = req.user.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export const requireCreator = requireRole(["creator", "admin"]);
export const requireAdmin = requireRole(["admin"]);

// Middleware to check if user is authenticated (JWT only)
export const requireAuth = authenticateJWT;

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      // No token provided, continue without user
      return next();
    }

    try {
      const payload = authService.verifyToken(token);
      const user = await storage.getUser(payload.userId);

      if (user && user.status === "active") {
        req.user = {
          id: user.id,
          email: user.email!,
          role: user.role!,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
        };
      }
    } catch (error) {
      // Invalid token, but don't fail the request
      logger.debug(`Optional auth failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    next();
  } catch (error) {
    logger.error(`Optional auth middleware error: ${error instanceof Error ? error.message : String(error)}`);
    next(); // Continue even on error
  }
};

// Authorization helper to verify path param matches authenticated user
export const verifyOwnership = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const paramValue = req.params[paramName];

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (userId !== paramValue) {
      logger.warn(`Authorization failed: User ${userId} attempted to access resource belonging to ${paramValue}`);
      return res.status(403).json({ message: "Access denied: You can only access your own resources" });
    }

    next();
  };
};
