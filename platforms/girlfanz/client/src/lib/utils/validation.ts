import { z } from "zod";

export function validateEmail(email: string): boolean {
  const emailSchema = z.string().email();
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  const passwordSchema = z.string().min(8).max(100);
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function validateUsername(username: string): boolean {
  const usernameSchema = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/);
  try {
    usernameSchema.parse(username);
    return true;
  } catch {
    return false;
  }
}

export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
export const usernameSchema = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens");
