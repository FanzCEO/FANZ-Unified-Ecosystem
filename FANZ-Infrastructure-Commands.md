# 🛠️ FANZ Infrastructure Management Commands

## Quick Status Check
```bash
# Overall infrastructure status
echo "=== FANZ INFRASTRUCTURE STATUS ===" && \
echo "📊 Droplets:" && doctl compute droplet list --format "Name,Status,Region,Memory" && \
echo -e "\n🗄️ Databases:" && doctl databases list --format "Name,Engine,Status,Region" && \
echo -e "\n🌐 Load Balancers:" && doctl compute load-balancer list --format "Name,Status,IP" && \
echo -e "\n📦 Spaces:" && aws s3 ls --endpoint-url https://nyc3.digitaloceanspaces.com --profile fanz-spaces
```

## Database Management
```bash
# Check database cluster status
doctl databases list

# View database backups
doctl databases backups 075f6156-d2ae-4bd1-bfac-ab6a0eaa203a

# Get database connection details
doctl databases connection 075f6156-d2ae-4bd1-bfac-ab6a0eaa203a

# Check Valkey cluster status
doctl databases get aab2912d-fe7b-481f-bcbe-3cbdf1c0c35c
```

## Kubernetes Management
```bash
# Get cluster info
doctl kubernetes cluster list

# Get kubectl config
doctl kubernetes cluster kubeconfig save doks-fanz-prod

# Check cluster nodes
kubectl get nodes

# Check running pods
kubectl get pods --all-namespaces
```

## Storage Management
```bash
# List all Spaces buckets
aws s3 ls --endpoint-url https://nyc3.digitaloceanspaces.com --profile fanz-spaces

# Upload file to media bucket
aws s3 cp file.jpg s3://fanz-media-content/ --endpoint-url https://nyc3.digitaloceanspaces.com --profile fanz-spaces

# Check CDN endpoints
doctl compute cdn list

# Purge CDN cache
doctl compute cdn flush <cdn-id> --files "*"
```

## Domain Management
```bash
# List domains
doctl compute domain list

# Add DNS record
doctl compute domain records create <domain> --record-type A --record-name <name> --record-data <ip>

# List DNS records for domain
doctl compute domain records list <domain>
```

## Backup Operations
```bash
# Create droplet snapshot
doctl compute droplet-action snapshot <droplet-id> --snapshot-name="backup-$(date +%Y%m%d)"

# List snapshots
doctl compute snapshot list --resource droplet

# Database backup (automatic daily backups are enabled)
doctl databases backups <database-id>
```

## Security Management
```bash
# List VPCs
doctl vpcs list

# Check firewall rules (when configured)
doctl compute firewall list

# SSH to bastion host
ssh -i ~/.ssh/id_ed25519 root@<bastion-ip>

# SSH through bastion to other servers
ssh -J root@<bastion-ip> root@<target-server-ip>
```

## Monitoring & Logging
```bash
# SSH to monitoring server
ssh -i ~/.ssh/id_ed25519 root@<monitoring-server-ip>

# Check load balancer health
doctl compute load-balancer list

# View load balancer details
doctl compute load-balancer get <lb-id>
```

## Scaling Operations
```bash
# Scale Kubernetes node pool
doctl kubernetes cluster node-pool resize <cluster-id> <pool-id> --count 3

# Resize database cluster
doctl databases resize <database-id> --size db-s-2vcpu-4gb

# Create new droplet
doctl compute droplet create <name> \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-4gb \
  --region nyc3 \
  --vpc-uuid a00c43ed-2bfb-467b-9571-e53efcffee64 \
  --tag-names fanz,production
```

## Disaster Recovery
```bash
# Create full infrastructure snapshot
# (Run these commands to backup critical components)

# 1. Backup all droplets
for droplet_id in $(doctl compute droplet list --format ID --no-header); do
  doctl compute droplet-action snapshot $droplet_id --snapshot-name="dr-backup-$(date +%Y%m%d)-$droplet_id"
done

# 2. Export database (manual process via pg_dump)
# Connect to database and run: pg_dump > backup.sql

# 3. Sync Spaces to backup bucket
aws s3 sync s3://fanz-media-content s3://fanz-backups/media-backup-$(date +%Y%m%d) \
  --endpoint-url https://nyc3.digitaloceanspaces.com --profile fanz-spaces
```

## Cost Monitoring
```bash
# Check account usage (requires billing API access)
doctl account get

# Estimate costs based on current resources:
# - 5 Droplets: ~$180/month
# - 3 Databases: ~$240/month  
# - 1 Load Balancer: ~$12/month
# - Spaces: ~$5/month + bandwidth
# - CDN: Pay per use
# Total: ~$437/month + bandwidth
```

## Environment Variables for Automation
```bash
# Add these to your .bashrc or .zshrc for easier management
export FANZ_CLUSTER_ID="a9a7a1d0-8e32-4a2d-a795-89964c9c635f"
export FANZ_PRIMARY_DB="075f6156-d2ae-4bd1-bfac-ab6a0eaa203a"
export FANZ_ADS_DB="7fec469f-ed58-4a0b-8c55-ddf737076aec"
export FANZ_VALKEY_DB="aab2912d-fe7b-481f-bcbe-3cbdf1c0c35c"
export FANZ_LB_ID="6e89f2b5-aa69-48b4-b221-98db4dff56a6"
export FANZ_VPC_MAIN="a00c43ed-2bfb-467b-9571-e53efcffee64"
export FANZ_VPC_SECURITY="85486fe4-a603-4763-8f04-15dc116d8dd2"
```

## Emergency Contacts & Resources
- **DigitalOcean Support**: https://cloud.digitalocean.com/support
- **Documentation**: https://docs.digitalocean.com
- **Status Page**: https://status.digitalocean.com
- **API Documentation**: https://docs.digitalocean.com/reference/api/

---
**Quick Command Reference Created**: $(date)
**Infrastructure**: FANZ Production Environment
