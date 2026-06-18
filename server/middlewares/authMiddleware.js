import User from "../models/user.js";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/verifyToken.js";

/**
 * @middleware protect
 * @desc Middleware to protect private routes by verifying JWT token.
 *        Adds the authenticated user to req.user if valid.
 * @access Protected (Requires Authorization header with Bearer token)
 */
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check if Authorization header exists and is properly formatted
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Please log in to continue", 401));
  }

  // 2. Extract token from Authorization header ("Bearer <token>")
  const token = authHeader.split(" ")[1];

  // 3. Verify token
  const { valid, decoded, reason } = verifyToken(token);

  if (!valid) {
    if (reason === "expired") {
      return next(new AppError("Session expired. Please log in again", 401));
    }
    if (reason === "invalid") {
      return next(new AppError("Invalid token. Please log in again", 401));
    }

    return next(new AppError("Authentication failed", 401));
  }

  // 4. Attach user info to request (excluding password)
  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  req.user = user;

  next();
};
