# 🔧 cPanel Deployment Guide - FANZ Unified Ecosystem

> **Guide for deploying FANZ to cPanel shared hosting**

---

## ✅ Fixed cPanel Configuration

The `.cpanel.yml` file has been corrected with:

1. ✅ **Proper syntax**: `export DEPLOYPATH=/home/...`
2. ✅ **Correct path**: `/home/fanzgroup/public_html`
3. ✅ **Removed**: "backdoor" reference

---

## 📋 cPanel Deployment Path

### Current Configuration:
```yaml
- export DEPLOYPATH=/home/fanzgroup/public_html
```

### Customize for Your Server:

If your cPanel username or path is different, update line 13 in `.cpanel.yml`:

**For public_html (main domain):**
```yaml
- export DEPLOYPATH=/home/YOUR_USERNAME/public_html
```

**For subdomain:**
```yaml
- export DEPLOYPATH=/home/YOUR_USERNAME/public_html/subdomain
```

**For addon domain:**
```yaml
- export DEPLOYPATH=/home/YOUR_USERNAME/domains/yourdomain.com/public_html
```

---

## 🚀 How to Deploy to cPanel

### Prerequisites:
1. cPanel account with SSH/Git access
2. Node.js enabled in cPanel
3. Git Version Control feature enabled

### Step 1: Set Up Git in cPanel

1. **Login to cPanel**
2. **Go to**: Git™ Version Control
3. **Click**: Create
4. **Configure**:
   - Clone URL: `https://github.com/FanzCEO/FANZ-Unified-Ecosystem.git`
   - Repository Path: `/home/fanzgroup/repositories/FANZ-Unified-Ecosystem`
   - Branch: `main`
   - Deployment Path: (Leave blank, .cpanel.yml handles this)

### Step 2: Enable Deployment

1. **In Git Version Control**: Click "Manage" on your repository
2. **Enable**: "Pull or Deploy" → "Deploy HEAD commit"
3. **Save**

### Step 3: First Deployment

```bash
# SSH into your cPanel server
ssh fanzgroup@yourserver.com

# Navigate to repository
cd repositories/FANZ-Unified-Ecosystem

# Pull latest changes
git pull origin main

# cPanel will automatically run .cpanel.yml tasks
```

### Step 4: Verify Deployment

Check that files were copied to:
```bash
ls -la /home/fanzgroup/public_html/
```

You should see:
- `backend/`
- `frontend/`
- `api-gateway/`
- `services/`
- `package.json`
- etc.

---

## 🔒 Important Security Notes

### 1. Environment Variables

**DO NOT** commit your `.env` file!

Create `.env` manually on the server:
```bash
cd /home/fanzgroup/public_html
nano .env
```

Add your production variables:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:***@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres
SUPABASE_URL=https://mcayxybcgxhfttvwmhgm.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# ... other variables
```

Then secure it:
```bash
chmod 600 .env
```

### 2. File Permissions

The `.cpanel.yml` automatically sets:
- **Files**: 644 (rw-r--r--)
- **Directories**: 755 (rwxr-xr-x)
- **.env**: 600 (rw-------)
- **Uploads/Logs**: 777 (rwxrwxrwx)

### 3. Secure Directories

Protect sensitive directories in `.htaccess`:
```apache
# Deny access to backend code
<FilesMatch "\.(ts|js)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Deny access to config files
<FilesMatch "\.(env|yml|json)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>
```

---

## 🔧 What .cpanel.yml Does

The deployment script automatically:

### 1. **Creates Directories**
```yaml
- /bin/mkdir -p $DEPLOYPATH/logs
- /bin/mkdir -p $DEPLOYPATH/uploads
- /bin/mkdir -p $DEPLOYPATH/temp
```

### 2. **Copies Files**
- Backend code
- Frontend assets
- API gateway
- Services
- Documentation

### 3. **Installs Dependencies**
```yaml
- cd $DEPLOYPATH/backend && /usr/bin/npm install --production
- cd $DEPLOYPATH/frontend && /usr/bin/npm install --production
```

### 4. **Builds Frontend**
```yaml
- cd $DEPLOYPATH/frontend && /usr/bin/npm run build
```

### 5. **Sets Permissions**
```yaml
- /bin/find $DEPLOYPATH -type f -exec /bin/chmod 644 {} \;
- /bin/find $DEPLOYPATH -type d -exec /bin/chmod 755 {} \;
```

### 6. **Logs Deployment**
```yaml
- /bin/echo "Deployment completed at $(/bin/date)" >> $DEPLOYPATH/logs/deployment.log
```

---

## 🌐 Running Node.js Apps in cPanel

### Option 1: cPanel Node.js App Manager

1. **Go to**: Software → Setup Node.js App
2. **Click**: Create Application
3. **Configure**:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: `/home/fanzgroup/public_html/backend`
   - **Application URL**: yourdomain.com
   - **Application startup file**: `server.js` or `dist/index.js`
   - **Environment variables**: Add from your `.env`

4. **Click**: Create

### Option 2: PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd /home/fanzgroup/public_html/backend
pm2 start dist/index.js --name fanz-backend

# Start API gateway
cd /home/fanzgroup/public_html/api-gateway
pm2 start dist/server.js --name fanz-api-gateway

# Save PM2 process list
pm2 save

# Set PM2 to start on reboot
pm2 startup
```

