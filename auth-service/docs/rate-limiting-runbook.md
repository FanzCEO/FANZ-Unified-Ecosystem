# FANZ Auth Service - Rate Limiting Operational Runbook

🚨 **Emergency Contact**: FANZ DevOps Team  
📊 **Dashboard**: [Rate Limiting Monitoring Dashboard](../monitoring/grafana-dashboards/rate-limiting-dashboard.json)  
🔍 **Metrics Endpoint**: `GET /metrics?format=prometheus`

## 🎯 Quick Actions

### 🚨 Emergency Rate Limit Disable
```bash
# Temporarily disable all rate limiting
export RATE_LIMIT_ENABLED=false
# Restart auth service
kubectl rollout restart deployment/auth-service
```

### ⚡ Quick Limit Adjustments
```bash
# Increase sensitive operation limits (login/registration)
export RL_SENSITIVE_MAX_IP=10        # Default: 5
export RL_SENSITIVE_MAX_ACCOUNT=6    # Default: 3

# Increase token operation limits
export RL_TOKEN_MAX_IP=60           # Default: 30
export RL_TOKEN_MAX_USER=120        # Default: 60

# Increase standard operation limits  
export RL_STANDARD_MAX_IP=120       # Default: 60

# Apply changes
kubectl rollout restart deployment/auth-service
```

## 📋 Common Scenarios

### 🔴 Scenario 1: Legitimate Users Getting Rate Limited

**Symptoms:**
- High number of 429 responses from auth endpoints
- User complaints about login/registration failures
- Dashboard shows high rate limit violations

**Diagnosis:**
```bash
# Check current violation rates
curl -s http://auth-service:3001/metrics | grep rate_limit_exceeded

# Check recent rate limit events  
curl -s http://auth-service:3001/health/rate-limit | jq '.recentEvents'

# Check top offending IPs
curl -s http://auth-service:3001/health/rate-limit | jq '.topOffendingIPs'
```

**Resolution:**
1. **Immediate**: Increase rate limits temporarily
   ```bash
   export RL_SENSITIVE_MAX_IP=10
   export RL_SENSITIVE_MAX_ACCOUNT=6
   kubectl set env deployment/auth-service RL_SENSITIVE_MAX_IP=10 RL_SENSITIVE_MAX_ACCOUNT=6
   ```

2. **Investigate**: Check if legitimate traffic patterns have changed
   ```bash
   # Check login success vs failure rates
   kubectl logs deployment/auth-service | grep "RATE_LIMIT_EXCEEDED" | tail -50
   
   # Look for patterns in user agents or IPs
   kubectl logs deployment/auth-service | grep "Login successful" | wc -l
   kubectl logs deployment/auth-service | grep "Rate limit exceeded" | wc -l
   ```

3. **Long-term**: Adjust baseline limits based on legitimate usage patterns

### 🟡 Scenario 2: Suspected Brute Force Attack

**Symptoms:**
- Sudden spike in rate limit violations
- Concentrated violations from few IP ranges
- High authentication failure rate

**Diagnosis:**
```bash
# Check violation patterns
curl -s http://auth-service:3001/health/rate-limit | jq '.categoryBreakdown'

# Look for concentrated IP attacks
kubectl logs deployment/auth-service | grep "RATE_LIMIT_EXCEEDED" | grep -o 'ip:[^,]*' | sort | uniq -c | sort -nr | head -10

# Check authentication failure patterns
kubectl logs deployment/auth-service | grep "Invalid credentials" | wc -l
```

**Response:**
1. **Monitor**: Let rate limiting do its job
2. **Alert**: Notify security team if violations exceed thresholds
3. **Block**: Consider IP-based blocking at gateway level for persistent offenders
   ```bash
   # Example: Block specific IP at gateway
   kubectl apply -f - <<EOF
   apiVersion: networking.istio.io/v1beta1
   kind: AuthorizationPolicy
   metadata:
     name: block-attack-ip
   spec:
     rules:
     - when:
       - key: source.ip
         values: ["192.168.1.100"]  # Replace with actual malicious IP
       action: DENY
   EOF
   ```

### 🔵 Scenario 3: FanzFinance OS Service Getting Rate Limited

**Symptoms:**
- FanzFinance OS reporting authentication failures
- Bypass events not showing in metrics
- Internal service tokens being rejected

**Diagnosis:**
```bash
# Check if bypasses are working
curl -s http://auth-service:3001/metrics | grep rate_limit_bypassed

# Verify bypass configuration
kubectl get configmap auth-config -o yaml | grep RL_BYPASS

# Check FanzFinance OS token structure
kubectl logs deployment/fanzfinance-os | grep "Auth token" | tail -5
```

**Resolution:**
1. **Verify JWT Claims**: Ensure FanzFinance OS tokens have correct audience
   ```javascript
   // Expected JWT payload
   {
     "aud": "fanzfinance-os",
     "svc": "fanzfinance-os", 
     "userId": "service-account-id"
   }
   ```

2. **Check API Keys**: Verify API key is in allowlist
   ```bash
   kubectl get secret auth-api-keys -o yaml | base64 -d
   ```

3. **Temporary Override**: Add API key bypass
   ```bash
   export RL_BYPASS_API_KEYS="fanzfinance-internal-key"
   kubectl set env deployment/auth-service RL_BYPASS_API_KEYS="fanzfinance-internal-key"
   ```

### 🟠 Scenario 4: Redis Connection Issues

**Symptoms:**
- Rate limiting falls back to memory store
- Inconsistent rate limiting across service replicas
- Warning logs about Redis connection

