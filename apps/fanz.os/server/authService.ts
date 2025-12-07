import { Express, RequestHandler } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { authProviders, verificationCodes, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import { sendEmail, sendSMS } from "./notificationService";

const scryptAsync = promisify(scrypt);

// Hash password using scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "fallback-secret-change-in-production", {
    expiresIn: "7d",
  });
}

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "change-this-secret-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

// Setup authentication middleware
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Local Strategy (Email/Password)
  passport.use(
    "local-email",
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          const isValid = await comparePasswords(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!user.emailVerified) {
            return done(null, false, { message: "Please verify your email address" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Local Strategy (Phone/Password)
  passport.use(
    "local-phone",
    new LocalStrategy(
      {
        usernameField: "phoneNumber",
        passwordField: "password",
      },
      async (phoneNumber, password, done) => {
        try {
          const user = await storage.getUserByPhone(phoneNumber);
          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid phone number or password" });
          }
          
          const isValid = await comparePasswords(password, user.passwordHash);
          if (!isValid) {
            return done(null, false, { message: "Invalid phone number or password" });
          }
          
          if (!user.phoneVerified) {
            return done(null, false, { message: "Please verify your phone number" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            let user = await storage.getUserByAuthProvider("google", profile.id);
            
            if (!user && profile.emails?.[0]) {
              user = await storage.getUserByEmail(profile.emails[0].value);
            }
            
            if (!user) {
              // Create new user
              user = await storage.createUser({
                email: profile.emails?.[0]?.value,
                emailVerified: true,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
                displayName: profile.displayName,
                role: "fanz",
              });
            }
            
            // Link auth provider
            await storage.linkAuthProvider({
              userId: user.id,
              provider: "google",
              providerId: profile.id,
              providerEmail: profile.emails?.[0]?.value,
              accessToken,
              refreshToken,
            });
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ["id", "emails", "name", "picture"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            let user = await storage.getUserByAuthProvider("facebook", profile.id);
            
            if (!user && profile.emails?.[0]) {
              user = await storage.getUserByEmail(profile.emails[0].value);
            }
            
            if (!user) {
              // Create new user
              user = await storage.createUser({
                email: profile.emails?.[0]?.value,
                emailVerified: true,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
                displayName: profile.displayName,
                role: "fanz",
              });
            }
            
            // Link auth provider
            await storage.linkAuthProvider({
              userId: user.id,
              provider: "facebook",
              providerId: profile.id,
              providerEmail: profile.emails?.[0]?.value,
              accessToken,
              refreshToken,
            });
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Twitter OAuth Strategy
  if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_CONSUMER_KEY,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
          callbackURL: "/api/auth/twitter/callback",
          includeEmail: true,
        },
        async (token: string, tokenSecret: string, profile: any, done: any) => {
          try {
            let user = await storage.getUserByAuthProvider("twitter", profile.id);
            
            if (!user && profile.emails?.[0]) {
              user = await storage.getUserByEmail(profile.emails[0].value);
            }
            
            if (!user) {
              // Create new user
              user = await storage.createUser({
                email: profile.emails?.[0]?.value,
                emailVerified: !!profile.emails?.[0],
                username: profile.username,
                displayName: profile.displayName,
                profileImageUrl: profile.photos?.[0]?.value,
                role: "fanz",
              });
            }
            
            // Link auth provider
            await storage.linkAuthProvider({
              userId: user.id,
              provider: "twitter",
              providerId: profile.id,
              providerEmail: profile.emails?.[0]?.value,
              accessToken: token,
              refreshToken: tokenSecret,
            });
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check for JWT token
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-change-in-production") as any;
      req.user = { id: decoded.userId } as any;
      return next();
    } catch (error) {
      // Invalid token
    }
  }
  
  res.status(401).json({ message: "Unauthorized" });
};

// Role-based access control
export const requireRole = (roles: string[]): RequestHandler => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser((req.user as any).id);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};

// Two-factor authentication setup
export async function setupTwoFactor(userId: string): Promise<{ secret: string; qrCode: string }> {
  const secret = speakeasy.generateSecret({
    name: `FansLab (${userId})`,
  });
  
  await storage.updateUser(userId, {
    twoFactorSecret: secret.base32,
  });
  
  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url || "",
  };
}

// Verify two-factor code
export async function verifyTwoFactor(userId: string, token: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user?.twoFactorSecret) return false;
  
  return speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 2,
  });
}

// Send verification code
export async function sendVerificationCode(
  type: "email" | "phone" | "two_factor",
  destination: string,
  userId?: string
): Promise<void> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await db.insert(verificationCodes).values({
    userId,
    email: type === "email" ? destination : undefined,
    phoneNumber: type === "phone" ? destination : undefined,
    code,
    type,
    expiresAt,
  });
  
  if (type === "email") {
    await sendEmail(destination, "Verification Code", `Your verification code is: ${code}`);
  } else if (type === "phone") {
    await sendSMS(destination, `Your FansLab verification code is: ${code}`);
  }
}

// Verify code
export async function verifyCode(
  type: string,
  destination: string,
  code: string
): Promise<boolean> {
  const [verification] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.code, code),
        eq(verificationCodes.type, type),
        type === "email" 
          ? eq(verificationCodes.email, destination)
          : eq(verificationCodes.phoneNumber, destination),
        eq(verificationCodes.isUsed, false)
      )
    )
    .limit(1);
  
  if (!verification || verification.expiresAt < new Date()) {
    return false;
  }
  
  await db
    .update(verificationCodes)
    .set({ isUsed: true })
    .where(eq(verificationCodes.id, verification.id));
  
  return true;
}