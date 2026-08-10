/**
 * Socket.IO message rate limiter.
 *
 * Uses the centralized MESSAGE_SOCKET configuration to limit
 * how frequently an authenticated user can send messages through
 * the Socket.IO connection.
 */
import { createSocketLimiter } from "../utils/createSocketLimiter.js";
import { RATE_LIMITS } from "../config/rateLimitConfig.js";

// Limit message-sending events to prevent chat spam and abuse.
export const messageSocketLimiter = createSocketLimiter(
  RATE_LIMITS.MESSAGE_SOCKET,
);
