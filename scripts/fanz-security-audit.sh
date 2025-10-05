#!/bin/bash
# 🔐 FANZ Security Audit & Hardening
# Streamlined security assessment for FANZ ecosystem
# Per FANZ rules: Zero-trust architecture with state-of-the-art security

set -o pipefail

# Configuration
FANZ_HOME="${FANZ_HOME:-$(pwd)}"
LOG_DIR="${FANZ_HOME}/logs/security"
REPORT_DIR="${FANZ_HOME}/security/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[SECURITY]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${LOG_DIR}/security.log"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${LOG_DIR}/security.log"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${LOG_DIR}/security.log"
}

log_error() {
    echo -e "${RED}[CRITICAL]${NC} $(date '+%H:%M:%S') - $1" | tee -a "${LOG_DIR}/security.log"
}

log_header() {
    echo -e "${PURPLE}
╔══════════════════════════════════════════════════════════════╗
║                    FANZ $1
╚══════════════════════════════════════════════════════════════╝${NC}"
}

# Initialize directories
init_directories() {
    mkdir -p "$LOG_DIR" "$REPORT_DIR" "${FANZ_HOME}/security/config"
    log_info "Initialized security directories"
}

# Quick security scan
quick_security_scan() {
    log_header "SECURITY SCAN"
    log_info "Running FANZ security assessment..."
    
    local critical_issues=0
    local warnings=0
    local passes=0
    
    # Check for sensitive files
    log_info "Checking sensitive file permissions..."
    local sensitive_files=$(find "$FANZ_HOME" -name "*.env*" -o -name "*secret*" -o -name "*key*" -o -name "*.pem" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$sensitive_files" -gt 0 ]; then
        log_info "Found $sensitive_files sensitive files - securing permissions"
        find "$FANZ_HOME" -name "*.env*" -exec chmod 600 {} \; 2>/dev/null
        find "$FANZ_HOME" -name "*secret*" -exec chmod 600 {} \; 2>/dev/null
        find "$FANZ_HOME" -name "*key*" -exec chmod 600 {} \; 2>/dev/null
        find "$FANZ_HOME" -name "*.pem" -exec chmod 600 {} \; 2>/dev/null
        passes=$((passes + 1))
    fi
    
    # Check for hardcoded secrets (basic scan)
    log_info "Scanning for potential hardcoded secrets..."
    local secret_matches=0
    secret_matches=$(grep -r -i "password.*=" "$FANZ_HOME" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l | tr -d ' ')
    secret_matches=$((secret_matches + $(grep -r -i "api[_-]key.*=" "$FANZ_HOME" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | wc -l | tr -d ' ')))
    
    if [ "$secret_matches" -gt 5 ]; then
        log_error "Found $secret_matches potential hardcoded secrets - review required"
        critical_issues=$((critical_issues + 1))
    elif [ "$secret_matches" -gt 0 ]; then
        log_warning "Found $secret_matches potential secrets - verify they're in templates/examples"
        warnings=$((warnings + 1))
    else
        log_success "No obvious hardcoded secrets detected"
        passes=$((passes + 1))
    fi
    
    # Check for insecure HTTP usage
    log_info "Checking for insecure HTTP usage..."
    local http_usage=$(grep -r "http://" "$FANZ_HOME" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v "localhost\|127.0.0.1" | wc -l | tr -d ' ')
    
    if [ "$http_usage" -gt 0 ]; then
        log_warning "Found $http_usage instances of HTTP usage - consider HTTPS"
        warnings=$((warnings + 1))
    else
        log_success "No insecure HTTP usage found"
        passes=$((passes + 1))
    fi
    
    # Check Node.js vulnerabilities
    if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
        log_info "Checking Node.js dependencies for vulnerabilities..."
        local audit_result=$(npm audit --audit-level=critical --json 2>/dev/null | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
        
        if [ "$audit_result" -gt 0 ]; then
            log_error "Found $audit_result critical vulnerabilities in dependencies"
            critical_issues=$((critical_issues + 1))
        else
            log_success "No critical vulnerabilities in dependencies"
            passes=$((passes + 1))
        fi
    fi
    
    # Check Docker security basics
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        log_info "Checking Docker security..."
        
        # Check for privileged containers
        local privileged=$(docker ps --filter "privileged=true" --format "{{.Names}}" 2>/dev/null | wc -l | tr -d ' ')
        if [ "$privileged" -gt 0 ]; then
            log_error "Found $privileged privileged containers running"
            critical_issues=$((critical_issues + 1))
        else
            log_success "No privileged containers detected"
            passes=$((passes + 1))
        fi
        
        # Check Dockerfiles
        local dockerfiles=$(find "$FANZ_HOME" -name "Dockerfile*" 2>/dev/null)
        if [ -n "$dockerfiles" ]; then
            local unsafe_dockerfiles=0
            while IFS= read -r dockerfile; do
                if [ -f "$dockerfile" ] && ! grep -q "USER " "$dockerfile"; then
                    unsafe_dockerfiles=$((unsafe_dockerfiles + 1))
                fi
            done <<< "$dockerfiles"
            
            if [ "$unsafe_dockerfiles" -gt 0 ]; then
                log_warning "$unsafe_dockerfiles Dockerfiles don't specify non-root users"
                warnings=$((warnings + 1))
            else
                log_success "Dockerfile security practices look good"
                passes=$((passes + 1))
            fi
        fi
    fi
    
    # Generate quick report
    local total_checks=$((critical_issues + warnings + passes))
    local security_score=0
    if [ $total_checks -gt 0 ]; then
        security_score=$(echo "scale=1; ($passes * 100) / $total_checks" | bc -l 2>/dev/null || echo "0")
    fi
    
    log_info "Security scan completed"
    echo "📊 Security Score: ${security_score}%"
    echo "✅ Passed: $passes"
    echo "⚠️  Warnings: $warnings"
    echo "🚨 Critical: $critical_issues"
    
    return $critical_issues
}

# Apply security hardening
apply_hardening() {
    log_header "SECURITY HARDENING"
    log_info "Applying FANZ security hardening measures..."
    
    local hardening_applied=0
    
    # Create security configuration directory
    mkdir -p "${FANZ_HOME}/security/config"
    
    # Create Nginx security configuration template
    log_info "Creating Nginx security configuration template..."
    cat > "${FANZ_HOME}/security/config/nginx-security.conf" <<'EOF'
# FANZ Nginx Security Configuration
# Add these directives to your nginx server blocks

# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# Hide server information
server_tokens off;

# Rate limiting for FANZ platforms
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/m;
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/m;

# SSL/TLS configuration (TLS 1.3)
ssl_protocols TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;

# Block common attacks and sensitive files
location ~* \.(git|svn|env|log)$ {
    deny all;
}

location ~ /\. {
    deny all;
}

# Adult content specific protections
location /api/age-verification {
    limit_req zone=login burst=3 nodelay;
}

location /api/upload {
    limit_req zone=upload burst=5 nodelay;
    client_max_body_size 100M;
}
EOF
    hardening_applied=$((hardening_applied + 1))
    
    # Create Docker security template
    log_info "Creating Docker security configuration template..."
    cat > "${FANZ_HOME}/security/config/docker-security.yml" <<'EOF'
# FANZ Docker Security Configuration
# Use these security practices for all FANZ containers

version: '3.8'
services:
  fanz-app:
    build: .
    user: "1001:1001"           # Non-root user
    read_only: true             # Read-only filesystem
    cap_drop:                   # Drop all capabilities
      - ALL
    cap_add:                    # Add only required capabilities
      - CAP_NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
    tmpfs:                      # Secure temporary storage
      - /tmp:noexec,nosuid,size=100m
      - /var/tmp:noexec,nosuid,size=50m
    networks:
      - fanz-internal           # Internal network only
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  fanz-internal:
    driver: bridge
    internal: true              # No external access
    
volumes:
  fanz-data:
    driver: local
    driver_opts:
      type: none
      o: bind,rw
      device: /opt/fanz/data
EOF
    hardening_applied=$((hardening_applied + 1))
    
    # Create environment security template
    log_info "Creating environment security template..."
    cat > "${FANZ_HOME}/security/config/.env.security.template" <<'EOF'
# FANZ Security Environment Variables Template
# Copy to .env and replace with actual secure values

# Database Security (TLS 1.3 required)
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
DB_SSL_CERT=/path/to/client-cert.pem
DB_SSL_KEY=/path/to/client-key.pem
DB_SSL_CA=/path/to/ca-cert.pem

# Session Security
SESSION_SECRET=generate-cryptographically-secure-32-byte-key-here
SESSION_SECURE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=strict
SESSION_MAX_AGE=3600

# API Security
API_RATE_LIMIT_REQUESTS=100
API_RATE_LIMIT_WINDOW=60000
CORS_ORIGIN=https://your-domain.com
API_KEY_PREFIX=fanz_

# Encryption (AES-256)
ENCRYPTION_KEY=generate-32-byte-encryption-key-here
JWT_SECRET=generate-strong-jwt-secret-minimum-32-chars
PASSWORD_SALT_ROUNDS=12

# Adult Content Compliance
AGE_VERIFICATION_REQUIRED=true
CONTENT_MODERATION_AI_ENABLED=true
GDPR_COMPLIANCE_MODE=true
CONTENT_WATERMARK_ENABLED=true

# Monitoring & Alerts
LOG_LEVEL=info
SECURITY_AUDIT_ENABLED=true
ALERT_WEBHOOK_URL=https://your-webhook-endpoint
INCIDENT_RESPONSE_EMAIL=security@your-domain.com

# Infrastructure Security
CDN_SECURITY_TOKEN=your-cdn-security-token
WAF_ENABLED=true
DRM_PROTECTION_ENABLED=true
EOF
    hardening_applied=$((hardening_applied + 1))
    
    # Create security monitoring script
    log_info "Creating security monitoring script..."
    cat > "${FANZ_HOME}/security/config/monitor-security.sh" <<'EOF'
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
EOF
    chmod +x "${FANZ_HOME}/security/config/monitor-security.sh"
    hardening_applied=$((hardening_applied + 1))
    
    # Set secure permissions on sensitive files
    log_info "Securing file permissions..."
    find "$FANZ_HOME" -name "*.env*" -exec chmod 600 {} \; 2>/dev/null
    find "$FANZ_HOME" -name "*secret*" -exec chmod 600 {} \; 2>/dev/null
    find "$FANZ_HOME" -name "*key*" -exec chmod 600 {} \; 2>/dev/null
    find "$FANZ_HOME" -name "*.pem" -exec chmod 600 {} \; 2>/dev/null
    hardening_applied=$((hardening_applied + 1))
    
    log_success "Applied $hardening_applied security hardening measures"
    
    # Generate hardening report
    cat > "${REPORT_DIR}/hardening_report_${TIMESTAMP}.json" <<EOF
{
  "fanz_security_hardening": {
    "timestamp": "${TIMESTAMP}",
    "measures_applied": $hardening_applied,
    "status": "completed"
  },
  "configurations_created": [
    "nginx-security.conf",
    "docker-security.yml", 
    ".env.security.template",
    "monitor-security.sh"
  ],
  "security_improvements": [
    "Nginx security headers configured",
    "Docker security practices templated",
    "Environment variable security template created",
    "Security monitoring script installed",
    "File permissions hardened"
  ],
  "next_steps": [
    "Review and implement nginx configuration",
    "Apply Docker security template to containers",
    "Set up environment variables from template",
    "Schedule regular security monitoring",
    "Run periodic security audits"
  ]
}
EOF
    
    echo "📊 Hardening Report: ${REPORT_DIR}/hardening_report_${TIMESTAMP}.json"
    return 0
}

# Generate security recommendations
generate_recommendations() {
    log_info "Generating FANZ security recommendations..."
    
    cat > "${REPORT_DIR}/fanz_security_recommendations_${TIMESTAMP}.md" <<'EOF'
# FANZ Security Hardening Recommendations

## Immediate Actions (Within 24 Hours)

### Critical Security Measures
- [ ] **Remove any hardcoded secrets** from codebase
- [ ] **Enable TLS 1.3** for all services
- [ ] **Update vulnerable dependencies** immediately
- [ ] **Secure sensitive files** with proper permissions (600)
- [ ] **Disable SSH root login** if enabled

### Application Security
- [ ] **Implement rate limiting** on all API endpoints
- [ ] **Add security headers** to all HTTP responses
- [ ] **Enable CORS** with specific origins only
- [ ] **Validate all user inputs** server-side
- [ ] **Use parameterized queries** to prevent SQL injection

## Short-term Actions (Within 7 Days)

### Infrastructure Security
- [ ] **Set up Web Application Firewall (WAF)**
- [ ] **Configure DDoS protection**
- [ ] **Implement network segmentation**
- [ ] **Enable automated security monitoring**
- [ ] **Set up incident response procedures**

### Container Security
- [ ] **Run containers as non-root users**
- [ ] **Implement resource limits**
- [ ] **Use read-only filesystems** where possible
- [ ] **Scan container images** for vulnerabilities
- [ ] **Enable container runtime security**

## Medium-term Actions (Within 30 Days)

### FANZ-Specific Security
- [ ] **Implement robust age verification**
- [ ] **Add content watermarking/DRM**
- [ ] **Enable geo-restrictions** where required
- [ ] **Set up DMCA takedown automation**
- [ ] **Implement creator verification system**

### Compliance & Privacy
- [ ] **Complete GDPR compliance audit**
- [ ] **Ensure ADA accessibility compliance**
- [ ] **Implement data retention policies**
- [ ] **Enable privacy-by-design features**
- [ ] **Set up audit logging**

## Long-term Actions (Within 90 Days)

### Advanced Security
- [ ] **Implement Zero-Trust architecture**
- [ ] **Set up SIEM (Security Information and Event Management)**
- [ ] **Enable behavioral analytics**
- [ ] **Implement threat intelligence feeds**
- [ ] **Regular penetration testing**

### Monitoring & Response
- [ ] **24/7 security monitoring**
- [ ] **Automated incident response**
- [ ] **Security awareness training**
- [ ] **Regular security assessments**
- [ ] **Bug bounty program**

## Security Tools Recommended

### Web Application Firewall
- **Cloudflare Pro** (adult-content friendly)
- **AWS WAF** with custom rules
- **Fastly WAF** for high-performance needs

### Container Security
- **Docker Security Scanning**
- **Aqua Security** for runtime protection
- **Twistlock** for comprehensive container security

### Secret Management
- **HashiCorp Vault** for enterprise
- **AWS Secrets Manager** for cloud-native
- **Environment-based secrets** for simpler setups

### Monitoring & SIEM
- **Splunk** for enterprise SIEM
- **ELK Stack** for open-source solution
- **DataDog** for cloud monitoring

## Adult Content Industry Compliance

### Legal Requirements
- [ ] **Age verification** (18+ confirmation)
- [ ] **Content labeling** (appropriate warnings)
- [ ] **Geographic restrictions** (comply with local laws)
- [ ] **Data protection** (user privacy rights)
- [ ] **Record keeping** (2257 compliance if applicable)

### Platform Security
- [ ] **Content encryption** at rest and in transit
- [ ] **User data protection** with strong encryption
- [ ] **Payment security** (PCI DSS compliance)
- [ ] **Regular security audits** by third parties
- [ ] **Incident response plan** specific to adult content

## Implementation Priority Matrix

| Priority | Timeframe | Focus Area |
|----------|-----------|------------|
| **P1** | 24 hours | Remove hardcoded secrets, enable TLS 1.3 |
| **P2** | 7 days | WAF, rate limiting, container security |
| **P3** | 30 days | FANZ compliance, GDPR, audit logging |
| **P4** | 90 days | Zero-trust, SIEM, pen testing |

## Success Metrics

- **Security Score**: Target >95%
- **Vulnerability Count**: Zero critical, minimal high
- **Incident Response Time**: <30 minutes detection, <2 hours resolution
- **Compliance Status**: 100% for GDPR, ADA, industry standards
- **Uptime**: Maintain 99.9%+ availability

## Contact & Escalation

For security incidents or questions:
1. **Immediate**: Use incident response procedures
2. **High Priority**: Security team direct contact
3. **General**: Regular security review meetings
4. **External**: Third-party security consultant as needed
EOF
    
    echo "📋 Recommendations: ${REPORT_DIR}/fanz_security_recommendations_${TIMESTAMP}.md"
}

# Main security review
run_security_review() {
    log_header "SECURITY HARDENING REVIEW"
    log_info "Starting comprehensive FANZ security hardening review..."
    
    local review_start=$(date +%s)
    
    # Run quick security scan
    if quick_security_scan; then
        log_success "Security scan completed with acceptable results"
    else
        log_warning "Security scan found issues requiring attention"
    fi
    
    # Apply hardening measures
    apply_hardening
    
    # Generate recommendations
    generate_recommendations
    
    local review_end=$(date +%s)
    local duration=$((review_end - review_start))
    
    log_success "Security hardening review completed in ${duration}s"
    
    echo ""
    echo "🔐 FANZ Security Review Summary:"
    echo "================================"
    echo "✅ Security configurations created"
    echo "✅ File permissions hardened"
    echo "✅ Monitoring tools installed" 
    echo "✅ Security recommendations generated"
    echo ""
    echo "📁 Security files created in: ${FANZ_HOME}/security/"
    echo "📊 Reports available in: ${REPORT_DIR}/"
    echo ""
    echo "🚨 Next steps:"
    echo "1. Review security recommendations"
    echo "2. Implement nginx security configuration"
    echo "3. Apply Docker security template"
    echo "4. Set up environment variables securely"
    echo "5. Schedule regular security monitoring"
}

# Initialize and run
main() {
    local command="${1:-review}"
    
    init_directories
    
    case "$command" in
        "scan")
            quick_security_scan
            ;;
        "harden")
            apply_hardening
            ;;
        "review")
            run_security_review
            ;;
        *)
            echo "Usage: $0 [scan|harden|review]"
            echo "  scan   - Quick security scan only"
            echo "  harden - Apply hardening measures only"
            echo "  review - Full security review (default)"
            ;;
    esac
}

main "$@"