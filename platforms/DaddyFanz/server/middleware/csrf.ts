import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../logger";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.SESSION_SECRET || "default-csrf-secret-change-in-production";

interface CSRFOptions {
  tokenHeader?: string;
  tokenBody?: string;
  cookieName?: string;
  secretCookieName?: string;
  ignoreMethods?: string[];
}

class CSRFProtection {
  private options: Required<CSRFOptions>;

  constructor(options: CSRFOptions = {}) {
    this.options = {
      tokenHeader: "x-csrf-token",
      tokenBody: "_token",
      cookieName: "csrf-token",
      secretCookieName: "csrf-secret",
      ignoreMethods: ["GET", "HEAD", "OPTIONS"],
      ...options,
    };
  }

  private generateSecret(): string {
    return crypto.randomBytes(24).toString("hex");
  }

  private createToken(secret: string): string {
    const salt = crypto.randomBytes(8).toString("hex");
    const hash = crypto.createHmac("sha256", CSRF_SECRET)
      .update(salt + secret)
      .digest("hex");
    return salt + ":" + hash;
  }

  private verifyToken(token: string, secret: string): boolean {
    if (!token || !secret) return false;

    const [salt, hash] = token.split(":");
    if (!salt || !hash) return false;

    const expectedHash = crypto.createHmac("sha256", CSRF_SECRET)
      .update(salt + secret)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  }

  private signSecret(secret: string): string {
    const signature = crypto.createHmac("sha256", CSRF_SECRET)
      .update(secret)
      .digest("hex");
    return secret + ":" + signature;
  }

  private verifySignedSecret(signedSecret: string): string | null {
    if (!signedSecret) return null;

    const [secret, signature] = signedSecret.split(":");
    if (!secret || !signature) return null;

    const expectedSignature = crypto.createHmac("sha256", CSRF_SECRET)
      .update(secret)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    return secret;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF check for safe methods
      if (this.options.ignoreMethods.includes(req.method)) {
        // Get or generate secret
        let secret: string | null = null;
        const signedSecret = req.cookies?.[this.options.secretCookieName];
        
        if (signedSecret) {
          secret = this.verifySignedSecret(signedSecret);
        }
        
        if (!secret) {
          secret = this.generateSecret();
          const newSignedSecret = this.signSecret(secret);
          const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: sameSite as "strict" | "lax",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
          };
          res.cookie(this.options.secretCookieName, newSignedSecret, cookieOptions);
          logger.debug(`Set CSRF secret cookie with options: ${JSON.stringify(cookieOptions)}`);
        }

        // Generate and set token cookie
        const token = this.createToken(secret);
        const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
        const tokenCookieOptions = {
          httpOnly: false, // Allow frontend to read
          secure: process.env.NODE_ENV === "production",
          sameSite: sameSite as "strict" | "lax",
        };
        res.cookie(this.options.cookieName, token, tokenCookieOptions);
        logger.debug(`Set CSRF token cookie with options: ${JSON.stringify(tokenCookieOptions)}`);
        
        return next();
      }

      // Get token from header or body
      const token = req.get(this.options.tokenHeader) || req.body?.[this.options.tokenBody];
      
      // Get secret from signed cookie
      const signedSecret = req.cookies?.[this.options.secretCookieName];
      const secret = signedSecret ? this.verifySignedSecret(signedSecret) : null;

      logger.debug(`CSRF validation for ${req.method} ${req.originalUrl}: ` +
        `Token=${!!token}, SignedSecret=${!!signedSecret}, Secret=${!!secret}, ` +
        `Cookies=${JSON.stringify(Object.keys(req.cookies || {}))}`);

      if (!this.verifyToken(token || "", secret || "")) {
        logger.warn(`CSRF token validation failed for ${req.method} ${req.originalUrl} from ${req.ip} - ` +
          `Token: ${!!token}, SignedSecret: ${!!signedSecret}, Secret: ${!!secret}`);

        return res.status(403).json({
          error: "Forbidden",
          message: "Invalid CSRF token",
        });
      }

      next();
    };
  }

  // Method to get current token for frontend
  getToken(req: Request, res: Response): string {
    // Get or generate secret
    let secret: string | null = null;
    const signedSecret = req.cookies?.[this.options.secretCookieName];
    
    if (signedSecret) {
      secret = this.verifySignedSecret(signedSecret);
    }
    
    if (!secret) {
      secret = this.generateSecret();
      const newSignedSecret = this.signSecret(secret);
      const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
      res.cookie(this.options.secretCookieName, newSignedSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: sameSite as "strict" | "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    return this.createToken(secret);
  }
}

export const csrfProtection = new CSRFProtection();

// API endpoint to get CSRF token
export const getCSRFToken = (req: Request, res: Response) => {
  const token = csrfProtection.getToken(req, res);
  res.json({ token });
};
