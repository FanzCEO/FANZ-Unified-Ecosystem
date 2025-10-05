#!/bin/bash
# FANZ Security Monitoring Script
# Run this regularly to monitor security status

echo "🔐 FANZ Security Status Check - $(date)"
echo "============================================"

# Check for failed authentication attempts
echo "Failed login attempts (last 24h):"
if [ -f /var/log/auth.log ]; then
    grep "$(date --date='1 day ago' '+%b %d')" /var/log/auth.log | grep "authentication failure" | wc -l || echo "0"
else
    echo "Auth log not accessible"
fi

# Check disk space for security logs
echo "Security log disk usage:"
du -sh /var/log/ 2>/dev/null || echo "Cannot access log directory"

# Check for suspicious processes
echo "Suspicious network connections:"
netstat -tulpn 2>/dev/null | grep -v "127.0.0.1\|::1" | grep LISTEN | head -10

# Check Docker security status
if command -v docker >/dev/null 2>&1; then
    echo "Docker security check:"
    echo "  Privileged containers: $(docker ps --filter 'privileged=true' --format '{{.Names}}' 2>/dev/null | wc -l)"
    echo "  Root containers: $(docker ps --format '{{.Names}}' | xargs -I {} docker inspect {} --format '{{.Config.User}}' 2>/dev/null | grep -c '^$')"
fi

# Check SSL certificate expiry (if certificates exist)
echo "SSL certificate status:"
find . -name "*.pem" -o -name "*.crt" | head -5 | while read cert; do
    if openssl x509 -noout -dates -in "$cert" 2>/dev/null; then
        echo "  $cert: $(openssl x509 -noout -enddate -in "$cert" 2>/dev/null | cut -d= -f2)"
    fi
done 2>/dev/null || echo "  No certificates found or openssl not available"

echo "============================================"
echo "Security check completed at $(date)"
