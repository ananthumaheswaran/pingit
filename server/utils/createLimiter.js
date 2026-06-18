import rateLimit from "express-rate-limit";

/**
 * Factory function to create a reusable rate limiter.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds during which requests are counted.
 * @param {number} options.max - Maximum number of allowed requests per window.
 * @param {string} options.message - Custom message returned when the rate limit is exceeded.
 * @param {Function} [options.keyGenerator] - Optional function to uniquely identify a client.
 *                                           Defaults to using authenticated user ID, falling
 *                                           back to IP address when unavailable.
 *
 * @returns {Function} Configured Express rate-limit middleware.
 *
 * Notes:
 * - `standardHeaders: true` enables modern `RateLimit-*` response headers.
 * - `legacyHeaders: false` disables deprecated `X-RateLimit-*` headers.
 * - This wrapper promotes DRY usage across your login, register, media, and messaging limiters.
 */
export const createLimiter = ({ windowMs, max, message, keyGenerator }) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => req.user?.id || req.ip),
  });
