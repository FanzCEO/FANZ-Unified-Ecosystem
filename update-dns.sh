#!/bin/bash
# Update DNS records to point to load balancer

LB_IP=$(doctl compute load-balancer list --format "IP" --no-header)

echo "🌐 Updating DNS records to point to load balancer: $LB_IP"

# Update A records for all domains (root)
doctl compute domain records create boyfanz.com --record-type A --record-name "@" --record-data $LB_IP
doctl compute domain records create girlfanz.com --record-type A --record-name "@" --record-data $LB_IP  
doctl compute domain records create pupfanz.com --record-type A --record-name "@" --record-data $LB_IP
doctl compute domain records create taboofanz.com --record-type A --record-name "@" --record-data $LB_IP

# Update API subdomain
doctl compute domain records create boyfanz.com --record-type A --record-name "api" --record-data $LB_IP

echo "✅ DNS records updated to point to load balancer: $LB_IP"
