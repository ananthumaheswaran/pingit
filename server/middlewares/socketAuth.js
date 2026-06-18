import User from "../models/user.js";
import { verifyToken } from "../utils/verifyToken.js";

/**
 * Socket.IO middleware to authenticate connections.
 */

export const socketAuth = async (socket, next) => {
  try {
    // Token can come from handshake.auth or headers
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const { valid, decoded, reason } = verifyToken(token);
    if (!valid) {
      return next(new Error(`Authentication error: ${reason}`));
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user; // Attach user (like req.user in Express)
    next();
  } catch (err) {
    console.error("Socket authentication failed:", err);
    next(new Error("Authentication error"));
  }
};
