import crypto from "crypto";
import forge from "node-forge";

/**
 * Military-Grade Cryptographic Utilities
 * Implements hash chains, certificate verification, and tamper detection
 */

// Hash chain implementation for audit logging
export class AuditHashChain {
  private static lastHash: string = crypto.createHash("sha256").update("genesis").digest("hex");
  
  /**
   * Generate next hash in the chain with tamper detection
   */
  static generateNextHash(auditData: any): { hash: string; previousHash: string } {
    const previousHash = this.lastHash;
    const dataString = JSON.stringify({
      ...auditData,
      previousHash,
      timestamp: new Date().toISOString(),
      nonce: crypto.randomBytes(16).toString("hex")
    });
    
    const hash = crypto.createHash("sha256").update(dataString).digest("hex");
    this.lastHash = hash;
    
    return { hash, previousHash };
  }
  
  /**
   * Verify hash chain integrity
   */
  static verifyChain(entries: Array<{ hash: string; previousHash: string; data: any }>): boolean {
    if (entries.length === 0) return true;
    
    // Start with genesis hash
    let expectedPreviousHash = crypto.createHash("sha256").update("genesis").digest("hex");
    
    for (const entry of entries) {
      if (entry.previousHash !== expectedPreviousHash) {
        console.error(`Hash chain integrity violation: expected ${expectedPreviousHash}, got ${entry.previousHash}`);
        return false;
      }
      expectedPreviousHash = entry.hash;
    }
    
    return true;
  }
  
  /**
   * Initialize chain from database
   */
  static async initializeFromDatabase(getLastHash: () => Promise<string | null>) {
    const lastHash = await getLastHash();
    if (lastHash) {
      this.lastHash = lastHash;
    }
  }
}

// Certificate verification utilities
export class CertificateManager {
  
  /**
   * Verify X.509 certificate chain and extract public key
   */
  static verifyCertificate(certificatePem: string, trustedCAPem?: string): { 
    valid: boolean; 
    publicKey?: string; 
    fingerprint?: string; 
    subject?: string;
    error?: string;
  } {
    try {
      const cert = forge.pki.certificateFromPem(certificatePem);
      
      // Extract certificate details
      const publicKey = forge.pki.publicKeyToPem(cert.publicKey);
      const fingerprint = forge.md.sha256.create()
        .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
        .digest()
        .toHex();
      
      const subject = cert.subject.attributes.map((attr: any) => `${attr.shortName}=${attr.value}`).join(", ");
      
      // Basic certificate validation
      const now = new Date();
      if (cert.validity.notBefore > now) {
        return { valid: false, error: "Certificate not yet valid" };
      }
      if (cert.validity.notAfter < now) {
        return { valid: false, error: "Certificate expired" };
      }
      
      // If trusted CA provided, verify against it
      if (trustedCAPem) {
        try {
          const caCert = forge.pki.certificateFromPem(trustedCAPem);
          const verified = caCert.verify(cert);
          if (!verified) {
            return { valid: false, error: "Certificate not signed by trusted CA" };
          }
        } catch (error) {
          return { valid: false, error: `CA verification failed: ${error}` };
        }
      }
      
      return {
        valid: true,
        publicKey,
        fingerprint,
        subject
      };
    } catch (error) {
      return { 
        valid: false, 
        error: `Certificate parsing failed: ${error instanceof Error ? error.message : "Unknown error"}` 
      };
    }
  }
  
  /**
   * Generate cryptographic challenge for cluster authentication
   */
  static generateChallenge(): { challenge: string; timestamp: number } {
    const challenge = crypto.randomBytes(32).toString("hex");
    const timestamp = Date.now();
    return { challenge, timestamp };
  }
  
