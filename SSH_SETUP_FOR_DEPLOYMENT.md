# SSH Setup for Automated Deployment

## Server Information
- **IP Address**: 67.217.54.66
- **Hostname**: server.fanzgroupholdings.com (DNS not configured yet)
- **Status**: Server is online and SSH is accessible

## Quick Setup (2 minutes)

### Option 1: Via WHM Terminal (Fastest)

1. Log into WHM at: https://67.217.54.66:2087
2. Go to **Terminal**
3. Run these commands:

```bash
# Add Claude's SSH public key
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC3YBlqgriDPKMNsaQkqB9ZnOOkhKxYE9ecOU9vx3Gz+S3y7azAVe6sDosCR8BWcbTAPOf8Yi/XXOwi3geAZP+vEYY42WGv26cXb7cIGOvKJbl/4RMeLkTvRDWGBMZ9s2r0o2JaEp7xN2xRpEnO/KT5OoY8D6dec73CAw6kH6qRg2tmuYp0cjSUJ/zQPuQ/4f9e8qXAyLEo9rmnDR/E0f7G+Z2l54Bk7J5aTL/itRpZDXHNg3G5EQjoVlXj30DKxKfqRbGjXa/ERtaupo9rzvdBLNrK+U+Tn8FZusg52EhCfSSw7Eeu7uMRkNTzU9lXlORfAp+WwUcud80KilihnbQVjkF1v2y29Y2p/49FKLUqdIVQRTTmcjUrsDZ78RcsBl3+cT8Ed0LzdSXFU51AZu2tR6PxCxu3j70W1dsiNlTrvWdr1RU11L2fTOrzwlNUMgMbidsn4S7vciabyl0j4pqcvfA7yo8ggL9Iadmkwl0w3c2MZaq11rZjh0pB9NNEQYEHq/dGn2abYl4h86SZNepqTBEtxHvVXrT2dkljBGkGOUfyGYbhffQfs3D3GXXUDDj9VoqQXqoWs+pk3ZLKhRcaeTBu8zP3sxDVSR76I2TdY7l9WkgsFDGRgxLqofAmhzqYdPCN4WAvnlcyA1Y+UAWpDm6X1bhnoup36ck/invfZQ== claude-deploy@fanz" >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify
echo "✓ SSH key added successfully"
```

### Option 2: Via SSH (If you already have access)

```bash
ssh root@67.217.54.66

# Then run the same commands above
```

### Option 3: Via WHM GUI

1. WHM → **Security Center** → **Manage root's SSH Keys**
2. Click **Import Key**
3. Paste this public key:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC3YBlqgriDPKMNsaQkqB9ZnOOkhKxYE9ecOU9vx3Gz+S3y7azAVe6sDosCR8BWcbTAPOf8Yi/XXOwi3geAZP+vEYY42WGv26cXb7cIGOvKJbl/4RMeLkTvRDWGBMZ9s2r0o2JaEp7xN2xRpEnO/KT5OoY8D6dec73CAw6kH6qRg2tmuYp0cjSUJ/zQPuQ/4f9e8qXAyLEo9rmnDR/E0f7G+Z2l54Bk7J5aTL/itRpZDXHNg3G5EQjoVlXj30DKxKfqRbGjXa/ERtaupo9rzvdBLNrK+U+Tn8FZusg52EhCfSSw7Eeu7uMRkNTzU9lXlORfAp+WwUcud80KilihnbQVjkF1v2y29Y2p/49FKLUqdIVQRTTmcjUrsDZ78RcsBl3+cT8Ed0LzdSXFU51AZu2tR6PxCxu3j70W1dsiNlTrvWdr1RU11L2fTOrzwlNUMgMbidsn4S7vciabyl0j4pqcvfA7yo8ggL9Iadmkwl0w3c2MZaq11rZjh0pB9NNEQYEHq/dGn2abYl4h86SZNepqTBEtxHvVXrT2dkljBGkGOUfyGYbhffQfs3D3GXXUDDj9VoqQXqoWs+pk3ZLKhRcaeTBu8zP3sxDVSR76I2TdY7l9WkgsFDGRgxLqofAmhzqYdPCN4WAvnlcyA1Y+UAWpDm6X1bhnoup36ck/invfZQ== claude-deploy@fanz
```
4. Click **Authorize**

## After SSH Key is Added

Once you've added the SSH key, I can immediately:
1. Connect to your server
2. Install Node.js, pnpm, and PM2 automatically
3. Clone the FANZ repository from GitHub
4. Deploy all 16 platforms
5. Configure PM2 process management
6. Set up reverse proxy for each platform

## Test Connection

To verify the key was added correctly, try:
```bash
ssh -o StrictHostKeyChecking=no root@67.217.54.66 'whoami'
```

Should return: `root`

## What Happens Next

Once SSH access is configured, the deployment script will:
- ✅ Test connection to server
- ✅ Install Node.js 18+ via NVM
- ✅ Install pnpm globally
- ✅ Install PM2 for process management
- ✅ Clone FANZ-Unified-Ecosystem from GitHub
- ✅ Deploy all platforms with documentation
- ✅ Build production bundles
- ✅ Start apps with PM2
- ✅ Configure auto-restart on server reboot

**Estimated Time**: 15-30 minutes for all 16 platforms

## Alternative: Manual Deployment

If you prefer not to add SSH keys, you can manually deploy using the guide:
- See: `WHM_CPANEL_DEPLOYMENT_GUIDE.md`
- Use cPanel Git Version Control (no SSH needed)
- Or upload via FTP

## Questions?

Check the comprehensive deployment guide:
```
WHM_CPANEL_DEPLOYMENT_GUIDE.md
```
