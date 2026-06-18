import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Fail early if JWT_SECRET is missing
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

/**
 * Verify a JWT and return details about its validity.
 * @param {string} token - The JWT token to verify.
 * @returns {object} { valid: boolean, decoded?: object, reason?: string }
 */

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], // Enforce algorithm for security
    });

    // Validate ObjectId format
    if (!mongoose.isValidObjectId(decoded.userId)) {
      return { valid: false, reason: "invalid_id" };
    }

    return { valid: true, decoded };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { valid: false, reason: "expired" };
    }

    if (err.name === "JsonWebTokenError") {
      return { valid: false, reason: "invalid" };
    }

    return { valid: false, reason: "unknown" };
  }
};