**Diagnosis:**
```bash
# Check Redis connectivity
kubectl exec deployment/auth-service -- redis-cli -u $REDIS_URL ping

# Check auth service logs for Redis errors
kubectl logs deployment/auth-service | grep -i redis | tail -20

# Verify Redis store initialization
kubectl logs deployment/auth-service | grep "Rate limit Redis store"
```

**Resolution:**
1. **Check Redis Health**:
   ```bash
   kubectl get pods -l app=redis
   kubectl describe service redis
   ```

2. **Restart Redis Connection**:
   ```bash
   kubectl rollout restart deployment/auth-service
   ```

3. **Temporary Fallback**: If Redis is down, service continues with memory store (per-instance limits only)

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|---------|
| `rate_limit_exceeded_sensitive` | > 100/hour | Investigation |
| `rate_limit_exceeded_sensitive` | > 500/hour | Alert team |
| `rate_limit_health_status` | = 2 (critical) | Immediate response |
| `rate_limit_bypassed` | Sudden increase | Verify legitimacy |
| Authentication success rate | < 95% | Check rate limits |

### Alert Queries (Prometheus)

```promql
# High rate of authentication blocks
rate(rate_limit_exceeded_sensitive[5m]) > 2

# Critical rate limiting health status  
rate_limit_health_status == 2

# Authentication success rate too low
(rate_limit_success_sensitive / (rate_limit_success_sensitive + rate_limit_exceeded_sensitive)) * 100 < 95

# Suspicious bypass activity
increase(rate_limit_bypassed[10m]) > 50
```

## 🔧 Configuration Management

### Environment Variables

| Variable | Default | Description | Hot Reload? |
|----------|---------|-------------|-------------|
| `RATE_LIMIT_ENABLED` | `true` | Master switch | ✅ Yes |
| `RL_SENSITIVE_MAX_IP` | `5` | Login attempts per IP/min | ✅ Yes |
| `RL_SENSITIVE_MAX_ACCOUNT` | `3` | Login attempts per account/min | ✅ Yes |
| `RL_TOKEN_MAX_IP` | `30` | Token requests per IP/min | ✅ Yes |
| `RL_STANDARD_MAX_IP` | `60` | Standard requests per IP/min | ✅ Yes |
| `RL_BYPASS_JWT_AUD` | `fanzfinance-os,fanz-internal` | Bypass audiences | ❌ Restart required |
| `RL_HMAC_SECRET` | - | Account hashing secret | ❌ Restart required |

### Hot Configuration Updates

```bash
# Update rate limits without restart (Kubernetes)
kubectl patch deployment auth-service -p '{"spec":{"template":{"spec":{"containers":[{"name":"auth-service","env":[{"name":"RL_SENSITIVE_MAX_IP","value":"10"}]}]}}}}'

# Check if update was applied
kubectl get pods -l app=auth-service -o jsonpath='{.items[*].spec.containers[*].env[?(@.name=="RL_SENSITIVE_MAX_IP")].value}'
```

### Configuration Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/auth-service

# Or rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=2

# Verify rollback
kubectl rollout status deployment/auth-service
```

## 🔍 Debugging & Investigation

### Log Analysis Commands

```bash
# Recent rate limit violations with context
kubectl logs deployment/auth-service --tail=100 | grep -A5 -B5 "RATE_LIMIT_EXCEEDED"

# Top violating IPs in last hour
kubectl logs deployment/auth-service --since=1h | grep "RATE_LIMIT_EXCEEDED" | grep -o 'ip:[^,]*' | sort | uniq -c | sort -nr

# Failed vs successful authentication ratio
kubectl logs deployment/auth-service --since=1h | grep -E "(Login successful|Rate limit exceeded|Invalid credentials)" | sort | uniq -c

# Bypass events analysis  
kubectl logs deployment/auth-service --since=1h | grep "RATE_LIMIT_BYPASSED" | jq -r '.reason' | sort | uniq -c
```

### Redis Key Investigation

```bash
# Check active rate limit keys
kubectl exec deployment/redis -- redis-cli KEYS "rl:auth:*" | head -20

# Check specific rate limit bucket
kubectl exec deployment/redis -- redis-cli TTL "rl:auth:sensitive:ip:192.168.1.100"
kubectl exec deployment/redis -- redis-cli GET "rl:auth:sensitive:ip:192.168.1.100"

# Count total rate limit keys
kubectl exec deployment/redis -- redis-cli KEYS "rl:auth:*" | wc -l
```

### Health Check Endpoints

```bash
# Overall service health
curl http://auth-service:3001/health

# Rate limiting specific health
curl http://auth-service:3001/health/rate-limit

# Prometheus metrics
curl http://auth-service:3001/metrics

# Human-readable metrics
curl http://auth-service:3001/metrics?format=json
```

## 📱 Contact & Escalation

### Escalation Path

1. **Level 1**: DevOps Engineer (First response)
2. **Level 2**: Senior DevOps + Security Team  
3. **Level 3**: Engineering Manager + CISO

### Emergency Contacts

- **DevOps Slack**: `#devops-alerts`
- **Security Slack**: `#security-incidents`  
- **On-call**: PagerDuty integration

### Documentation Updates

When making configuration changes:
1. Update this runbook
2. Update environment variable documentation
3. Update monitoring dashboards
4. Communicate changes to relevant teams

---

**Last Updated**: 2025-01-14  
**Version**: 1.0  
**Reviewer**: FANZ DevOps Team