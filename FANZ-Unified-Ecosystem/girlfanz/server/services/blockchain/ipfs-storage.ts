import { create } from 'ipfs-http-client';
import { db } from '../../db';
import {
  ipfsRecords,
  type IpfsRecord,
  type InsertIpfsRecord
} from '../../../shared/schema';
import { eq } from 'drizzle-orm';
import { Buffer } from 'buffer';

// IPFS configuration
const IPFS_CONFIG = {
  host: process.env.IPFS_HOST || 'ipfs.infura.io',
  port: process.env.IPFS_PORT || 5001,
  protocol: process.env.IPFS_PROTOCOL || 'https',
  headers: {
    authorization: process.env.INFURA_IPFS_AUTH || ''
  }
};

// Public gateways for fetching IPFS content
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.ipfs.io/ipfs/'
];

export class IPFSStorageService {
  private client: any;
  private pinataApiKey: string | undefined;
  private pinataSecretKey: string | undefined;

  constructor() {
    try {
      // Initialize IPFS client
      this.client = create({
        host: IPFS_CONFIG.host,
        port: Number(IPFS_CONFIG.port),
        protocol: IPFS_CONFIG.protocol,
        headers: IPFS_CONFIG.headers
      });

      // Pinata credentials for pinning (optional)
      this.pinataApiKey = process.env.PINATA_API_KEY;
      this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
    } catch (error) {
      console.error('Error initializing IPFS client:', error);
      // Fallback to local/mock mode
      this.client = null;
    }
  }

