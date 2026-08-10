/**
 * Creates a reusable Socket.IO rate limiter.
 *
 * Limits events per authenticated user within a time window.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds.
 * @param {number} options.max - Maximum allowed events per window.
 * @param {string} options.message - Error message when the limit is exceeded.
 *
 * @returns {(userId: string) => { allowed: boolean, message?: string }}
 */
export const createSocketLimiter = ({ windowMs, max, message }) => {
  // key = userId
  // value = timestamps of recent requests
  const requests = new Map();

  return (userId) => {
    const now = Date.now();

    // Keep only requests inside the current time window
    const recentRequests = (requests.get(userId) || []).filter(
      (timestamp) => now - timestamp < windowMs,
    );

    // Rate limit exceeded
    if (recentRequests.length >= max) {
      return {
        allowed: false,
        message,
      };
    }

    // Record current request
    recentRequests.push(now);
    requests.set(userId, recentRequests);

    return {
      allowed: true,
    };
  };
};
