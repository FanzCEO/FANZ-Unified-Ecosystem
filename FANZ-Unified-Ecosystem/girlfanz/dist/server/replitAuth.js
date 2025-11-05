// @ts-nocheck - Replit auth integration with runtime-only types
import { Router } from "express";
import * as oauth from "openid-client";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import session from "express-session";
import { db } from "./db";
import memoizee from "memoizee";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
const PgSession = connectPgSimple(session);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const getClient = memoizee(async () => {
    const issuer = new URL(process.env.REPLIT_DEPLOYMENT === "1"
        ? "https://replit.com"
        : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    const config = await oauth.discovery(issuer, process.env.REPLIT_DEPLOYMENT === "1"
        ? process.env.REPL_ID
        : "local-testing", undefined, undefined, { execute: [oauth.allowInsecureRequests] });
    return config;
}, { promise: true, maxAge: 60000 });
passport.use("replit", new CustomStrategy(async (req, done) => {
    try {
        const client = await getClient();
        const currentUrl = new URL(req.url, `https://${req.get("host")}`);
        const tokens = await oauth.authorizationCodeGrant(client, currentUrl, {
            expectedState: req.session.state,
            pkceCodeVerifier: req.session.codeVerifier,
        });
        const claims = oauth.getValidatedIdTokenClaims(tokens);
        const user = await db.user.upsert({
            where: { id: claims.sub },
            update: {},
            create: {
                id: claims.sub,
                email: claims.email,
                firstName: claims.given_name || null,
                lastName: claims.family_name || null,
                profileImageUrl: claims.profile_image || null,
                password: "", // Replit auth doesn't use passwords
            },
        });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});
const router = Router();
router.use(session({
    store: new PgSession({ pool }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
}));
router.use(passport.initialize());
router.use(passport.session());
router.get("/login", async (req, res) => {
    const client = await getClient();
    const state = oauth.generateRandomState();
    const codeVerifier = oauth.generateRandomCodeVerifier();
    req.session.state = state;
    req.session.codeVerifier = codeVerifier;
    const authUrl = oauth.buildAuthorizationUrl(client, {
        state,
        code_challenge: await oauth.calculatePKCECodeChallenge(codeVerifier),
        code_challenge_method: "S256",
    });
    res.redirect(authUrl.href);
});
router.get("/callback", passport.authenticate("replit"), (req, res) => {
    res.redirect("/");
});
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.redirect("/");
    });
});
router.get("/user", (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    }
    else {
        res.status(401).json({ error: "Not authenticated" });
    }
});
export const authMiddleware = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "Authentication required" });
};
export default router;
