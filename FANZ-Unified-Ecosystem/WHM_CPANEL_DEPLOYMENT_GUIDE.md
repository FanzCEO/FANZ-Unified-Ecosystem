# WHM/cPanel Deployment Guide for FANZ Unified Ecosystem

## Overview

This guide will help you deploy the FANZ Unified Ecosystem (including all documentation) to your WHM/cPanel server.

---

## Prerequisites

- WHM/cPanel access with root or reseller permissions
- SSH access to server (recommended but not required)
- Node.js 18+ installed on server
- PostgreSQL database access
- Git installed on server (for automatic deployments)

---

## Deployment Options

### Option 1: SSH + Git Deployment (Recommended)

**Benefits:**
- Fastest deployment
- Automatic updates via `git pull`
- Full control over deployment

**Requirements:**
- SSH access
- Git installed on server

### Option 2: cPanel Git Version Control

**Benefits:**
- No SSH needed
- GUI-based deployment
- Automatic pulls from GitHub

**Requirements:**
- cPanel Git Version Control feature enabled

### Option 3: Manual FTP/File Manager Upload

**Benefits:**
- Works without SSH
- Simple for small updates

**Requirements:**
- FTP client or cPanel File Manager access

---

## Option 1: SSH + Git Deployment

### Step 1: Connect to Server via SSH

```bash
ssh root@your-server-ip
# OR
ssh username@your-server-ip
```

### Step 2: Navigate to Web Root

```bash
# For main domain
cd /home/username/public_html

# For subdomain (e.g., boyfanz.yourdomain.com)
cd /home/username/public_html/boyfanz

# For addon domain
cd /home/username/public_html/addondomain.com
```

### Step 3: Clone Repository

```bash
# First time deployment
git clone https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git .

# Or if directory not empty, clone to temp location then move
git clone https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git temp
mv temp/* .
mv temp/.* .
rm -rf temp
```

### Step 4: Install Dependencies

For each platform you want to deploy:

```bash
cd boyfanz
pnpm install
cd ..

cd girlfanz
pnpm install
cd ..

# Repeat for all platforms
```

### Step 5: Set Up Environment Variables

```bash
# Copy example env file
cp boyfanz/.env.example boyfanz/.env

# Edit with your credentials
nano boyfanz/.env
```

Add your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/boyfanz_db"
SESSION_SECRET="your-secret-key-here"
NODE_ENV="production"
PORT=3000
```

### Step 6: Build Production Files

```bash
cd boyfanz
pnpm run build
cd ..
```

### Step 7: Start Application

**Using PM2 (Recommended):**
```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd boyfanz
pm2 start npm --name "boyfanz" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on server reboot
pm2 startup
```

**Using Node directly:**
```bash
cd boyfanz
NODE_ENV=production node server/index.js &
```

### Step 8: Configure Apache/Nginx Reverse Proxy

**In WHM → Service Configuration → Apache Configuration → Include Editor:**

Add reverse proxy configuration:

```apache
<VirtualHost *:80>
    ServerName boyfanz.yourdomain.com

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog /var/log/apache2/boyfanz-error.log
    CustomLog /var/log/apache2/boyfanz-access.log combined
