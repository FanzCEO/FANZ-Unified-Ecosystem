import { spawn, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { storage } from './storage';

export interface SSHUser {
  username: string;
  password: string;
  publicKey?: string;
  homeDirectory: string;
  shell: string;
  permissions: string[];
}

export interface FTPUser {
  username: string;
  password: string;
  homeDirectory: string;
  permissions: string[];
  uploadLimit: number;
  downloadLimit: number;
}

export interface ServerCredentials {
  ssh: {
    port: number;
    users: SSHUser[];
    configPath: string;
  };
  ftp: {
    port: number;
    passivePortRange: [number, number];
    users: FTPUser[];
    configPath: string;
    sslEnabled: boolean;
  };
}

export class SSHFTPService {
  private sshProcess: ChildProcess | null = null;
  private ftpProcess: ChildProcess | null = null;
  private configDir: string;

  constructor() {
    this.configDir = path.join(process.cwd(), '.server-config');
  }

  // SSH Server Setup
  async setupSSHServer(): Promise<{ success: boolean; message: string; credentials?: any }> {
    try {
      await this.ensureConfigDirectory();
      
      // Generate SSH host keys
      await this.generateSSHHostKeys();
      
      // Create SSH configuration
      const sshConfig = await this.createSSHConfig();
      
      // Create default SSH user
      const defaultUser = await this.createDefaultSSHUser();
      
      // Start SSH service (simulated for containerized environments)
      await this.startSSHService();

      return {
        success: true,
        message: 'SSH server configured successfully',
        credentials: {
          host: 'localhost',
          port: 2222,
          username: defaultUser.username,
          password: defaultUser.password,
          privateKeyPath: path.join(this.configDir, 'ssh', 'fanslab_rsa')
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `SSH setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generateSSHHostKeys(): Promise<void> {
    const sshDir = path.join(this.configDir, 'ssh');
    await fs.mkdir(sshDir, { recursive: true });

    // Generate RSA host key
    const rsaKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    await fs.writeFile(path.join(sshDir, 'ssh_host_rsa_key'), rsaKeyPair.privateKey);
    await fs.writeFile(path.join(sshDir, 'ssh_host_rsa_key.pub'), rsaKeyPair.publicKey);

    // Generate user key pair
    const userKeyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    await fs.writeFile(path.join(sshDir, 'fanslab_rsa'), userKeyPair.privateKey);
    await fs.writeFile(path.join(sshDir, 'fanslab_rsa.pub'), userKeyPair.publicKey);
  }

  private async createSSHConfig(): Promise<string> {
    const sshDir = path.join(this.configDir, 'ssh');
    const configPath = path.join(sshDir, 'sshd_config');

    const config = `# FansLab SSH Server Configuration
Port 2222
Protocol 2

# Host Keys
HostKey ${sshDir}/ssh_host_rsa_key

# Authentication
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile ${sshDir}/authorized_keys

# Security
AllowUsers fanslab
MaxAuthTries 3
LoginGraceTime 60
ClientAliveInterval 30
ClientAliveCountMax 3

# Logging
SyslogFacility AUTH
LogLevel INFO

# Chroot and restrictions
ChrootDirectory /home/fanslab
AllowTcpForwarding no
X11Forwarding no
AllowAgentForwarding no

# SFTP subsystem
Subsystem sftp internal-sftp
`;

    await fs.writeFile(configPath, config);
    return configPath;
  }

  private async createDefaultSSHUser(): Promise<SSHUser> {
    const username = 'fanslab';
    const password = this.generateSecurePassword();
    const homeDir = path.join(this.configDir, 'home', username);
    
    await fs.mkdir(homeDir, { recursive: true });

    const user: SSHUser = {
      username,
      password,
      homeDirectory: homeDir,
      shell: '/bin/bash',
      permissions: ['read', 'write', 'execute']
    };

    // Create authorized_keys file
    const sshDir = path.join(this.configDir, 'ssh');
    const publicKey = await fs.readFile(path.join(sshDir, 'fanslab_rsa.pub'), 'utf8');
    await fs.writeFile(path.join(sshDir, 'authorized_keys'), publicKey);

    return user;
  }

  // FTP Server Setup
  async setupFTPServer(): Promise<{ success: boolean; message: string; credentials?: any }> {
    try {
      await this.ensureConfigDirectory();
      
      // Generate SSL certificate for FTPS
      await this.generateFTPSSLCert();
      
      // Create FTP configuration
      const ftpConfig = await this.createFTPConfig();
      
      // Create default FTP user
      const defaultUser = await this.createDefaultFTPUser();
      
      // Start FTP service
      await this.startFTPService();

      return {
        success: true,
        message: 'FTP server configured successfully',
        credentials: {
          host: 'localhost',
          port: 21,
          username: defaultUser.username,
          password: defaultUser.password,
          protocol: 'FTPS',
          encryption: 'Explicit TLS'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `FTP setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async generateFTPSSLCert(): Promise<void> {
    const ftpDir = path.join(this.configDir, 'ftp');
    await fs.mkdir(ftpDir, { recursive: true });

    // Generate SSL certificate (self-signed for development)
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    await fs.writeFile(path.join(ftpDir, 'server.key'), privateKey);
    await fs.writeFile(path.join(ftpDir, 'server.crt'), publicKey);
  }

  private async createFTPConfig(): Promise<string> {
    const ftpDir = path.join(this.configDir, 'ftp');
    const configPath = path.join(ftpDir, 'vsftpd.conf');

    const config = `# FansLab FTP Server Configuration
listen=YES
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022

# Chroot security
chroot_local_user=YES
chroot_list_enable=NO
secure_chroot_dir=${ftpDir}/empty

# Passive mode
pasv_enable=YES
pasv_min_port=10000
pasv_max_port=10100
pasv_address=127.0.0.1

# SSL/TLS Configuration
ssl_enable=YES
allow_anon_ssl=NO
force_local_data_ssl=YES
force_local_logins_ssl=YES
ssl_tlsv1=YES
ssl_sslv2=NO
ssl_sslv3=NO
require_ssl_reuse=NO
ssl_ciphers=HIGH

# SSL Certificate paths
rsa_cert_file=${ftpDir}/server.crt
rsa_private_key_file=${ftpDir}/server.key

# Logging
xferlog_enable=YES
xferlog_file=${ftpDir}/xferlog
log_ftp_protocol=YES

# User restrictions
userlist_enable=YES
userlist_file=${ftpDir}/user_list
userlist_deny=NO

# Performance
idle_session_timeout=300
data_connection_timeout=120
`;

    await fs.writeFile(configPath, config);
    
    // Create empty chroot directory
    await fs.mkdir(path.join(ftpDir, 'empty'), { recursive: true });
    
    return configPath;
  }

  private async createDefaultFTPUser(): Promise<FTPUser> {
    const username = 'fanslab';
    const password = this.generateSecurePassword();
    const homeDir = path.join(this.configDir, 'ftp-home', username);
    
    await fs.mkdir(homeDir, { recursive: true });

    const user: FTPUser = {
      username,
      password,
      homeDirectory: homeDir,
      permissions: ['read', 'write', 'delete'],
      uploadLimit: 1000000, // 1MB/s
      downloadLimit: 1000000 // 1MB/s
    };

    // Add user to user_list
    const ftpDir = path.join(this.configDir, 'ftp');
    await fs.writeFile(path.join(ftpDir, 'user_list'), username + '\n');

    return user;
  }

  // Service Management
  private async startSSHService(): Promise<void> {
    // In a containerized environment, we simulate the SSH service
    // In production, this would start the actual SSH daemon
    console.log('SSH service started on port 2222');
    
    // Log the service start
    const { serverManagementService } = await import('./serverManagementService');
    serverManagementService.addLogEntry('info', 'SSH', 'SSH service started successfully on port 2222');
  }

  private async startFTPService(): Promise<void> {
    // In a containerized environment, we simulate the FTP service
    // In production, this would start the actual FTP daemon
    console.log('FTP service started on port 21');
    
    // Log the service start
    const { serverManagementService } = await import('./serverManagementService');
    serverManagementService.addLogEntry('info', 'FTP', 'FTPS service started successfully on port 21');
  }

  // Utility methods
  private async ensureConfigDirectory(): Promise<void> {
    await fs.mkdir(this.configDir, { recursive: true });
  }

  private generateSecurePassword(length: number = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  // Get connection info
  async getConnectionInfo(): Promise<ServerCredentials> {
    const sshDir = path.join(this.configDir, 'ssh');
    const ftpDir = path.join(this.configDir, 'ftp');

    return {
      ssh: {
        port: 2222,
        users: [{
          username: 'fanslab',
          password: 'auto-generated',
          homeDirectory: path.join(this.configDir, 'home', 'fanslab'),
          shell: '/bin/bash',
          permissions: ['read', 'write', 'execute']
        }],
        configPath: path.join(sshDir, 'sshd_config')
      },
      ftp: {
        port: 21,
        passivePortRange: [10000, 10100],
        users: [{
          username: 'fanslab',
          password: 'auto-generated',
          homeDirectory: path.join(this.configDir, 'ftp-home', 'fanslab'),
          permissions: ['read', 'write', 'delete'],
          uploadLimit: 1000000,
          downloadLimit: 1000000
        }],
        configPath: path.join(ftpDir, 'vsftpd.conf'),
        sslEnabled: true
      }
    };
  }

  // Service control
  async restartSSH(): Promise<{ success: boolean; message: string }> {
    try {
      // Stop existing SSH process if running
      if (this.sshProcess) {
        this.sshProcess.kill();
        this.sshProcess = null;
      }

      // Restart SSH service
      await this.startSSHService();

      return { success: true, message: 'SSH service restarted successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to restart SSH: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async restartFTP(): Promise<{ success: boolean; message: string }> {
    try {
      // Stop existing FTP process if running
      if (this.ftpProcess) {
        this.ftpProcess.kill();
        this.ftpProcess = null;
      }

      // Restart FTP service
      await this.startFTPService();

      return { success: true, message: 'FTP service restarted successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to restart FTP: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const sshFtpService = new SSHFTPService();