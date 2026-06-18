import { createLimiter } from "../utils/createLimiter";
import { RATE_LIMITS } from "../config/rateLimitConfig";

/**
 * Rate limiters for various application routes.
 *
 * These instances are created using the reusable `createLimiter` factory,
 * ensuring consistent configuration and DRY implementation throughout the app.
 *
 * Notes:
 * - Login, register, and global limiters explicitly use IP-based identification
 *   to ensure proper rate limiting even for unauthenticated users.
 * - Message and media upload limiters rely on the default keyGenerator inside
 *   `createLimiter`, which prefers `req.user.id` (for authenticated actions)
 *   and falls back to IP when no user session exists.
 */

// Limit login attempts to slow down brute-force attacks.
export const loginLimiter = createLimiter({
  ...RATE_LIMITS.LOGIN,
  keyGenerator: (req) => req.ip,
});

// Rate-limit user registration to prevent mass account creation.
export const registerLimiter = createLimiter({
  ...RATE_LIMITS.REGISTER,
  keyGenerator: (req) => req.ip,
});

// Global API limiter to prevent excessive requests from a single IP.
export const globalLimiter = createLimiter({
  ...RATE_LIMITS.GLOBAL,
  keyGenerator: (req) => req.ip,
});

// Messaging limiter & Media upload limiter — uses authenticated user ID when available.
export const messageLimiter = createLimiter(RATE_LIMITS.MESSAGE);
export const mediaMessageLimiter = createLimiter(RATE_LIMITS.MEDIA_MESSAGE);
