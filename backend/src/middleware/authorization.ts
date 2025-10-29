import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger('Authorization');

export const authorize = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Stub implementation - allow all for now
    logger.debug('Authorization check (stub)', { permissions });
    next();
  };
};