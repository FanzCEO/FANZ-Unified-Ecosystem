import path from 'path';
import fs from 'fs/promises';
import { createHash, randomBytes } from 'crypto';
import { Request } from 'express';
import { z } from 'zod';
import sanitizeFilename from 'sanitize-filename';

// Configuration interfaces
export interface FileUploadConfig {
  maxFileSize: number;
  maxTotalSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadDir: string;
  enableVirusScanning?: boolean;
  generateRandomNames?: boolean;
}

export interface StaticServeConfig {
  allowedRoots: string[];
  disableDirectoryListing: boolean;
  maxPathDepth: number;
}

// Default configurations
export const DEFAULT_UPLOAD_CONFIG: FileUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.json'],
  uploadDir: '/tmp/uploads',
  enableVirusScanning: false,
  generateRandomNames: true
};

export const DEFAULT_STATIC_CONFIG: StaticServeConfig = {
  allowedRoots: ['/public', '/assets', '/uploads'],
  disableDirectoryListing: true,
  maxPathDepth: 10
};

// Path validation schemas
const SafePathSchema = z.string()
  .min(1)
  .max(1000)
  .regex(/^[a-zA-Z0-9._\-\/\\]+$/, 'Path contains invalid characters')
  .refine(path => !path.includes('..'), 'Path traversal detected')
  .refine(path => !path.includes('~'), 'Home directory access denied')
  .refine(path => !path.startsWith('/etc'), 'System directory access denied')
  .refine(path => !path.startsWith('/proc'), 'Process directory access denied')
  .refine(path => !path.startsWith('/sys'), 'System directory access denied');

const FilenameSchema = z.string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9._\-]+$/, 'Filename contains invalid characters')
  .refine(name => !name.startsWith('.'), 'Hidden files not allowed')
  .refine(name => name !== '.' && name !== '..', 'Invalid filename');

// File metadata interface
export interface FileMetadata {
  originalName: string;
  safeName: string;
  mimeType: string;
  extension: string;
  size: number;
  uploadedAt: Date;
  checksum: string;
  uploadId: string;
}

// Path safety utilities
export class PathSafety {
  /**
   * Validates and normalizes a file path against a base directory
   */
  static validatePath(inputPath: string, baseDir: string): string {
    try {
      // Basic validation
      SafePathSchema.parse(inputPath);

      // Normalize and resolve the path
      const normalizedBase = path.resolve(baseDir);
      const normalizedPath = path.resolve(normalizedBase, inputPath);
      const relativePath = path.relative(normalizedBase, normalizedPath);

      // Ensure the resolved path is within the base directory
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error('Path traversal attempt detected');
      }

      // Additional safety checks
      if (relativePath.split(path.sep).length > DEFAULT_STATIC_CONFIG.maxPathDepth) {
        throw new Error('Path depth exceeds maximum allowed');
      }

      return normalizedPath;
    } catch (error) {
      throw new Error(`Path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks if a path is within allowed static roots
   */
  static isPathInAllowedRoots(filePath: string, config: StaticServeConfig = DEFAULT_STATIC_CONFIG): boolean {
    const normalizedPath = path.resolve(filePath);
    
    return config.allowedRoots.some(root => {
      const normalizedRoot = path.resolve(root);
      const relativePath = path.relative(normalizedRoot, normalizedPath);
      return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
    });
  }

  /**
   * Sanitizes a filename for safe storage
   */
  static sanitizeFilename(filename: string): string {
    const sanitized = sanitizeFilename(filename, { replacement: '_' });
    
    try {
      FilenameSchema.parse(sanitized);
      return sanitized;
    } catch {
      // If sanitization still fails, generate a safe default
      const ext = path.extname(filename);
      return `file_${Date.now()}${ext}`;
    }
  }

  /**
   * Generates a secure random filename
   */
  static generateSecureFilename(originalName: string): string {
    const extension = path.extname(originalName);
    const randomName = randomBytes(16).toString('hex');
    return `${randomName}${extension}`;
  }
}

// File upload utilities
export class FileUploadSafety {
  private config: FileUploadConfig;

  constructor(config: Partial<FileUploadConfig> = {}) {
    this.config = { ...DEFAULT_UPLOAD_CONFIG, ...config };
  }

  /**
   * Validates uploaded file metadata
   */
  validateFile(file: Express.Multer.File): void {
    // Size validation
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size ${file.size} exceeds maximum allowed ${this.config.maxFileSize}`);
    }