---

## 🔄 Auto-Deploy on Git Push

### Set Up Webhook (Recommended)

1. **In cPanel Git Version Control**: Get webhook URL
2. **In GitHub**: Settings → Webhooks → Add webhook
3. **Configure**:
   - Payload URL: (cPanel webhook URL)
   - Content type: `application/json`
   - Events: Just the push event
   - Active: ✓

Now deployments happen automatically on `git push`!

---

## 📊 Monitoring & Logs

### Deployment Logs
```bash
tail -f /home/fanzgroup/public_html/logs/deployment.log
```

### Application Logs
```bash
# Backend logs
tail -f /home/fanzgroup/public_html/backend/logs/app.log

# Access logs
tail -f /home/fanzgroup/logs/access_log

# Error logs
tail -f /home/fanzgroup/logs/error_log
```

### PM2 Logs (if using PM2)
```bash
pm2 logs fanz-backend
pm2 logs fanz-api-gateway
```

---

## 🐛 Troubleshooting

### "Permission Denied" Errors
```bash
# Fix ownership
chown -R fanzgroup:fanzgroup /home/fanzgroup/public_html

# Fix permissions
chmod -R 755 /home/fanzgroup/public_html
chmod 600 /home/fanzgroup/public_html/.env
```

### "Module Not Found" Errors
```bash
# Reinstall dependencies
cd /home/fanzgroup/public_html/backend
rm -rf node_modules package-lock.json
npm install --production
```

### Node.js App Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+ or 22+

# Check for syntax errors
cd /home/fanzgroup/public_html/backend
node dist/index.js  # Run manually to see errors
```

### Database Connection Fails
```bash
# Test Supabase connection
psql "postgresql://postgres:***@db.mcayxybcgxhfttvwmhgm.supabase.co:5432/postgres"

# Verify .env file
cat /home/fanzgroup/public_html/.env | grep DATABASE_URL
```

---

## ⚡ Performance Tips

### 1. Enable Compression
Add to `.htaccess`:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

### 2. Enable Browser Caching
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 3. Use Node.js Production Mode
```bash
export NODE_ENV=production
```

---

## 🔄 Update Deployment

### Manual Update
```bash
ssh fanzgroup@yourserver.com
cd repositories/FANZ-Unified-Ecosystem
git pull origin main
# cPanel runs .cpanel.yml automatically
```

### Automatic Update (with webhook)
Just push to GitHub:
```bash
git push origin main
# cPanel deploys automatically
```

---

## 📞 cPanel Support

### Common cPanel Paths
- **Home**: `/home/fanzgroup/`
- **Public HTML**: `/home/fanzgroup/public_html/`
- **Logs**: `/home/fanzgroup/logs/`
- **Temp**: `/home/fanzgroup/tmp/`

### Useful Commands
```bash
# Check disk usage
du -sh /home/fanzgroup/public_html

# Check running processes
ps aux | grep node

# Check cPanel version
cat /usr/local/cpanel/version
```

---

## ✅ Deployment Checklist

### Before First Deploy
- [ ] cPanel account ready
- [ ] Node.js enabled
- [ ] Git repository connected
- [ ] `.cpanel.yml` path updated
- [ ] `.env` file created on server
- [ ] File permissions verified

### After Deploy
- [ ] Files copied to public_html
- [ ] Dependencies installed
- [ ] Frontend built successfully
- [ ] Node.js apps running
- [ ] Database connection working
- [ ] Logs being written
- [ ] Website accessible

---

## 🎯 Summary

Your `.cpanel.yml` is now correctly configured with:
- ✅ Proper deployment path
- ✅ Correct syntax
- ✅ Automated deployment tasks
- ✅ Security settings
- ✅ Permission management

**Ready for cPanel deployment!** 🚀

---

**Note**: This cPanel configuration is **separate** from your Render deployment. Both can coexist:
- **Render**: For scalable cloud hosting (current)
- **cPanel**: For traditional shared hosting (backup/alternative)

---

**Last Updated**: November 1, 2025  
**Deployment Path**: `/home/fanzgroup/public_html`  
**Status**: ✅ Ready

