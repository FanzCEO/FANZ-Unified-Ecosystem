import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { logger } from '../logger';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export class ObjectStorageService {
  private bucketId: string;
  private publicDir: string;
  private privateDir: string;

  constructor() {
    this.bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
    this.publicDir = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '';
    this.privateDir = process.env.PRIVATE_OBJECT_DIR || '';
    
    logger.info('Object storage configuration loaded', {
      bucketId: this.bucketId ? '***configured***' : 'missing',
      publicDir: this.publicDir ? '***configured***' : 'missing', 
      privateDir: this.privateDir ? '***configured***' : 'missing'
    });
    
    if (!this.bucketId || !this.publicDir || !this.privateDir) {
      logger.warn('Object storage environment variables not fully configured', {
        bucketId: !!this.bucketId,
        publicDir: !!this.publicDir,
        privateDir: !!this.privateDir
      });
    }
  }

  /**
   * Upload a file to public storage (accessible via URL)
   */
  async uploadPublicFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string
  ): Promise<UploadResult> {
    const fileExtension = path.extname(filename);
    const uniqueId = nanoid();
    const key = `media/${userId}/${uniqueId}${fileExtension}`;
    const fullPath = path.join(this.publicDir, key);

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file to object storage
      await fs.writeFile(fullPath, fileBuffer);

      // Generate public URL
      const url = `/public/${key}`;

      logger.info(`File uploaded successfully`, {
        key,
        url,
        size: fileBuffer.length,
        mimeType,
        userId
      });

      return {
        key,
        url,
        size: fileBuffer.length,
        mimeType
      };
    } catch (error) {
      logger.error('Failed to upload file to public storage', { error, key, userId });
      throw new Error('File upload failed');
    }
  }

  /**
   * Upload a file to private storage (requires authentication)
   */
  async uploadPrivateFile(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string
  ): Promise<UploadResult> {
    const fileExtension = path.extname(filename);
    const uniqueId = nanoid();
    const key = `media/${userId}/${uniqueId}${fileExtension}`;
    const fullPath = path.join(this.privateDir, key);

    try {
      // Log the attempted path for debugging
      logger.info('Attempting to write file to private storage', { 
        fullPath,
        key,
        userId,
        privateDir: this.privateDir 
      });
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      
      // Write file to private object storage
      await fs.writeFile(fullPath, fileBuffer);

      // Private files use API endpoint for access control
      const url = `/api/media/file/${key}`;

      logger.info(`Private file uploaded successfully`, {
        key,
        url,
        size: fileBuffer.length,
        mimeType,
        userId
      });

      return {
        key,
        url,
        size: fileBuffer.length,
        mimeType
      };
    } catch (error) {
      logger.error('Failed to upload file to private storage', { error, key, userId });
      throw new Error('File upload failed');
    }
  }

  /**
   * Get a private file (with access control)
   */
  async getPrivateFile(key: string): Promise<Buffer | null> {
    const fullPath = path.join(this.privateDir, key);
    
    try {
      const fileBuffer = await fs.readFile(fullPath);
      return fileBuffer;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      logger.error('Failed to read private file', { error, key });
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string, isPrivate: boolean = true): Promise<void> {
    const baseDir = isPrivate ? this.privateDir : this.publicDir;
    const fullPath = path.join(baseDir, key);
    
    try {
      await fs.unlink(fullPath);
      logger.info('File deleted successfully', { key, isPrivate });
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        logger.error('Failed to delete file', { error, key, isPrivate });
        throw error;
      }
    }
  }

  /**
   * Check if object storage is properly configured
   */
  isConfigured(): boolean {
    const configured = !!(this.bucketId && this.publicDir && this.privateDir);
    logger.info('Object storage configuration check', {
      configured,
      bucketId: !!this.bucketId,
      publicDir: !!this.publicDir,
      privateDir: !!this.privateDir
    });
    return configured;
  }
}

export const objectStorageService = new ObjectStorageService();