</VirtualHost>
```

Restart Apache:
```bash
systemctl restart httpd
```

### Step 9: Future Updates

```bash
cd /home/username/public_html/boyfanz
git pull
pnpm install
pnpm run build
pm2 restart boyfanz
```

---

## Option 2: cPanel Git Version Control

### Step 1: Enable Git in cPanel

1. Log into cPanel
2. Go to **Git Version Control**
3. Click **Create**

### Step 2: Configure Repository

Fill in:
- **Clone URL:** `https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git`
- **Repository Path:** `/home/username/repositories/fanz-ecosystem`
- **Repository Name:** `FANZ Unified Ecosystem`

Click **Create**

### Step 3: Deploy to Web Root

1. In Git Version Control, click **Manage** on your repository
2. Click **Pull or Deploy** tab
3. Set **Deployment Path:** `/home/username/public_html/boyfanz`
4. Click **Deploy HEAD Commit**

### Step 4: Install Dependencies via Terminal

In cPanel Terminal:
```bash
cd public_html/boyfanz
pnpm install
pnpm run build
```

### Step 5: Configure Application

Create `.env` file via File Manager:
1. Navigate to `public_html/boyfanz`
2. Create new file `.env`
3. Add your configuration

### Step 6: Set Up Node.js App

1. Go to **Setup Node.js App** in cPanel
2. Click **Create Application**
3. Fill in:
   - **Node.js version:** 18.x or higher
   - **Application mode:** Production
   - **Application root:** `boyfanz`
   - **Application URL:** `boyfanz.yourdomain.com`
   - **Application startup file:** `server/index.js`
4. Click **Create**

### Step 7: Start Application

Click **Start App** button in Node.js Apps

### Step 8: Future Updates

1. In Git Version Control → Click **Manage**
2. Click **Pull or Deploy** → **Update from Remote**
3. Click **Deploy HEAD Commit**
4. Restart Node.js app from Setup Node.js App

---

## Option 3: Manual FTP Upload

### Step 1: Download Repository Locally

```bash
# On your local machine
git clone https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git
cd FANZ-Unified-Ecosystem
```

### Step 2: Build Locally

```bash
cd boyfanz
pnpm install
pnpm run build
```

### Step 3: Upload via FTP

**Using FileZilla or similar:**

1. Connect to your server:
   - Host: `ftp.yourdomain.com`
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21

2. Navigate to `/public_html/boyfanz`

3. Upload files:
   - Upload `server/` directory
   - Upload `client/dist/` directory (built files)
   - Upload `package.json`
   - Upload `node_modules/` (or install on server)
   - Upload `.env` with your configuration

### Step 4: Install Dependencies on Server

Via cPanel Terminal:
```bash
cd public_html/boyfanz
pnpm install --production
```

### Step 5: Start Application

Use cPanel's Node.js App setup (see Option 2, Step 6-7)

---

## Platform-Specific Deployment

### Deploy All 16 Platforms

You can deploy multiple platforms to different domains/subdomains:

**Example Structure:**
- `boyfanz.com` → `/home/username/public_html/boyfanz`
- `girlfanz.com` → `/home/username/public_html/girlfanz`
- `gayfanz.com` → `/home/username/public_html/gayfanz`

**Or subdomains:**
- `boyfanz.fanz.com` → `/home/username/public_html/boyfanz`
- `girlfanz.fanz.com` → `/home/username/public_html/girlfanz`

### Automated Multi-Platform Deployment Script

Save this as `deploy-all-platforms.sh`:

```bash
#!/bin/bash

PLATFORMS=("boyfanz" "girlfanz" "gayfanz" "bearfanz" "cougarfanz" "pupfanz" "femmefanz" "transfanz" "southernfanz" "taboofanz" "guyz" "dlbroz" "fanzuncut")
BASE_DIR="/home/username/public_html"

for platform in "${PLATFORMS[@]}"; do
    echo "=== Deploying $platform ==="

    cd "$BASE_DIR/$platform"

    # Pull latest code
    git pull

    # Install dependencies
    pnpm install

    # Build
    pnpm run build

    # Restart PM2 app
    pm2 restart "$platform"

    echo "✓ $platform deployed successfully"
done

