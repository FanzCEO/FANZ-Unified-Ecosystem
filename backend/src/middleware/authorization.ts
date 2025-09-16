import { Request, Response, NextFunction } from 'express';

export const authorize = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Stub implementation - allow all for now
    console.log('Authorization check (stub):', permissions);
    next();
  };
};