  /**
   * Verify signed challenge response
   */
  static verifySignedChallenge(
    challenge: string, 
    signature: string, 
    publicKeyPem: string, 
    timestamp: number,
    timeoutMs: number = 300000 // 5 minutes
  ): boolean {
    try {
      // Check if challenge is still valid (not expired)
      if (Date.now() - timestamp > timeoutMs) {
        console.error("Challenge expired");
        return false;
      }
      
      const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
      const md = forge.md.sha256.create();
      md.update(challenge, "utf8");
      
      return publicKey.verify(md.digest().bytes(), forge.util.decode64(signature));
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }
  
  /**
   * Generate HMAC for data integrity
   */
  static generateHMAC(data: string, secret: string): string {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }
  
  /**
   * Verify HMAC for data integrity
   */
  static verifyHMAC(data: string, secret: string, expectedHMAC: string): boolean {
    const actualHMAC = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(actualHMAC), Buffer.from(expectedHMAC));
  }
}

// Secure random token generation
export class TokenManager {
  
  /**
   * Generate cryptographically secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }
  
  /**
   * Generate API key with specific format
   */
  static generateAPIKey(prefix: string = "fz"): string {
    const randomPart = crypto.randomBytes(24).toString("hex");
    return `${prefix}_${randomPart}`;
  }
  
  /**
   * Hash sensitive data (passwords, API keys, etc.)
   */
  static hashSensitiveData(data: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, "sha512").toString("hex");
    return { hash, salt: actualSalt };
  }
  
  /**
   * Verify hashed sensitive data
   */
  static verifySensitiveData(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hashSensitiveData(data, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }
}

// Security event detection utilities
export class SecurityMonitor {
  
  /**
   * Detect potential security threats in requests
   */
  static analyzeRequest(req: any): { 
    threatLevel: "low" | "medium" | "high" | "critical"; 
    threats: string[];
  } {
    const threats: string[] = [];
    let threatLevel: "low" | "medium" | "high" | "critical" = "low";
    
    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec)\b)/i,
      /((\%27)|(\')|(\')|(\%2D)|(-)|(\%23)|(#))/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\')|(\%3B)|(;))/i
    ];
    
    const requestString = JSON.stringify(req.body || {}) + (req.query ? JSON.stringify(req.query) : "");
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(requestString)) {
        threats.push("SQL injection attempt detected");
        threatLevel = "high";
        break;
      }
    }
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(requestString)) {
        threats.push("XSS attempt detected");
        if (threatLevel === "low") threatLevel = "medium";
        break;
      }
    }
    
    // Check for excessive request size
    const bodySize = JSON.stringify(req.body || {}).length;
    if (bodySize > 1000000) { // 1MB
      threats.push("Unusually large request body");
      if (threatLevel === "low") threatLevel = "medium";
    }
    
    // Check for suspicious headers
    const suspiciousHeaders = ["x-forwarded-for", "x-real-ip", "x-originating-ip"];
    for (const header of suspiciousHeaders) {
      if (req.headers[header] && req.headers[header] !== req.ip) {
        threats.push("Potential IP spoofing detected");
        if (threatLevel === "low") threatLevel = "medium";
        break;
      }
    }
    
    return { threatLevel, threats };
  }
  
  /**
   * Generate security event based on threat analysis
   */
  static generateSecurityEvent(req: any, threatAnalysis: ReturnType<typeof SecurityMonitor.analyzeRequest>) {
    if (threatAnalysis.threats.length === 0) return null;
    
    return {
      eventType: "security_threat",
      severity: threatAnalysis.threatLevel,
      source: "request_analyzer",
      title: `Security threat detected: ${threatAnalysis.threats[0]}`,
      description: `Multiple threats detected: ${threatAnalysis.threats.join(", ")}`,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent") || "",
      userId: req.session?.userId || null,
      metadata: {
        allThreats: threatAnalysis.threats,
        threatLevel: threatAnalysis.threatLevel,
        requestPath: req.path,
        requestMethod: req.method,
        timestamp: new Date().toISOString()
      }
    };
  }
}