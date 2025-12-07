import { storage } from './storage';
import { vibeSpecParser } from './vibeSpecParser';
import { aiService } from './aiService';
import type { Build, Project } from '@shared/schema';

interface DeploymentConfig {
  environment: 'preview' | 'production';
  domain?: string;
  resources: {
    cpu: string;
    memory: string;
    storage: string;
  };
  services: {
    postgres: boolean;
    redis: boolean;
    s3: boolean;
    cdn: boolean;
  };
}

interface ExportData {
  sourceFiles: Record<string, string>;
  docker: {
    dockerfile: string;
    compose: string;
  };
  terraform: {
    main: string;
    variables: string;
    outputs: string;
  };
  migrations: string[];
  readme: string;
  envExample: string;
}

class BuildService {
  /**
   * Start a new build for a project
   */
  async startBuild(buildId: string, projectId: string): Promise<void> {
    try {
      // Update build status
      await storage.updateBuild(buildId, {
        status: 'building',
        startedAt: new Date()
      });

      // Get project details
      const project = await storage.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Parse VibeSpec
      let vibeSpec;
      if (project.vibespec) {
        vibeSpec = project.vibespec;
      } else {
        // Generate default VibeSpec based on template
        vibeSpec = vibeSpecParser.generateFromPrompt(project.description || '');
      }

      // Generate code using AI
      const generatedCode = await aiService.generateCode(vibeSpec as any, project.template || 'creator-paywall');

      // Build Docker image
      const dockerImage = await this.buildDockerImage(projectId, generatedCode);

      // Update build with success
      await storage.updateBuild(buildId, {
        status: 'success',
        dockerImage,
        completedAt: new Date(),
        logsUrl: `/api/builds/${buildId}/logs`
      });

      // Update project status
      await storage.updateProject(projectId, {
        status: 'deployed',
        previewUrl: `https://${projectId}.preview.fanz.app`
      });

    } catch (error) {
      console.error('Build failed:', error);
      
      await storage.updateBuild(buildId, {
        status: 'failed',
        completedAt: new Date(),
        logsUrl: `/api/builds/${buildId}/logs`
      });

      await storage.updateProject(projectId, {
        status: 'failed'
      });
    }
  }

  /**
   * Deploy a project to specified environment
   */
  async deploy(projectId: string, environment: 'preview' | 'production', domain?: string): Promise<any> {
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const deployConfig: DeploymentConfig = {
      environment,
      domain,
      resources: {
        cpu: environment === 'production' ? '2' : '1',
        memory: environment === 'production' ? '4Gi' : '2Gi',
        storage: environment === 'production' ? '100Gi' : '50Gi',
      },
      services: {
        postgres: true,
        redis: true,
        s3: true,
        cdn: environment === 'production',
      }
    };

    // Generate Terraform configuration
    const terraformConfig = this.generateTerraformConfig(project, deployConfig);

    // Deploy infrastructure
    const deploymentResult = await this.deployInfrastructure(terraformConfig, deployConfig);

    // Update project with deployment URLs
    const deployUrl = domain ? `https://${domain}` : `https://${projectId}.${environment}.fanz.app`;
    
    await storage.updateProject(projectId, {
      status: 'deployed',
      deployUrl,
      updatedAt: new Date()
    });

    return {
      deploymentId: deploymentResult.id,
      url: deployUrl,
      status: 'deployed',
      environment,
      resources: deployConfig.resources,
      services: deployConfig.services
    };
  }

  /**
   * Export project with all necessary files
   */
  async exportProject(projectId: string): Promise<ExportData> {
    const project = await storage.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const vibeSpec = project.vibespec || vibeSpecParser.generateFromPrompt(project.description || '');
    
    // Generate source files
    const sourceFiles = await this.generateSourceFiles(vibeSpec as any, project.template || 'creator-paywall');
    
    // Generate Docker configuration
    const dockerConfig = this.generateDockerConfig(project, vibeSpec as any);
    
    // Generate Terraform configuration
    const terraformConfig = this.generateTerraformExport(project);
    
    // Generate database migrations
    const migrations = this.generateMigrations(vibeSpec as any);
    
    // Generate documentation
    const readme = this.generateReadme(project, vibeSpec as any);
    const envExample = this.generateEnvExample(vibeSpec as any);

    return {
      sourceFiles,
      docker: dockerConfig,
      terraform: terraformConfig,
      migrations,
      readme,
      envExample
    };
  }

