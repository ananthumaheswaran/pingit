/**
 * Centralized rate-limit configuration for different application operations.
 *
 * Each entry defines:
 * - `windowMs`: Duration (in ms) during which requests are counted.
 * - `max`: Maximum allowed requests within the time window.
 * - `message`: Human-readable error message returned when the limit is exceeded.
 *
 * These presets help maintain consistent, secure, and DRY rate-limit usage
 * across login, registration, global API access, messaging, and media uploads.
 */
export const RATE_LIMITS = {
  // Limit login attempts to mitigate brute-force attacks.
  LOGIN: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },

  // Prevent automated or abusive account creation.
  REGISTER: {
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: "Too many accounts created. Try again later.",
  },

  // Global fallback rate limiter to control excessive API usage from a single IP.
  GLOBAL: {
    windowMs: 60 * 1000,
    max: 500,
    message: "Too many requests from this IP, please slow down.",
  },

  // Prevents chat spam while allowing normal conversation.
  MESSAGE: {
    windowMs: 10 * 1000,
    max: 10,
    message: "You're sending messages too fast.",
  },

  MESSAGE_SOCKET: {
    windowMs: 10 * 1000,
    max: 10,
    message: "You're sending messages too fast.",
  },
};
