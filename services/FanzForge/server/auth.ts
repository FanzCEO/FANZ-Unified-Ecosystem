import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { RegisterUser, LoginUser } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const session = req.session as any;
  
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  req.user = session.user;
  next();
};

export async function loginUser(email: string, password: string): Promise<{ user: any; error?: string }> {
  const user = await storage.verifyPassword(email, password);
  
  if (!user) {
    return { user: null, error: "Invalid email or password" };
  }
  
  // Remove password from returned user object
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
}

export async function registerUser(userData: RegisterUser): Promise<{ user: any; error?: string }> {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return { user: null, error: "User already exists with this email" };
    }
    
    const user = await storage.createUser(userData);
    
    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  } catch (error) {
    console.error("Registration error:", error);
    return { user: null, error: "Registration failed" };
  }
}