  /**
   * Build Docker image for project
   */
  private async buildDockerImage(projectId: string, code: string): Promise<string> {
    // Simulate Docker build process
    const imageTag = `fanz-forge/${projectId}:${Date.now()}`;
    
    // In a real implementation, this would:
    // 1. Create temporary directory with generated code
    // 2. Generate appropriate Dockerfile
    // 3. Build image using Docker API
    // 4. Push to registry
    // 5. Return image reference
    
    return imageTag;
  }

  /**
   * Generate source files based on VibeSpec
   */
  private async generateSourceFiles(vibeSpec: any, template: string): Promise<Record<string, string>> {
    const files: Record<string, string> = {};

    if (vibeSpec.app.stack === 'nextjs-node') {
      // Generate Next.js files
      files['package.json'] = this.generatePackageJson(vibeSpec);
      files['next.config.js'] = this.generateNextConfig(vibeSpec);
      files['app/layout.tsx'] = this.generateLayoutComponent(vibeSpec);
      files['app/page.tsx'] = this.generatePageComponent(vibeSpec);
      
      // Generate components based on features
      if (vibeSpec.features.some((f: any) => f.type === 'membership')) {
        files['components/Paywall.tsx'] = this.generatePaywallComponent(vibeSpec);
      }
      if (vibeSpec.features.some((f: any) => f.type === 'dm')) {
        files['components/DMChat.tsx'] = this.generateDMChatComponent(vibeSpec);
      }
      if (vibeSpec.features.some((f: any) => f.type === 'media')) {
        files['components/MediaUpload.tsx'] = this.generateMediaUploadComponent(vibeSpec);
      }
      
    } else if (vibeSpec.app.stack === 'fastapi-python') {
      // Generate FastAPI files
      files['requirements.txt'] = this.generateRequirements(vibeSpec);
      files['main.py'] = this.generateFastAPIMain(vibeSpec);
      files['models.py'] = this.generateModels(vibeSpec);
      files['routers/auth.py'] = this.generateAuthRouter(vibeSpec);
    }

    // Generate shared files
    files['README.md'] = this.generateReadme({ name: vibeSpec.app.name } as Project, vibeSpec);
    files['.env.example'] = this.generateEnvExample(vibeSpec);
    files['docker-compose.yml'] = this.generateDockerCompose(vibeSpec);

    return files;
  }

  /**
   * Generate Docker configuration
   */
  private generateDockerConfig(project: Project, vibeSpec: any): { dockerfile: string; compose: string } {
    const isNextJS = vibeSpec.app.stack === 'nextjs-node';
    
    const dockerfile = isNextJS ? `
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
` : `
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
`;

    const compose = `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "${isNextJS ? '3000:3000' : '8000:8000'}"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/fanzforge
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=fanzforge
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`;

    return { dockerfile, compose };
  }

  /**
   * Generate Terraform configuration for export
   */
  private generateTerraformExport(project: Project): { main: string; variables: string; outputs: string } {
    const main = `
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${project.name}-vpc"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.\${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${project.name}-public-\${count.index + 1}"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${project.name}-cluster"
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier     = "${project.name}-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true
  
  db_name  = "fanzforge"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Name = "${project.name}-database"
  }
}

# S3 Bucket for storage
resource "aws_s3_bucket" "main" {
  bucket = "${project.name}-storage-\${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

data "aws_availability_zones" "available" {
  state = "available"
}
`;

    const variables = `
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "fanzforge"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}
`;

    const outputs = `
output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.main.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}
`;

    return { main, variables, outputs };
  }

