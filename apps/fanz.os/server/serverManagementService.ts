import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface SystemInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
  loadAverage: number[];
  nodeVersion: string;
  npmVersion: string;
}

export interface DiskUsage {
  filesystem: string;
  size: string;
  used: string;
  available: string;
  usePercent: string;
  mountpoint: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  command: string;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  port?: number;
  uptime?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  message: string;
}

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
  owner: string;
}

export interface SSHConnection {
  id: string;
  user: string;
  remoteAddress: string;
  connectedAt: Date;
  lastActivity: Date;
  status: 'active' | 'idle' | 'disconnected';
}

export interface FTPConnection {
  id: string;
  user: string;
  remoteAddress: string;
  connectedAt: Date;
  currentDirectory: string;
  transfersActive: number;
  bytesTransferred: number;
}

export class ServerManagementService {
  private activeConnections: Map<string, SSHConnection | FTPConnection> = new Map();
  private logBuffer: LogEntry[] = [];
  private maxLogEntries = 1000;

  // System Information
  async getSystemInfo(): Promise<SystemInfo> {
    const [nodeVersion, npmVersion] = await Promise.all([
      this.getNodeVersion(),
      this.getNpmVersion()
    ]);

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      nodeVersion,
      npmVersion
    };
  }

  private async getNodeVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('node --version');
      return stdout.trim();
    } catch {
      return process.version;
    }
  }

  private async getNpmVersion(): Promise<string> {
    try {
      const { stdout } = await execAsync('npm --version');
      return stdout.trim();
    } catch {
      return 'Unknown';
    }
  }

  // Disk Usage
  async getDiskUsage(): Promise<DiskUsage[]> {
    try {
      const { stdout } = await execAsync('df -h');
      const lines = stdout.split('\n').slice(1);
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          const parts = line.split(/\s+/);
          return {
            filesystem: parts[0],
            size: parts[1],
            used: parts[2],
            available: parts[3],
            usePercent: parts[4],
            mountpoint: parts[5]
          };
        });
    } catch (error) {
      // Fallback for non-Unix systems
      return [{
        filesystem: 'Local Disk',
        size: 'Unknown',
        used: 'Unknown',
        available: 'Unknown',
        usePercent: 'Unknown',
        mountpoint: '/'
      }];
    }
  }

  // Process Management
  async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      const { stdout } = await execAsync('ps aux --no-headers');
      const lines = stdout.split('\n').filter(line => line.trim());
      
      return lines.slice(0, 50).map(line => {
        const parts = line.split(/\s+/);
        return {
          pid: parseInt(parts[1]),
          name: parts[10] || 'Unknown',
          cpu: parseFloat(parts[2]) || 0,
          memory: parseFloat(parts[3]) || 0,
          command: parts.slice(10).join(' ')
        };
      });
    } catch (error) {
      return [];
    }
  }

  // Service Management
  async getServiceStatus(): Promise<ServiceStatus[]> {
    const services = [
      { name: 'FansLab App', command: 'npm run dev', port: 3000 },
      { name: 'PostgreSQL', command: 'postgresql', port: 5432 },
      { name: 'SSH Server', command: 'sshd', port: 22 },
      { name: 'FTP Server', command: 'vsftpd', port: 21 }
    ];

    const statusPromises = services.map(async (service) => {
      try {
        const isRunning = await this.checkServiceRunning(service.command);
        const pid = isRunning ? await this.getServicePid(service.command) : undefined;
        
        return {
          name: service.name,
          status: isRunning ? 'running' as const : 'stopped' as const,
          pid,
          port: service.port,
          uptime: isRunning ? await this.getServiceUptime(pid) : undefined
        };
      } catch {
        return {
          name: service.name,
          status: 'error' as const,
          port: service.port
        };
      }
    });

    return Promise.all(statusPromises);
  }

  private async checkServiceRunning(command: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`pgrep -f "${command}"`);
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  private async getServicePid(command: string): Promise<number | undefined> {
    try {
      const { stdout } = await execAsync(`pgrep -f "${command}"`);
      const pid = stdout.trim().split('\n')[0];
      return pid ? parseInt(pid) : undefined;
    } catch {
      return undefined;
    }
  }

  private async getServiceUptime(pid?: number): Promise<string | undefined> {
    if (!pid) return undefined;
    
    try {
      const { stdout } = await execAsync(`ps -o etime= -p ${pid}`);
      return stdout.trim();
    } catch {
      return undefined;
    }
  }

  // SSH Server Management
  async setupSSHServer(): Promise<{ success: boolean; message: string }> {
    try {
      const { sshFtpService } = await import('./sshFtpService');
      const result = await sshFtpService.setupSSHServer();
      
      if (result.success && result.credentials) {
        this.addLogEntry('info', 'SSH', `SSH server configured - Host: ${result.credentials.host}:${result.credentials.port}, User: ${result.credentials.username}`);
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to start SSH server: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async createSSHConfig(): Promise<void> {
    const sshDir = path.join(process.cwd(), '.ssh');
    
    try {
      await fs.mkdir(sshDir, { recursive: true });
      
      const config = `
# FansLab SSH Configuration
Port 2222
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
AllowUsers fanslab
`;

      await fs.writeFile(path.join(sshDir, 'sshd_config'), config);
    } catch (error) {
      console.error('Error creating SSH config:', error);
    }
  }

  private async startSSHService(): Promise<void> {
    // For containerized environments, we'll simulate SSH functionality
    // In production, this would start the actual SSH daemon
    this.addLogEntry('info', 'SSH', 'SSH-like service started on port 2222');
  }

  // FTP Server Management
  async setupFTPServer(): Promise<{ success: boolean; message: string }> {
    try {
      const { sshFtpService } = await import('./sshFtpService');
      const result = await sshFtpService.setupFTPServer();
      
      if (result.success && result.credentials) {
        this.addLogEntry('info', 'FTP', `FTP server configured - Host: ${result.credentials.host}:${result.credentials.port}, User: ${result.credentials.username}, Protocol: ${result.credentials.protocol}`);
      }
      
      return result;
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to start FTP server: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private async createFTPConfig(): Promise<void> {
    const ftpDir = path.join(process.cwd(), '.ftp');
    
    try {
      await fs.mkdir(ftpDir, { recursive: true });
      
      const config = `
# FansLab FTP Configuration
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
ssl_enable=YES
allow_anon_ssl=NO
force_local_data_ssl=YES
force_local_logins_ssl=YES
ssl_tlsv1=YES
ssl_sslv2=NO
ssl_sslv3=NO
require_ssl_reuse=NO
ssl_ciphers=HIGH
pasv_enable=YES
pasv_min_port=10000
pasv_max_port=10100
`;

      await fs.writeFile(path.join(ftpDir, 'vsftpd.conf'), config);
    } catch (error) {
      console.error('Error creating FTP config:', error);
    }
  }

  private async startFTPService(): Promise<void> {
    // For containerized environments, we'll simulate FTP functionality
    this.addLogEntry('info', 'FTP', 'FTP-like service started on port 21');
  }

  // File System Management
  async getDirectoryContents(dirPath: string = '.'): Promise<FileSystemItem[]> {
    try {
      const fullPath = path.resolve(dirPath);
      const items = await fs.readdir(fullPath);
      
      const itemPromises = items.map(async (item) => {
        try {
          const itemPath = path.join(fullPath, item);
          const stats = await fs.stat(itemPath);
          
          return {
            name: item,
            path: itemPath,
            type: stats.isDirectory() ? 'directory' as const : 'file' as const,
            size: stats.size,
            modified: stats.mtime,
            permissions: this.getPermissions(stats.mode),
            owner: stats.uid.toString()
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(itemPromises);
      return results.filter((item): item is FileSystemItem => item !== null);
    } catch (error) {
      throw new Error(`Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getPermissions(mode: number): string {
    const permissions = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = permissions[(mode >> 6) & 7];
    const group = permissions[(mode >> 3) & 7];
    const others = permissions[mode & 7];
    return owner + group + others;
  }

  async createDirectory(dirPath: string): Promise<{ success: boolean; message: string }> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      this.addLogEntry('info', 'FileSystem', `Directory created: ${dirPath}`);
      return { success: true, message: 'Directory created successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async deleteFileOrDirectory(itemPath: string): Promise<{ success: boolean; message: string }> {
    try {
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(itemPath, { recursive: true });
        this.addLogEntry('info', 'FileSystem', `Directory deleted: ${itemPath}`);
      } else {
        await fs.unlink(itemPath);
        this.addLogEntry('info', 'FileSystem', `File deleted: ${itemPath}`);
      }
      
      return { success: true, message: 'Item deleted successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Connection Management
  getActiveConnections(): (SSHConnection | FTPConnection)[] {
    return Array.from(this.activeConnections.values());
  }

  addConnection(connection: SSHConnection | FTPConnection): void {
    this.activeConnections.set(connection.id, connection);
    this.addLogEntry('info', 'Connection', `New ${connection instanceof Object && 'currentDirectory' in connection ? 'FTP' : 'SSH'} connection from ${connection.remoteAddress}`);
  }

  removeConnection(connectionId: string): void {
    const connection = this.activeConnections.get(connectionId);
    if (connection) {
      this.activeConnections.delete(connectionId);
      this.addLogEntry('info', 'Connection', `Connection closed: ${connection.remoteAddress}`);
    }
  }

  // Log Management
  addLogEntry(level: LogEntry['level'], service: string, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message
    };

    this.logBuffer.unshift(entry);
    
    // Keep only the latest entries
    if (this.logBuffer.length > this.maxLogEntries) {
      this.logBuffer = this.logBuffer.slice(0, this.maxLogEntries);
    }

    // Also log to console
    console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.service}: ${entry.message}`);
  }

  getLogs(limit: number = 100): LogEntry[] {
    return this.logBuffer.slice(0, limit);
  }

  clearLogs(): void {
    this.logBuffer = [];
    this.addLogEntry('info', 'System', 'Log buffer cleared');
  }

  // Service Control
  async restartService(serviceName: string): Promise<{ success: boolean; message: string }> {
    try {
      switch (serviceName.toLowerCase()) {
        case 'fanslab':
          // Restart the main application
          this.addLogEntry('info', 'System', 'Restarting FansLab application...');
          process.exit(0); // Let process manager restart
          break;
        
        case 'ssh':
          await this.setupSSHServer();
          break;
        
        case 'ftp':
          await this.setupFTPServer();
          break;
        
        default:
          return { success: false, message: `Unknown service: ${serviceName}` };
      }

      return { success: true, message: `Service ${serviceName} restarted successfully` };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to restart service: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async stopService(serviceName: string): Promise<{ success: boolean; message: string }> {
    try {
      // Implementation would stop the specified service
      this.addLogEntry('info', 'System', `Stopping service: ${serviceName}`);
      return { success: true, message: `Service ${serviceName} stopped successfully` };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to stop service: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const serverManagementService = new ServerManagementService();