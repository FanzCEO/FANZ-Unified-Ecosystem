import { Request, Response, NextFunction } from 'express';

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Stub implementation - no rate limiting for now
  next();
};