    // MIME type validation
    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`MIME type ${file.mimetype} is not allowed`);
    }

    // Extension validation
    const extension = path.extname(file.originalname).toLowerCase();
    if (!this.config.allowedExtensions.includes(extension)) {
      throw new Error(`File extension ${extension} is not allowed`);
    }

    // Additional security checks
    if (file.originalname.includes('..')) {
      throw new Error('Path traversal in filename detected');
    }
  }

  /**
   * Validates total upload size for multiple files
   */
  validateTotalSize(files: Express.Multer.File[]): void {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > this.config.maxTotalSize) {
      throw new Error(`Total upload size ${totalSize} exceeds maximum allowed ${this.config.maxTotalSize}`);
    }
  }

  /**
   * Processes and stores uploaded files safely
   */
  async processUploadedFiles(files: Express.Multer.File[]): Promise<FileMetadata[]> {
    this.validateTotalSize(files);

    const results: FileMetadata[] = [];

    for (const file of files) {
      this.validateFile(file);

      const uploadId = randomBytes(16).toString('hex');
      const safeName = this.config.generateRandomNames 
        ? PathSafety.generateSecureFilename(file.originalname)
        : PathSafety.sanitizeFilename(file.originalname);

      const checksum = createHash('sha256').update(file.buffer).digest('hex');

      const metadata: FileMetadata = {
        originalName: file.originalname,
        safeName,
        mimeType: file.mimetype,
        extension: path.extname(file.originalname).toLowerCase(),
        size: file.size,
        uploadedAt: new Date(),
        checksum,
        uploadId
      };

      // Store file outside web root
      const storePath = path.join(this.config.uploadDir, uploadId, safeName);
      await this.ensureDirectoryExists(path.dirname(storePath));
      await fs.writeFile(storePath, file.buffer);

      results.push(metadata);
    }

    return results;
  }

  /**
   * Ensures upload directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
    }
  }

  /**
   * Performs virus scanning if enabled (placeholder for integration)
   */
  async scanFile(filePath: string): Promise<boolean> {
    if (!this.config.enableVirusScanning) {
      return true;
    }

    // TODO: Integrate with virus scanning service
    // This is a placeholder - implement based on your chosen virus scanner
    console.log(`[FileUploadSafety] Virus scanning not implemented for: ${filePath}`);
    return true;
  }
}

// Static file serving utilities
export class StaticFileSafety {
  private config: StaticServeConfig;

  constructor(config: Partial<StaticServeConfig> = {}) {
    this.config = { ...DEFAULT_STATIC_CONFIG, ...config };
  }

  /**
   * Validates static file request
   */
  validateStaticFileRequest(requestPath: string): string {
    // Find matching allowed root
    const allowedRoot = this.config.allowedRoots.find(root => {
      try {
        const validatedPath = PathSafety.validatePath(requestPath, root);
        return PathSafety.isPathInAllowedRoots(validatedPath, this.config);
      } catch {
        return false;
      }
    });

    if (!allowedRoot) {
      throw new Error('Static file request outside allowed roots');
    }

    return PathSafety.validatePath(requestPath, allowedRoot);
  }

  /**
   * Middleware for secure static file serving
   */
  secureStaticMiddleware() {
    return async (req: Request, res: any, next: any) => {
      try {
        const requestPath = decodeURIComponent(req.path);
        const validatedPath = this.validateStaticFileRequest(requestPath);

        // Check if file exists and is not a directory
        try {
          const stats = await fs.stat(validatedPath);
          
          if (stats.isDirectory() && this.config.disableDirectoryListing) {
            return res.status(403).json({ error: 'Directory listing disabled' });
          }

          if (stats.isFile()) {
            // Set security headers for static files
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        } catch (error) {
          return res.status(404).json({ error: 'File not found' });
        }

        // Continue to actual static file handler
        next();
      } catch (error) {
        res.status(400).json({ 
          error: 'Invalid file request',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  }
}

// Utility functions for common patterns
export const fileSystemUtils = {
  /**
   * Safe path join that prevents traversal
   */
  safeJoin: (base: string, ...paths: string[]): string => {
    return PathSafety.validatePath(path.join(...paths), base);
  },

  /**
   * Check if filename is safe
   */
  isSafeFilename: (filename: string): boolean => {
    try {
      FilenameSchema.parse(filename);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get file extension safely
   */
  getSafeExtension: (filename: string): string => {
    const ext = path.extname(filename).toLowerCase();
    return ext.replace(/[^a-z0-9.]/g, '');
  },

  /**
   * Calculate file checksum
   */
  calculateChecksum: async (filePath: string): Promise<string> => {
    const buffer = await fs.readFile(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }
};

// Export main classes and utilities
export {
  PathSafety,
  FileUploadSafety,
  StaticFileSafety
};