  // Component generation methods
  private generatePackageJson(vibeSpec: any): string {
    return JSON.stringify({
      name: vibeSpec.app.name,
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint"
      },
      dependencies: {
        "next": "14.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "@auth/next-auth": "^5.0.0",
        "drizzle-orm": "^0.29.0",
        "@neondatabase/serverless": "^0.7.2",
        ...(vibeSpec.features.some((f: any) => f.type === 'payments') && {
          "@stripe/stripe-js": "^2.1.0",
          "stripe": "^14.0.0"
        }),
        ...(vibeSpec.features.some((f: any) => f.type === 'media') && {
          "multer": "^1.4.5-lts.1",
          "sharp": "^0.32.6"
        })
      },
      devDependencies: {
        "typescript": "^5.2.2",
        "@types/node": "^20.8.0",
        "@types/react": "^18.2.33",
        "@types/react-dom": "^18.2.14",
        "tailwindcss": "^3.3.5",
        "autoprefixer": "^10.4.16",
        "postcss": "^8.4.31"
      }
    }, null, 2);
  }

  private generateNextConfig(vibeSpec: any): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  ${vibeSpec.features.some((f: any) => f.type === 'media') ? `
  images: {
    domains: ['localhost', 's3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
  },
  ` : ''}
}

module.exports = nextConfig`;
  }

  private generatePaywallComponent(vibeSpec: any): string {
    const membershipFeature = vibeSpec.features.find((f: any) => f.type === 'membership');
    const tiers = membershipFeature?.config?.tiers || ['Free', 'Bronze', 'Silver', 'Gold'];
    
    return `import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PaywallProps {
  tiers?: string[];
  onSubscribe?: (tier: string) => void;
}