  // Upload file to IPFS
  async uploadFile(
    file: Buffer | string,
    fileName: string,
    userId: string
  ): Promise<{
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
  }> {
    try {
      if (!this.client) {
        // Mock mode for development
        const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        
        await this.recordUpload({
          userId,
          ipfsHash: mockHash,
          fileName,
          fileType: this.getFileType(fileName),
          fileSize: Buffer.isBuffer(file) ? file.length : file.length,
          contentType: 'file'
        });

        return {
          ipfsHash: mockHash,
          ipfsUrl: `ipfs://${mockHash}`,
          gatewayUrl: `${IPFS_GATEWAYS[0]}${mockHash}`
        };
      }

      // Upload to IPFS
      const result = await this.client.add(file, {
        pin: true,
        progress: (prog: number) => console.log(`IPFS upload progress: ${prog}`)
      });

      const ipfsHash = result.cid.toString();

      // Pin with Pinata if configured
      if (this.pinataApiKey && this.pinataSecretKey) {
        await this.pinWithPinata(ipfsHash, fileName);
      }

      // Record in database
      await this.recordUpload({
        userId,
        ipfsHash,
        fileName,
        fileType: this.getFileType(fileName),
        fileSize: Buffer.isBuffer(file) ? file.length : file.length,
        contentType: 'file'
      });

      return {
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrl: `${IPFS_GATEWAYS[0]}${ipfsHash}`
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  // Upload JSON metadata to IPFS
  async uploadMetadata(
    metadata: any,
    userId: string,
    tokenId?: string
  ): Promise<{
    ipfsHash: string;
    ipfsUrl: string;
    gatewayUrl: string;
  }> {
    try {
      const metadataString = JSON.stringify(metadata, null, 2);
      const metadataBuffer = Buffer.from(metadataString);

      if (!this.client) {
        // Mock mode for development
        const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        
        await this.recordUpload({
          userId,
          tokenId,
          ipfsHash: mockHash,
          fileName: 'metadata.json',
          fileType: 'json',
          fileSize: metadataBuffer.length,
          contentType: 'metadata'
        });

        return {
          ipfsHash: mockHash,
          ipfsUrl: `ipfs://${mockHash}`,
          gatewayUrl: `${IPFS_GATEWAYS[0]}${mockHash}`
        };
      }

      // Upload to IPFS
      const result = await this.client.add(metadataBuffer, {
        pin: true
      });

      const ipfsHash = result.cid.toString();

      // Pin with Pinata if configured
      if (this.pinataApiKey && this.pinataSecretKey) {
        await this.pinWithPinata(ipfsHash, 'metadata.json');
      }

      // Record in database
      await this.recordUpload({
        userId,
        tokenId,
        ipfsHash,
        fileName: 'metadata.json',
        fileType: 'json',
        fileSize: metadataBuffer.length,
        contentType: 'metadata'
      });

      return {
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrl: `${IPFS_GATEWAYS[0]}${ipfsHash}`
      };
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      throw error;
    }
  }

  // Upload directory to IPFS (for collections)
  async uploadDirectory(
    files: Array<{
      path: string;
      content: Buffer | string;
    }>,
    userId: string
  ): Promise<{
    rootHash: string;
    files: Array<{
      path: string;
      hash: string;
      size: number;
    }>;
  }> {
    try {
      if (!this.client) {
        // Mock mode
        const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
        const mockFiles = files.map(file => ({
          path: file.path,
          hash: `Qm${Math.random().toString(36).substr(2, 44)}`,
          size: Buffer.isBuffer(file.content) ? file.content.length : file.content.length
        }));

        return {
          rootHash: mockHash,
          files: mockFiles
        };
      }

      const uploadFiles = files.map(file => ({
        path: file.path,
        content: file.content
      }));

      const results = [];
      for await (const result of this.client.addAll(uploadFiles, {
        wrapWithDirectory: true,
        pin: true
      })) {
        results.push(result);
      }

      const rootResult = results.find(r => r.path === '');
      const rootHash = rootResult ? rootResult.cid.toString() : '';

      const fileResults = results
        .filter(r => r.path !== '')
        .map(r => ({
          path: r.path,
          hash: r.cid.toString(),
          size: r.size
        }));

      // Record uploads
      for (const file of fileResults) {
        await this.recordUpload({
          userId,
          ipfsHash: file.hash,
          fileName: file.path,
          fileType: this.getFileType(file.path),
          fileSize: file.size,
          contentType: 'collection'
        });
      }

      return {
        rootHash,
        files: fileResults
      };
    } catch (error) {
      console.error('Error uploading directory to IPFS:', error);
      throw error;
    }
  }

  // Fetch content from IPFS
  async fetchFromIPFS(ipfsHash: string): Promise<Buffer> {
    try {
      if (!this.client) {
        // Try fetching from public gateway in mock mode
        const gatewayUrl = `${IPFS_GATEWAYS[0]}${ipfsHash}`;
        const response = await fetch(gatewayUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch from IPFS gateway: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      const chunks = [];
      for await (const chunk of this.client.cat(ipfsHash)) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      
      // Fallback to gateway fetch
      return await this.fetchFromGateway(ipfsHash);
    }
  }

  // Fetch from IPFS gateway
  async fetchFromGateway(ipfsHash: string): Promise<Buffer> {
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const url = `${gateway}${ipfsHash}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (error) {
        continue; // Try next gateway
      }
    }

    throw new Error('Failed to fetch from any IPFS gateway');
  }

  // Pin content with Pinata
  private async pinWithPinata(ipfsHash: string, name: string): Promise<void> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return;
    }

    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        body: JSON.stringify({
          hashToPin: ipfsHash,
          pinataMetadata: {
            name,
            keyvalues: {
              platform: 'girlfanz',
              timestamp: Date.now()
            }
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to pin with Pinata:', await response.text());
      }
    } catch (error) {
      console.error('Error pinning with Pinata:', error);
    }
  }

  // Unpin content from IPFS
  async unpinContent(ipfsHash: string): Promise<void> {
    try {
      if (!this.client) {
        return;
      }

      await this.client.pin.rm(ipfsHash);

      // Update database
      await db.update(ipfsRecords)
        .set({ isPinned: false })
        .where(eq(ipfsRecords.ipfsHash, ipfsHash));
    } catch (error) {
      console.error('Error unpinning content:', error);
    }
  }

  // Record IPFS upload in database
  private async recordUpload(data: InsertIpfsRecord): Promise<IpfsRecord> {
    const [record] = await db.insert(ipfsRecords)
      .values(data)
      .returning();
    
    return record;
  }

  // Get user's IPFS uploads
  async getUserUploads(userId: string): Promise<IpfsRecord[]> {
    return await db.select()
      .from(ipfsRecords)
      .where(eq(ipfsRecords.userId, userId));
  }

  // Get file type from filename
  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const typeMap: { [key: string]: string } = {
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'webp': 'image',
      'mp4': 'video',
      'webm': 'video',
      'mov': 'video',
      'avi': 'video',
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'json': 'json',
      'txt': 'text',
      'pdf': 'document'
    };

    return typeMap[extension] || 'unknown';
  }

  // Generate NFT metadata
  generateNFTMetadata(data: {
    name: string;
    description: string;
    image: string; // IPFS URI
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    properties?: any;
    external_url?: string;
    animation_url?: string;
  }): any {
    return {
      name: data.name,
      description: data.description,
      image: data.image,
      attributes: data.attributes || [],
      properties: data.properties || {},
      external_url: data.external_url || '',
      animation_url: data.animation_url || ''
    };
  }

  // Encrypt content before upload (for token-gated access)
  async encryptContent(
    content: Buffer,
    encryptionKey: string
  ): Promise<Buffer> {
    try {
      // Simple XOR encryption for demo (use proper encryption in production)
      const encrypted = Buffer.alloc(content.length);
      const keyBuffer = Buffer.from(encryptionKey);
      
      for (let i = 0; i < content.length; i++) {
        encrypted[i] = content[i] ^ keyBuffer[i % keyBuffer.length];
      }
      
      return encrypted;
    } catch (error) {
      console.error('Error encrypting content:', error);
      throw error;
    }
  }

  // Decrypt content after fetch
  async decryptContent(
    encryptedContent: Buffer,
    encryptionKey: string
  ): Promise<Buffer> {
    try {
      // Simple XOR decryption (same as encryption for XOR)
      return await this.encryptContent(encryptedContent, encryptionKey);
    } catch (error) {
      console.error('Error decrypting content:', error);
      throw error;
    }
  }

  // Get IPFS gateway URL
  getGatewayUrl(ipfsHash: string, gateway: number = 0): string {
    return `${IPFS_GATEWAYS[gateway]}${ipfsHash}`;
  }

  // Convert IPFS URI to HTTP gateway URL
  ipfsToHttp(ipfsUri: string): string {
    if (ipfsUri.startsWith('ipfs://')) {
      const hash = ipfsUri.replace('ipfs://', '');
      return this.getGatewayUrl(hash);
    }
    return ipfsUri;
  }

  // Check if content is pinned
  async isPinned(ipfsHash: string): Promise<boolean> {
    try {
      const [record] = await db.select()
        .from(ipfsRecords)
        .where(eq(ipfsRecords.ipfsHash, ipfsHash))
        .limit(1);
      
      return record?.isPinned || false;
    } catch (error) {
      console.error('Error checking pin status:', error);
      return false;
    }
  }

  // Calculate storage costs (for billing)
  calculateStorageCost(sizeInBytes: number, durationDays: number): number {
    // $0.01 per GB per day (example pricing)
    const gbSize = sizeInBytes / (1024 * 1024 * 1024);
    const dailyCost = 0.01;
    
    return gbSize * dailyCost * durationDays;
  }
}

// Export singleton instance
export const ipfsStorageService = new IPFSStorageService();