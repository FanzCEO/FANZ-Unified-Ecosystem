package proxy

import (
    "bytes"
    "fmt"
    "io"
    "log"
    "net/http"
    "net/http/httputil"
    "net/url"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/fanzos/shared/config"
)

type ServiceProxy struct {
    services map[string]*httputil.ReverseProxy
    config   *config.Config
}

func NewServiceProxy(cfg *config.Config) *ServiceProxy {
    proxy := &ServiceProxy{
        services: make(map[string]*httputil.ReverseProxy),
        config:   cfg,
    }

    // Initialize service proxies
    proxy.initializeServices()
    
    return proxy
}

func (sp *ServiceProxy) initializeServices() {
    services := map[string]string{
        "user":          "http://localhost:8001",
        "content":       "http://localhost:8002",
        "payment":       "http://localhost:8003",
        "fanzfluence":   "http://localhost:8004",
        "fanzversity":   "http://localhost:8005",
        "fanzmetaverse": "http://localhost:8006",
        "gamification":  "http://localhost:8007",
        "merchandise":   "http://localhost:8008",
        "streaming":     "http://localhost:8009",
        "messaging":     "http://localhost:8010",
        "admin":         "http://localhost:8011",
        "ai":            "http://localhost:8012",
        "explore":       "http://localhost:8013",
    }

    for name, baseURL := range services {
        target, err := url.Parse(baseURL)
        if err != nil {
            log.Printf("Failed to parse URL for service %s: %v", name, err)
            continue
        }

        proxy := &httputil.ReverseProxy{
            Director: func(req *http.Request) {
                req.URL.Scheme = target.Scheme
                req.URL.Host = target.Host
                req.Header.Add("X-Forwarded-Host", req.Host)
                req.Header.Add("X-Origin-Host", target.Host)
            },
            ModifyResponse: sp.modifyResponse,
            ErrorHandler:   sp.errorHandler,
            Transport: &http.Transport{
                MaxIdleConns:        100,
                MaxIdleConnsPerHost: 10,
                IdleConnTimeout:     30 * time.Second,
                DisableCompression:  false,
            },
        }

        sp.services[name] = proxy
    }
}

func (sp *ServiceProxy) modifyResponse(resp *http.Response) error {
    // Add security headers
    resp.Header.Set("X-Content-Type-Options", "nosniff")
    resp.Header.Set("X-Frame-Options", "DENY")
    resp.Header.Set("X-XSS-Protection", "1; mode=block")
    
    return nil
}

func (sp *ServiceProxy) errorHandler(w http.ResponseWriter, r *http.Request, err error) {
    log.Printf("Proxy error for %s: %v", r.URL.Path, err)
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusBadGateway)
    
    response := fmt.Sprintf(`{
        "error": "Service temporarily unavailable",
        "code": "SERVICE_UNAVAILABLE",
        "message": "The requested service is currently unavailable. Please try again later.",
        "timestamp": "%s"
    }`, time.Now().UTC().Format(time.RFC3339))
    
    w.Write([]byte(response))
}

func (sp *ServiceProxy) ProxyToUserService(c *gin.Context) {
    sp.proxyToService("user", c)
}

func (sp *ServiceProxy) ProxyToContentService(c *gin.Context) {
    sp.proxyToService("content", c)
}

func (sp *ServiceProxy) ProxyToPaymentService(c *gin.Context) {
    sp.proxyToService("payment", c)
}

func (sp *ServiceProxy) ProxyToStreamingService(c *gin.Context) {
    sp.proxyToService("streaming", c)
}

func (sp *ServiceProxy) ProxyToMessagingService(c *gin.Context) {
    sp.proxyToService("messaging", c)
}

func (sp *ServiceProxy) ProxyToAdminService(c *gin.Context) {
    sp.proxyToService("admin", c)
}

func (sp *ServiceProxy) ProxyToAIService(c *gin.Context) {
    sp.proxyToService("ai", c)
}

func (sp *ServiceProxy) ProxyToFanzFluenceService(c *gin.Context) {
    sp.proxyToService("fanzfluence", c)
}

func (sp *ServiceProxy) ProxyToFanzVersityService(c *gin.Context) {
    sp.proxyToService("fanzversity", c)
}

func (sp *ServiceProxy) ProxyToFanzMetaVerseService(c *gin.Context) {
    sp.proxyToService("fanzmetaverse", c)
}

func (sp *ServiceProxy) ProxyToGamificationService(c *gin.Context) {
    sp.proxyToService("gamification", c)
}

func (sp *ServiceProxy) ProxyToMerchandiseService(c *gin.Context) {
    sp.proxyToService("merchandise", c)
}

func (sp *ServiceProxy) ProxyToExploreService(c *gin.Context) {
    sp.proxyToService("explore", c)
}