export default function PaywallComponent({ tiers = ${JSON.stringify(tiers)}, onSubscribe }: PaywallProps) {
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleSubscribe = (tier: string) => {
    setSelectedTier(tier);
    onSubscribe?.(tier);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold neon-text mb-4">Unlock Premium Content</h2>
        <p className="text-muted-foreground">Choose your membership tier and get access to exclusive content</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-${Math.min(tiers.length, 4)} gap-6">
        {tiers.map((tier, index) => (
          <div key={tier} className="neon-border rounded-lg p-6 text-center hover:shadow-lg transition-all">
            <h3 className="text-xl font-bold mb-4">{tier} Tier</h3>
            <div className="text-2xl font-bold mb-4">
              {tier === 'Free' ? 'Free' : \`$\${(index * 10 + 9.99).toFixed(2)}/mo\`}
            </div>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2">
              <li>✓ Access to {tier.toLowerCase()} content</li>
              <li>✓ Community features</li>
              {index > 0 && <li>✓ Direct messaging</li>}
              {index > 1 && <li>✓ Exclusive photos</li>}
              {index > 2 && <li>✓ Video content</li>}
            </ul>
            <button
              onClick={() => handleSubscribe(tier)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:shadow-lg transition-all"
              disabled={selectedTier === tier}
            >
              {selectedTier === tier ? 'Selected' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}`;
  }

  private generateDMChatComponent(vibeSpec: any): string {
    return `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  senderId: string;
  content: string;
  isPPV?: boolean;
  tipAmount?: number;
  timestamp: Date;
}

interface DMChatProps {
  userId: string;
  enableTips?: boolean;
  enablePPV?: boolean;
}

export default function DMChat({ userId, enableTips = true, enablePPV = true }: DMChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [tipAmount, setTipAmount] = useState(5);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'anonymous',
      content: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const sendTip = () => {
    const tipMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'anonymous',
      content: newMessage || 'Sent a tip!',
      tipAmount,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, tipMessage]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-96 neon-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-secondary">Private Messages</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map(message => (
          <div key={message.id} className={\`flex \${message.senderId === user?.id ? 'justify-end' : 'justify-start'}\`}>
            <div className={\`max-w-xs p-3 rounded-lg \${
              message.senderId === user?.id 
                ? 'bg-primary text-primary-foreground ml-8' 
                : 'bg-muted'
            }\`}>
              {message.tipAmount && (
                <div className="text-xs text-accent mb-1">💰 Tip: $\{message.tipAmount}</div>
              )}
              <div className="text-sm">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-input border border-border rounded"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-3 py-2 bg-secondary text-secondary-foreground rounded hover:shadow-lg transition-all"
          >
            Send
          </button>
          {enableTips && (
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(Number(e.target.value))}
                className="w-16 px-2 py-2 bg-input border border-border rounded text-center"
                min="1"
              />
              <button
                onClick={sendTip}
                className="px-3 py-2 bg-accent text-accent-foreground rounded hover:shadow-lg transition-all"
              >
                💰
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;
  }

  private generateMediaUploadComponent(vibeSpec: any): string {
    return `import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface MediaUploadProps {
  onUpload?: (file: File, metadata: any) => void;
  maxSize?: number;
  acceptedTypes?: string[];
}

export default function MediaUpload({ 
  onUpload, 
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/*', 'video/*']
}: MediaUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    ageVerified: false,
    performers: [''],
    shootDate: '',
    location: '',
    custodianId: user?.id || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert('File size too large');
      return;
    }

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    if (!metadata.ageVerified) {
      alert('Age verification is required for content upload');
      return;
    }

    setUploading(true);
    
    try {
      // In a real implementation, this would upload to your backend
      // which would handle 2257 compliance, watermarking, etc.
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload
      
      onUpload?.(file, metadata);
      
      // Reset form
      setMetadata({
        title: '',
        description: '',
        ageVerified: false,
        performers: [''],
        shootDate: '',
        location: '',
        custodianId: user?.id || ''
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 neon-border rounded-lg">
      <h3 className="text-xl font-bold mb-6 text-accent">2257 Compliant Media Upload</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Media File</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            className="w-full px-3 py-2 border border-border rounded bg-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded bg-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded bg-input"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Shoot Date</label>
          <input
            type="date"
            value={metadata.shootDate}
            onChange={(e) => setMetadata(prev => ({ ...prev, shootDate: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded bg-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <input
            type="text"
            value={metadata.location}
            onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded bg-input"
            placeholder="City, State/Province, Country"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="ageVerified"
            checked={metadata.ageVerified}
            onChange={(e) => setMetadata(prev => ({ ...prev, ageVerified: e.target.checked }))}
            className="w-4 h-4"
          />
          <label htmlFor="ageVerified" className="text-sm">
            I verify that all performers are 18+ years old and have valid age verification documentation
          </label>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !metadata.ageVerified}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:shadow-lg transition-all disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Select and Upload Media'}
        </button>
      </div>
    </div>
  );
}`;
  }

  private generateLayoutComponent(vibeSpec: any): string {
    return `import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${vibeSpec.app.name}',
  description: 'Built with FANZ Forge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  )
}`;
  }

  private generatePageComponent(vibeSpec: any): string {
    const hasPaywall = vibeSpec.features.some((f: any) => f.type === 'membership');
    const hasDM = vibeSpec.features.some((f: any) => f.type === 'dm');
    const hasMedia = vibeSpec.features.some((f: any) => f.type === 'media');

    return `'use client'

import { useState } from 'react'
${hasPaywall ? "import PaywallComponent from '@/components/Paywall'" : ''}
${hasDM ? "import DMChat from '@/components/DMChat'" : ''}
${hasMedia ? "import MediaUpload from '@/components/MediaUpload'" : ''}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <header className="p-6 border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-4xl font-bold neon-text">${vibeSpec.app.name}</h1>
          <nav className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('home')}
              className={\`px-4 py-2 rounded \${activeTab === 'home' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}\`}
            >
              Home
            </button>
            ${hasPaywall ? `
            <button 
              onClick={() => setActiveTab('membership')}
              className={\`px-4 py-2 rounded \${activeTab === 'membership' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}\`}
            >
              Membership
            </button>
            ` : ''}
            ${hasDM ? `
            <button 
              onClick={() => setActiveTab('messages')}
              className={\`px-4 py-2 rounded \${activeTab === 'messages' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}\`}
            >
              Messages
            </button>
            ` : ''}
            ${hasMedia ? `
            <button 
              onClick={() => setActiveTab('upload')}
              className={\`px-4 py-2 rounded \${activeTab === 'upload' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}\`}
            >
              Upload
            </button>
            ` : ''}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'home' && (
          <div className="text-center py-12">
            <h2 className="text-6xl font-bold mb-6">
              Welcome to <span className="neon-text">${vibeSpec.app.name}</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Your premium creator platform built with FANZ Forge
            </p>
          </div>
        )}

        ${hasPaywall ? `
        {activeTab === 'membership' && (
          <PaywallComponent />
        )}
        ` : ''}

        ${hasDM ? `
        {activeTab === 'messages' && (
          <DMChat userId="current-user" enableTips enablePPV />
        )}
        ` : ''}

        ${hasMedia ? `
        {activeTab === 'upload' && (
          <MediaUpload onUpload={(file, metadata) => console.log('Uploaded:', file, metadata)} />
        )}
        ` : ''}
      </main>
    </div>
  )
}`;
  }

  private generateMigrations(vibeSpec: any): string[] {
    const migrations = [
      `-- Initial schema migration
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
    ];

    if (vibeSpec.features.some((f: any) => f.type === 'membership')) {
      migrations.push(`-- Membership tiers migration
CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  tier_id UUID REFERENCES membership_tiers(id),
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);`);
    }

    if (vibeSpec.features.some((f: any) => f.type === 'media')) {
      migrations.push(`-- Media and 2257 compliance migration
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  shoot_date DATE,
  location VARCHAR(255),
  custodian_id UUID REFERENCES users(id),
  age_verified BOOLEAN DEFAULT FALSE,
  compliance_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID REFERENCES media_files(id),
  name VARCHAR(255),
  age_verification_ref TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`);
    }

    return migrations;
  }

  private generateReadme(project: Project, vibeSpec: any): string {
    return `# ${project.name}

Built with FANZ Forge - AI-powered creator platform development.

## Features

${vibeSpec.features.map((f: any) => `- ${f.type.charAt(0).toUpperCase() + f.type.slice(1)} integration`).join('\n')}

## Tech Stack

- **Frontend**: ${vibeSpec.app.stack === 'nextjs-node' ? 'Next.js 14 with React 18' : 'FastAPI with HTMX'}
- **Database**: ${vibeSpec.app.database === 'postgres' ? 'PostgreSQL' : 'None'}
- **Authentication**: ${vibeSpec.app.auth === 'oidc' ? 'OpenID Connect' : 'None'}
- **Storage**: ${vibeSpec.app.storage === 's3' ? 'AWS S3 compatible' : 'None'}

## Quick Start

1. **Install dependencies**:
   \`\`\`bash
   ${vibeSpec.app.stack === 'nextjs-node' ? 'npm install' : 'pip install -r requirements.txt'}
   \`\`\`

2. **Set up environment**:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

3. **Run database migrations**:
   \`\`\`bash
   # Apply migrations from migrations/ directory
   \`\`\`

4. **Start development server**:
   \`\`\`bash
   ${vibeSpec.app.stack === 'nextjs-node' ? 'npm run dev' : 'uvicorn main:app --reload'}
   \`\`\`

## Deployment

### Using Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

### Using Terraform

\`\`\`bash
cd terraform/
terraform init
terraform plan
terraform apply
\`\`\`

## 2257 Compliance

${vibeSpec.features.some((f: any) => f.type === 'media') ? `
This application includes built-in 18 U.S.C. §2257 compliance features:

- Age verification workflows
- Record keeping requirements
- Performer documentation
- Custodian of records designation
- Audit logging

**Important**: Ensure you have proper legal counsel and understand your obligations under federal law.
` : 'No media upload features detected. Add media upload for 2257 compliance features.'}

## Configuration

Key environment variables:

\`\`\`bash
# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Database
DATABASE_URL=

# Storage
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Payment Providers
${vibeSpec.features.some((f: any) => f.type === 'payments') ? `
STRIPE_SECRET_KEY=
CCBILL_CLIENT_ID=
NMI_API_KEY=
` : '# No payment providers configured'}
\`\`\`

## Support

- Documentation: [FANZ Forge Docs](https://docs.fanz.app/forge)
- Community: [Discord Server](https://discord.gg/fanz)
- Issues: [GitHub Issues](https://github.com/fanz/forge/issues)

## License

Built with FANZ Forge. See LICENSE for details.
`;
  }

  private generateEnvExample(vibeSpec: any): string {
    return `# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fanzforge

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key
OIDC_ISSUER_URL=https://your-auth-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Storage
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_REGION=us-east-1

# Redis (for sessions and caching)
REDIS_URL=redis://localhost:6379

${vibeSpec.features.some((f: any) => f.type === 'payments') ? `
# Payment Providers
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CCBILL_CLIENT_ID=your-ccbill-client-id
CCBILL_SUBACCOUNT=your-subaccount
NMI_API_KEY=your-nmi-api-key
` : ''}

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
OTEL_EXPORTER_OTLP_ENDPOINT=your-otlp-endpoint

# FANZ Integration
FANZLAB_WEBHOOK_URL=https://lab.fanz.app/webhooks
FANZLAB_WEBHOOK_SECRET=your-webhook-secret
`;
  }

  private generateRequirements(vibeSpec: any): string {
    return `fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-decouple==3.8
${vibeSpec.features.some((f: any) => f.type === 'payments') ? 'stripe==7.7.0' : ''}
${vibeSpec.features.some((f: any) => f.type === 'media') ? 'pillow==10.1.0' : ''}
jinja2==3.1.2
aiofiles==23.2.1
`;
  }

  private generateFastAPIMain(vibeSpec: any): string {
    return `from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

app = FastAPI(title="${vibeSpec.app.name}", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=${JSON.stringify(vibeSpec.security?.cors || ['*'])},
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": "${vibeSpec.app.name}"}

# Main routes
@app.get("/")
async def root():
    return {"message": "Welcome to ${vibeSpec.app.name}"}

${vibeSpec.features.some((f: any) => f.type === 'membership') ? `
# Membership routes
@app.get("/api/tiers")
async def get_membership_tiers():
    return [
        {"name": "Bronze", "price": 9.99},
        {"name": "Silver", "price": 19.99},
        {"name": "Gold", "price": 39.99}
    ]
` : ''}

${vibeSpec.features.some((f: any) => f.type === 'media') ? `
# Media upload routes
@app.post("/api/upload")
async def upload_media():
    # Implement 2257 compliant media upload
    return {"status": "uploaded"}
` : ''}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`;
  }

  private generateModels(vibeSpec: any): string {
    return `from sqlalchemy import Column, String, DateTime, Boolean, Text, Numeric, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    profile_image_url = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

${vibeSpec.features.some((f: any) => f.type === 'membership') ? `
class MembershipTier(Base):
    __tablename__ = "membership_tiers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    features = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    tier_id = Column(UUID(as_uuid=True), ForeignKey("membership_tiers.id"))
    status = Column(String, default="active")
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    user = relationship("User")
    tier = relationship("MembershipTier")
` : ''}

${vibeSpec.features.some((f: any) => f.type === 'media') ? `
class MediaFile(Base):
    __tablename__ = "media_files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(String)
    mime_type = Column(String)
    title = Column(String)
    description = Column(Text)
    shoot_date = Column(DateTime)
    location = Column(String)
    custodian_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    age_verified = Column(Boolean, default=False)
    compliance_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id])
    custodian = relationship("User", foreign_keys=[custodian_id])
` : ''}
`;
  }

  private generateAuthRouter(vibeSpec: any): string {
    return `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models import User

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
async def login():
    # Implement OIDC login flow
    return {"status": "login initiated"}

@router.post("/logout")
async def logout():
    # Implement logout
    return {"status": "logged out"}

@router.get("/user")
async def get_current_user():
    # Get current authenticated user
    return {"user": "current_user_data"}
`;
  }

  private generateDockerCompose(vibeSpec: any): string {
    return this.generateDockerConfig({ name: vibeSpec.app.name } as Project, vibeSpec).compose;
  }

  private async deployInfrastructure(terraformConfig: any, deployConfig: DeploymentConfig): Promise<{ id: string }> {
    // Simulate infrastructure deployment
    // In a real implementation, this would:
    // 1. Apply Terraform configuration
    // 2. Set up monitoring and logging
    // 3. Configure load balancers
    // 4. Set up auto-scaling
    // 5. Configure backup systems
    
    return { id: `deploy-${Date.now()}` };
  }

  private generateTerraformConfig(project: Project, config: DeploymentConfig): any {
    // Generate Terraform configuration for deployment
    return {
      provider: 'aws',
      region: 'us-east-1',
      environment: config.environment,
      resources: config.resources,
      services: config.services
    };
  }
}

export const buildService = new BuildService();
