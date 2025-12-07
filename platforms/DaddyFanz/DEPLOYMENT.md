# DaddyFanz - Digital Ocean Deployment Guide

## Prerequisites

- Digital Ocean account
- GitHub repository with your code
- Custom domains: daddiesfanz.com and fanz.daddiesfanz.com configured
- Required API keys and secrets

## Deployment Options

### Option 1: Digital Ocean App Platform (Recommended)

1. **Push code to GitHub**
   ```bash
   git remote add origin https://github.com/your-username/daddyfanz.git
   git push -u origin main
   ```

2. **Create App in Digital Ocean**
   - Go to Digital Ocean Dashboard → Apps
   - Click "Create App"
   - Select GitHub and authorize
   - Choose your repository
   - Upload or paste the `app.yaml` configuration

3. **Configure Environment Variables**
   Required secrets (set in Digital Ocean dashboard):
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Random 32+ character string
   - `JWT_SECRET` - Random 32+ character string
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `PUBLIC_OBJECT_SEARCH_PATHS` - S3 bucket path for public assets
   - `PRIVATE_OBJECT_DIR` - S3 bucket path for private content

4. **Deploy**
   - Click "Deploy"
   - Digital Ocean will build and deploy automatically
   - Configure custom domains in the app settings

### Option 2: Docker on Digital Ocean Droplet

1. **Create a Droplet**
   - Ubuntu 22.04 LTS
   - Minimum: 2 GB RAM / 1 vCPU
   - Recommended: 4 GB RAM / 2 vCPU

2. **Install Docker and Docker Compose**
   ```bash
   ssh root@your-droplet-ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   apt-get install docker-compose-plugin
   ```

3. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/daddyfanz.git
   cd daddyfanz
   ```

4. **Create .env file**
   ```bash
   nano .env
   ```
   Add all required environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://user:password@host:5432/database
   SESSION_SECRET=your-session-secret
   JWT_SECRET=your-jwt-secret
   OPENAI_API_KEY=your-openai-key
   PUBLIC_OBJECT_SEARCH_PATHS=/public
   PRIVATE_OBJECT_DIR=/.private
   CORS_ORIGIN=https://daddiesfanz.com,https://fanz.daddiesfanz.com
   ```

5. **Build and Run with Docker**
   ```bash
   docker build -t daddyfanz .
   docker run -d \
     --name daddyfanz \
     -p 5000:5000 \
     --env-file .env \
     --restart unless-stopped \
     daddyfanz
   ```

6. **Setup Nginx as Reverse Proxy**
   ```bash
   apt-get install nginx certbot python3-certbot-nginx
   
   # Configure Nginx
   nano /etc/nginx/sites-available/daddyfanz
   ```
   
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name daddiesfanz.com fanz.daddiesfanz.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /ws {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
       }
   }
   ```
   
   Enable site and get SSL:
   ```bash
   ln -s /etc/nginx/sites-available/daddyfanz /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   
   # Get SSL certificates
   certbot --nginx -d daddiesfanz.com -d fanz.daddiesfanz.com
   ```

### Option 3: PM2 on Digital Ocean Droplet

1. **Create Droplet** (same as Docker option)

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   npm install -g pm2
   ```

3. **Clone and Setup**
   ```bash
   git clone https://github.com/your-username/daddyfanz.git
   cd daddyfanz
   npm install
   npm run build
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   # Add all required variables
   ```

5. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx** (same as Docker option above)

## Database Setup

### Using Digital Ocean Managed Database (Recommended)

1. Create a PostgreSQL database in Digital Ocean
2. Get connection string from database settings
3. Add to `DATABASE_URL` environment variable
4. Run migrations:
   ```bash
   npm run db:push
   ```

### Using External Database (e.g., Neon)

1. Keep your existing `DATABASE_URL`
2. Ensure it's accessible from Digital Ocean IPs
3. Update firewall rules if needed

## Post-Deployment Tasks

1. **Run Database Migrations**
   ```bash
   npm run db:push
   ```

2. **Verify Health Check**
   ```bash
   curl https://daddiesfanz.com/api/health
   ```

3. **Configure DNS**
   - Point daddiesfanz.com to Digital Ocean nameservers or droplet IP
   - Point fanz.daddiesfanz.com to same IP
   - Wait for DNS propagation (can take up to 48 hours)

4. **Setup Monitoring**
   - Enable Digital Ocean monitoring in dashboard
   - Configure alerts for downtime, CPU, memory

5. **Setup Backups**
   - Enable automated database backups
   - Configure weekly droplet snapshots (if using droplet)

6. **Setup Scheduled Jobs** (for background tasks)
   ```bash
   # Add to crontab
   crontab -e
   
   # Publish scheduled posts every 5 minutes
   */5 * * * * curl -X POST https://daddiesfanz.com/api/admin/publish-scheduled
   
   # Update leaderboards daily at midnight
   0 0 * * * curl -X POST https://daddiesfanz.com/api/admin/leaderboards
   ```

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `5000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key | Random 32+ chars |
| `JWT_SECRET` | JWT signing key | Random 32+ chars |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Public assets path | `/public` |
| `PRIVATE_OBJECT_DIR` | Private content path | `/.private` |
| `CORS_ORIGIN` | Allowed origins | `https://daddiesfanz.com,https://fanz.daddiesfanz.com` |

## Optional Payment Gateway Variables

Configure when ready to process payments:
- `CCBILL_MERCHANT_ID`
- `CCBILL_API_KEY`
- `SEGPAY_MERCHANT_ID`
- `SEGPAY_API_KEY`
- `EPOCH_MERCHANT_ID`
- `EPOCH_API_KEY`

## Monitoring and Logs

### App Platform
- View logs in Digital Ocean dashboard → Your App → Runtime Logs
- Set up log forwarding to external service (Datadog, LogDNA)

### Droplet with PM2
```bash
# View logs
pm2 logs daddyfanz

# Monitor processes
pm2 monit

# View status
pm2 status
```

### Droplet with Docker
```bash
# View logs
docker logs -f daddyfanz

# View stats
docker stats daddyfanz
```

## Troubleshooting

### App won't start
- Check environment variables are set correctly
- Verify DATABASE_URL is accessible
- Check build logs for errors

### WebSocket not connecting
- Ensure WebSocket upgrades are enabled in proxy
- Check firewall allows WebSocket connections
- Verify `/ws` route is properly proxied

### Database connection errors
- Verify DATABASE_URL format
- Check database is running and accessible
- Ensure SSL mode is correct for managed databases

### High memory usage
- Increase instance size
- Check for memory leaks in logs
- Review PM2 `max_memory_restart` setting

## Security Checklist

- [ ] All secrets stored as environment variables
- [ ] SSL/TLS certificates installed and auto-renewing
- [ ] Database has strong password and restricted access
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Regular security updates enabled
- [ ] Monitoring and alerting configured
- [ ] Automated backups enabled
- [ ] Rate limiting enabled in application
- [ ] CORS properly configured for your domains

## Performance Optimization

1. **Enable caching** - Add Redis for session storage
2. **CDN** - Use Digital Ocean Spaces CDN for static assets
3. **Database indexing** - Ensure proper indexes on frequently queried columns
4. **Horizontal scaling** - Use App Platform's auto-scaling or load balancer with droplets
5. **Monitoring** - Set up APM (Application Performance Monitoring)

## Support

For issues with:
- **Digital Ocean**: Contact DO support or check status.digitalocean.com
- **Application**: Check application logs and GitHub issues
- **Database**: Review Neon/DO database documentation