func (sp *ServiceProxy) proxyToService(serviceName string, c *gin.Context) {
    proxy, exists := sp.services[serviceName]
    if !exists {
        c.JSON(http.StatusServiceUnavailable, gin.H{
            "error": fmt.Sprintf("Service %s is not available", serviceName),
            "code":  "SERVICE_NOT_AVAILABLE",
        })
        return
    }

    // Preserve request body for logging/metrics
    var bodyBytes []byte
    if c.Request.Body != nil {
        bodyBytes, _ = io.ReadAll(c.Request.Body)
        c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
    }

    // Add service routing headers
    c.Request.Header.Set("X-Service", serviceName)
    c.Request.Header.Set("X-Gateway-Request-ID", c.GetString("request_id"))
    
    // Forward user context if available
    if userID, exists := c.Get("user_id"); exists {
        c.Request.Header.Set("X-User-ID", userID.(string))
    }
    
    if userRole, exists := c.Get("user_role"); exists {
        c.Request.Header.Set("X-User-Role", fmt.Sprintf("%v", userRole))
    }

    // Strip API version prefix from path
    originalPath := c.Request.URL.Path
    if strings.HasPrefix(originalPath, "/api/v1/") {
        c.Request.URL.Path = strings.TrimPrefix(originalPath, "/api/v1")
    }

    // Log the proxied request
    log.Printf("Proxying %s %s to %s service", c.Request.Method, originalPath, serviceName)

    // Serve the proxy
    proxy.ServeHTTP(c.Writer, c.Request)
}

// Health check for all services
func (sp *ServiceProxy) CheckServicesHealth() map[string]bool {
    health := make(map[string]bool)
    
    for serviceName := range sp.services {
        health[serviceName] = sp.checkServiceHealth(serviceName)
    }
    
    return health
}

func (sp *ServiceProxy) checkServiceHealth(serviceName string) bool {
    services := map[string]string{
        "user":      "http://localhost:8001/health",
        "content":   "http://localhost:8002/health",
        "payment":   "http://localhost:8003/health",
        "streaming": "http://localhost:8004/health",
        "messaging": "http://localhost:8005/health",
        "admin":     "http://localhost:8006/health",
        "ai":        "http://localhost:8007/health",
    }
    
    healthURL, exists := services[serviceName]
    if !exists {
        return false
    }
    
    client := &http.Client{Timeout: 5 * time.Second}
    resp, err := client.Get(healthURL)
    if err != nil {
        return false
    }
    defer resp.Body.Close()
    
    return resp.StatusCode == http.StatusOK
}

// Circuit breaker for service failures
type CircuitBreaker struct {
    failures    int
    maxFailures int
    timeout     time.Duration
    lastFailure time.Time
    state       string // "closed", "open", "half-open"
}

func NewCircuitBreaker(maxFailures int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures: maxFailures,
        timeout:     timeout,
        state:       "closed",
    }
}

func (cb *CircuitBreaker) Call(fn func() error) error {
    if cb.state == "open" {
        if time.Since(cb.lastFailure) > cb.timeout {
            cb.state = "half-open"
        } else {
            return fmt.Errorf("circuit breaker is open")
        }
    }
    
    err := fn()
    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()
        
        if cb.failures >= cb.maxFailures {
            cb.state = "open"
        }
        
        return err
    }
    
    // Success - reset circuit breaker
    cb.failures = 0
    cb.state = "closed"
    return nil
}

// Service discovery integration (placeholder for future implementation)
func (sp *ServiceProxy) UpdateServiceEndpoints(endpoints map[string]string) {
    for serviceName, endpoint := range endpoints {
        target, err := url.Parse(endpoint)
        if err != nil {
            log.Printf("Failed to parse updated endpoint for service %s: %v", serviceName, err)
            continue
        }

        if proxy, exists := sp.services[serviceName]; exists {
            // Update the director function
            proxy.Director = func(req *http.Request) {
                req.URL.Scheme = target.Scheme
                req.URL.Host = target.Host
                req.Header.Add("X-Forwarded-Host", req.Host)
                req.Header.Add("X-Origin-Host", target.Host)
            }
            
            log.Printf("Updated endpoint for service %s: %s", serviceName, endpoint)
        }
    }
}

// Load balancing for multiple service instances
type LoadBalancer struct {
    endpoints []string
    current   int
}

func NewLoadBalancer(endpoints []string) *LoadBalancer {
    return &LoadBalancer{
        endpoints: endpoints,
        current:   0,
    }
}

func (lb *LoadBalancer) NextEndpoint() string {
    if len(lb.endpoints) == 0 {
        return ""
    }
    
    endpoint := lb.endpoints[lb.current]
    lb.current = (lb.current + 1) % len(lb.endpoints)
    return endpoint
}

// Retry mechanism for failed requests
func (sp *ServiceProxy) retryRequest(req *http.Request, maxRetries int) (*http.Response, error) {
    client := &http.Client{Timeout: 30 * time.Second}
    
    var lastErr error
    for i := 0; i <= maxRetries; i++ {
        resp, err := client.Do(req)
        if err == nil && resp.StatusCode < 500 {
            return resp, nil
        }
        
        lastErr = err
        if i < maxRetries {
            time.Sleep(time.Duration(i+1) * time.Second)
        }
    }
    
    return nil, lastErr
}

// Request/Response logging and metrics
type RequestMetrics struct {
    ServiceName string
    Method      string
    Path        string
    StatusCode  int
    Duration    time.Duration
    Timestamp   time.Time
}

func (sp *ServiceProxy) logRequestMetrics(metrics RequestMetrics) {
    log.Printf("Service: %s | %s %s | Status: %d | Duration: %v",
        metrics.ServiceName,
        metrics.Method,
        metrics.Path,
        metrics.StatusCode,
        metrics.Duration,
    )
}

// Rate limiting per service
func (sp *ServiceProxy) checkServiceRateLimit(serviceName string, userID string) bool {
    // Implementation would check Redis for rate limiting
    // This is a placeholder for the actual rate limiting logic
    return true
}
