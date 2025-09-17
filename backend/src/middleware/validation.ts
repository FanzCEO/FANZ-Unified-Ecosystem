import { Request, Response, NextFunction } from 'express';
const { validationResult } = require('express-validator');
import { logger } from '../utils/logger';

/**
 * Middleware to handle express-validator validation results
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Request validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      userId: req.user?.id
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
  }

  next();
};