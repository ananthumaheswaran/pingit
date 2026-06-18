import { AppError } from "../utils/AppError.js";
import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";

// Map each resource type to its Mongoose model and owner field
const resourceMap = {
  user: { model: User, ownerField: "_id" },
  post: { model: Post, ownerField: "author" },
  comment: { model: Comment, ownerField: "author" },
};

/**
 * Middleware to verify ownership of a resource before allowing update/delete actions.
 *
 * @param {string} resourceType - One of: 'user', 'post', or 'comment'
 * @param {string} idParam - Name of the URL parameter that holds the resource ID (default is 'id')
 *
 * @returns {Function} Express middleware
 */

export const verifyOwnership = (resourceType, idParam = "id") => {
  const resourceConfig = resourceMap[resourceType];

  if (!resourceConfig) {
    throw new Error(
      `Invalid resource type '${resourceType}' passed to verifyOwnership middleware.`
    );
  }

  const { model, ownerField } = resourceConfig;

  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const loggedInUserId = req.user.id;

      if (!resourceId) {
        return next(new AppError("Resource ID parameter is missing", 400));
      }

      // Fetch the resource from DB (user, post, or comment)
      const resource = await model.findById(resourceId);

      if (!resource) {
        return next(new AppError(`${resourceType} not found`, 404));
      }

      // Check if the logged-in user is the owner
      const ownerId = resource[ownerField].toString();
      if (ownerId !== loggedInUserId) {
        return next(
          new AppError("Access denied: You do not own this resource", 403)
        );
      }

      // Ownership confirmed – proceed to the next middleware or controller
      next();
    } catch (err) {
      next(err);
    }
  };
};
