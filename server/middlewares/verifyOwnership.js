import { AppError } from "../utils/AppError.js";

/**
 * @middleware verifyOwnership
 * @desc Verifies that the authenticated user owns the resource
 *       loaded by loadResource().
 *
 * Requirements:
 *   - protect middleware must run first
 *   - loadResource middleware must run first
 *
 * Supported ownership fields:
 *   - User    -> _id
 *   - Post    -> author
 *   - Comment -> author
 *
 * @access Protected
 */
export const verifyOwnership = () => {
  return (req, res, next) => {
    const resource = req.resource;

    if (!resource) {
      return next(
        new AppError(
          "Resource not loaded. Ensure loadResource middleware runs first.",
          500,
        ),
      );
    }

    const currentUserId = req.user._id.toString();

    //User document ownership
    if (resource._id?.toString() === currentUserId) {
      return next();
    }

    // Post / comment ownership
    if (resource.author?.toString() === currentUserId) {
      return next();
    }

    return next(
      new AppError("You are not authorized to perform this action", 403),
    );
  };
};
