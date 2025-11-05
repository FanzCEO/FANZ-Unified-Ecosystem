"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usernameSchema = exports.passwordSchema = exports.emailSchema = void 0;
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
exports.validateUsername = validateUsername;
const zod_1 = require("zod");
function validateEmail(email) {
    const emailSchema = zod_1.z.string().email();
    try {
        emailSchema.parse(email);
        return true;
    }
    catch (_a) {
        return false;
    }
}
function validatePassword(password) {
    const passwordSchema = zod_1.z.string().min(8).max(100);
    try {
        passwordSchema.parse(password);
        return true;
    }
    catch (_a) {
        return false;
    }
}
function validateUsername(username) {
    const usernameSchema = zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/);
    try {
        usernameSchema.parse(username);
        return true;
    }
    catch (_a) {
        return false;
    }
}
exports.emailSchema = zod_1.z.string().email("Invalid email address");
exports.passwordSchema = zod_1.z.string().min(8, "Password must be at least 8 characters");
exports.usernameSchema = zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");
