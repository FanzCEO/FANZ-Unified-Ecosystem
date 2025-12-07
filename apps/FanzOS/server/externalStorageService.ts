import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "stream";
import path from "path";
import crypto from "crypto";

// Storage provider configuration
export interface StorageConfig {
  provider: "mojohost" | "wasabi" | "digitalocean" | "aws" | "custom";
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  cdnUrl?: string;
  forcePathStyle?: boolean;
}

// Default configurations for popular providers
const PROVIDER_DEFAULTS = {
  mojohost: {
    endpoint: "https://s3.mojohost.com", // MojoHost S3 endpoint
    region: "us-central-1",
    forcePathStyle: true,
    cdnUrl: "https://cdn.mojohost.com",
  },
  wasabi: {
    endpoint: "https://s3.wasabisys.com",
    region: "us-east-1",
    forcePathStyle: false,
  },
  digitalocean: {
    endpoint: "https://nyc3.digitaloceanspaces.com",
    region: "nyc3",
    forcePathStyle: false,
  },
  aws: {
    region: "us-east-1",
    forcePathStyle: false,
  },
  custom: {
    forcePathStyle: true,
  },
};

export class ExternalStorageService {
  private s3Client: S3Client;
  private config: StorageConfig;
  
  constructor(config?: StorageConfig) {
    // Use environment variables or provided config
    this.config = config || this.loadConfigFromEnv();
    
    // Apply provider defaults
    const defaults = PROVIDER_DEFAULTS[this.config.provider];
    this.config = { ...defaults, ...this.config };
    
    // Initialize S3 client with appropriate configuration
    this.s3Client = new S3Client({
      endpoint: this.config.endpoint,
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: this.config.forcePathStyle,
    });
  }
  
  private loadConfigFromEnv(): StorageConfig {
    const provider = (process.env.STORAGE_PROVIDER || "mojohost") as any;
    
    return {
      provider,
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION || "us-central-1",
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || "",
      bucket: process.env.STORAGE_BUCKET || "fanslab-media",
      cdnUrl: process.env.STORAGE_CDN_URL,
    };
  }
  
  // Generate unique file key
  private generateFileKey(filename: string, folder?: string): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${filename}${timestamp}`).digest('hex').substring(0, 8);
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const safeFilename = `${name}-${hash}${ext}`;
    
    if (folder) {
      return `${folder}/${safeFilename}`;
    }
    return safeFilename;
  }
  
  // Upload file to storage
  async uploadFile(
    file: Buffer | Readable,
    filename: string,
    mimeType: string,
    folder?: string,
    metadata?: Record<string, string>
  ): Promise<{ key: string; url: string; cdnUrl?: string }> {
    const key = this.generateFileKey(filename, folder);
    
    try {
      // For large files, use multipart upload
      if (file instanceof Buffer && file.length > 5 * 1024 * 1024) {
        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: this.config.bucket,
            Key: key,
            Body: file,
            ContentType: mimeType,
            Metadata: metadata,
            // Add cache control for CDN optimization
            CacheControl: "public, max-age=31536000",
          },
        });
        
        await upload.done();
      } else {
        // Regular upload for smaller files
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            Body: file,
            ContentType: mimeType,
            Metadata: metadata,
            CacheControl: "public, max-age=31536000",
          })
        );
      }
      
      // Generate URLs
      const url = this.getPublicUrl(key);
      const cdnUrl = this.config.cdnUrl ? `${this.config.cdnUrl}/${key}` : undefined;
      
      return { key, url, cdnUrl: cdnUrl || url };
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw new Error("Failed to upload file to storage");
    }
  }
  
  // Get public URL for a file
  getPublicUrl(key: string): string {
    if (this.config.cdnUrl) {
      return `${this.config.cdnUrl}/${key}`;
    }
    
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    }
    
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
  
  // Generate presigned URL for temporary access
  async getPresignedUrl(
    key: string,
    expiresIn = 3600,
    operation: "get" | "put" = "get"
  ): Promise<string> {
    const command = operation === "put"
      ? new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      : new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        });
    
    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
  
  // Download file from storage
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });
      
      const response = await this.s3Client.send(command);
      
      if (response.Body) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }
      
      throw new Error("No file content received");
    } catch (error) {
      console.error("Failed to download file:", error);
      throw new Error("Failed to download file from storage");
    }
  }
  
  // Delete file from storage
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      );
    } catch (error) {
      console.error("Failed to delete file:", error);
      throw new Error("Failed to delete file from storage");
    }
  }
  
  // List files in a folder
  async listFiles(
    folder?: string,
    maxKeys = 1000
  ): Promise<{ key: string; size: number; lastModified: Date }[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: folder,
        MaxKeys: maxKeys,
      });
      
      const response = await this.s3Client.send(command);
      
      if (!response.Contents) {
        return [];
      }
      
      return response.Contents.map((item) => ({
        key: item.Key || "",
        size: item.Size || 0,
        lastModified: item.LastModified || new Date(),
      }));
    } catch (error) {
      console.error("Failed to list files:", error);
      throw new Error("Failed to list files from storage");
    }
  }
  
  // Create folder structure for different content types
  async setupFolderStructure(): Promise<void> {
    const folders = [
      "profiles",
      "posts",
      "messages",
      "videos",
      "shorts",
      "livestreams",
      "documents",
      "thumbnails",
      "watermarked",
      "temp",
    ];
    
    for (const folder of folders) {
      // Create a placeholder file to ensure folder exists
      const placeholderKey = `${folder}/.keep`;
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: placeholderKey,
          Body: "",
          ContentType: "text/plain",
        })
      );
    }
  }
  
  // Apply watermark to media (requires separate processing service)
  async watermarkMedia(
    originalKey: string,
    watermarkText: string
  ): Promise<{ key: string; url: string }> {
    // This would integrate with a media processing service
    // For now, return the original
    console.log(`Watermarking ${originalKey} with "${watermarkText}"`);
    return {
      key: originalKey,
      url: this.getPublicUrl(originalKey),
    };
  }
  
  // Optimize image for different sizes
  async optimizeImage(
    originalKey: string,
    sizes: Array<{ width: number; height: number; suffix: string }>
  ): Promise<Array<{ size: string; key: string; url: string }>> {
    // This would integrate with an image processing service
    // For now, return the original for all sizes
    return sizes.map((size) => ({
      size: size.suffix,
      key: originalKey,
      url: this.getPublicUrl(originalKey),
    }));
  }
  
  // Get storage statistics
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byFolder: Record<string, { count: number; size: number }>;
  }> {
    const files = await this.listFiles();
    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byFolder: {} as Record<string, { count: number; size: number }>,
    };
    
    for (const file of files) {
      stats.totalSize += file.size;
      const folder = file.key.split("/")[0] || "root";
      
      if (!stats.byFolder[folder]) {
        stats.byFolder[folder] = { count: 0, size: 0 };
      }
      
      stats.byFolder[folder].count++;
      stats.byFolder[folder].size += file.size;
    }
    
    return stats;
  }
  
  // Check if storage is configured and accessible
  async testConnection(): Promise<boolean> {
    try {
      await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          MaxKeys: 1,
        })
      );
      return true;
    } catch (error) {
      console.error("Storage connection test failed:", error);
      return false;
    }
  }
}

// Export singleton instance
export const externalStorage = new ExternalStorageService();

// Export for custom configurations
export default ExternalStorageService;