echo "All platforms deployed!"
```

Run with:
```bash
chmod +x deploy-all-platforms.sh
./deploy-all-platforms.sh
```

---

## Database Setup

### Create Databases via WHM

1. Log into WHM
2. Go to **SQL Services → MySQL/PostgreSQL Database Wizard**
3. For each platform, create:
   - Database name: `username_boyfanz`
   - Database user: `username_bfuser`
   - Password: [strong password]
   - Grant ALL PRIVILEGES

### Run Migrations

```bash
cd boyfanz
pnpm run migrate
```

---

## Documentation Deployment

The documentation we created is already in the repository and will deploy automatically:

**Locations after deployment:**
- `/public_html/boyfanz/docs/how-to/*.md`
- `/public_html/boyfanz/docs/ai-knowledge-base/*.json`
- Same for all other platforms

**Master docs:**
- `/public_html/master-docs/how-to/*.md`
- `/public_html/master-docs/ai-knowledge-base/*.json`

---

## SSL Certificates

### Auto SSL (Recommended)

1. WHM → SSL/TLS → Manage AutoSSL
2. Enable for all users
3. Certificates auto-renew every 90 days

### Manual SSL (Let's Encrypt)

```bash
# Install Certbot
yum install certbot python3-certbot-apache

# Get certificate
certbot --apache -d boyfanz.yourdomain.com

# Auto-renewal
certbot renew --dry-run
```

---

## Monitoring & Maintenance

### Check Application Status

```bash
pm2 status
pm2 logs boyfanz
```

### Monitor Resources

In WHM:
- Server Status → Service Status
- Server Status → Server Information

### Logs

**Application logs:**
```bash
tail -f /home/username/public_html/boyfanz/logs/app.log
```

**Apache logs:**
```bash
tail -f /var/log/apache2/boyfanz-error.log
```

**PM2 logs:**
```bash
pm2 logs boyfanz --lines 100
```

---

## Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
cd /home/username/public_html/boyfanz
rm -rf node_modules
pnpm install
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 [PID]

# Or change port in .env
PORT=3001
```

### Issue: Permission denied

**Solution:**
```bash
# Fix ownership
chown -R username:username /home/username/public_html/boyfanz

# Fix permissions
chmod -R 755 /home/username/public_html/boyfanz
```

### Issue: Database connection failed

**Solution:**
1. Verify database exists in WHM
2. Check DATABASE_URL in `.env`
3. Test connection:
```bash
psql -U username_bfuser -d username_boyfanz -h localhost
```

---

## Security Checklist

- ☑ `.env` files are NOT in web root or publicly accessible
- ☑ SSL certificates installed
- ☑ Firewall configured (allow only 80, 443, 22)
- ☑ Database users have minimal required privileges
- ☑ Regular backups enabled in WHM
- ☑ ModSecurity enabled
- ☑ CSF firewall configured
- ☑ Fail2ban or similar intrusion prevention
- ☑ Keep Node.js and dependencies updated

---

## Backup Strategy

### WHM Backups

1. WHM → Backup → Backup Configuration
2. Enable daily backups
3. Retain 7 days minimum
4. Include:
   - Home directories
   - MySQL/PostgreSQL databases
   - Configuration files

### Manual Backup

```bash
# Backup application
tar -czf boyfanz-backup-$(date +%Y%m%d).tar.gz /home/username/public_html/boyfanz

# Backup database
pg_dump username_boyfanz > boyfanz-db-backup-$(date +%Y%m%d).sql

# Download backups
scp username@server:/path/to/backups/*.tar.gz ./local-backups/
```

---

## Performance Optimization

### Enable Caching

**In .htaccess:**
```apache
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/gif "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType text/css "access plus 1 month"
ExpiresByType text/javascript "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Enable Gzip Compression

```apache
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### Use CDN

- CloudFlare (Free tier available)
- StackPath
- KeyCDN

---

## Next Steps

1. ☐ Choose deployment option (SSH recommended)
2. ☐ Set up first platform (boyfanz as test)
3. ☐ Verify documentation is accessible
4. ☐ Test application functionality
5. ☐ Configure SSL certificates
6. ☐ Set up monitoring and backups
7. ☐ Deploy remaining platforms
8. ☐ Configure CDN (optional)

---

## Support

For deployment issues:
1. Check logs first (`pm2 logs` or Apache logs)
2. Verify environment variables in `.env`
3. Ensure all dependencies installed (`pnpm install`)
4. Check database connectivity
5. Review firewall and ports

Need help? All documentation is now deployed with your applications at `/docs/`
