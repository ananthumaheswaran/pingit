import User from "../models/user.js";
import Post from "../models/post.js";
import Comment from "../models/comment.js";
import { AppError } from "../utils/AppError.js";

/**
 * @middleware loadResource
 * @desc Loads a resource document from the database using an ID
 *       from route parameters and attaches it to req.resource.
 *
 * Responsibilities:
 *   • Determine the correct Mongoose model from resourceType
 *   • Find the resource by ID
 *   • Return 404 if resource does not exist
 *   • Attach loaded document to req.resource
 *
 * @param {string} resourceType
 *        Supported: "user", "post", "comment"
 *
 * @param {string} paramName
 *        Route parameter containing the resource ID
 *
 * @example
 * router.patch(
 *   "/:postId",
 *   protect,
 *   validate(updatePostSchema),
 *   loadResource("post", "postId"),
 *   verifyOwnership(),
 *   updatePost
 * );
 */

// Map resource types to their models
const resourceMap = {
  user: User,
  post: Post,
  comment: Comment,
};

export const loadResource = (resourceType, paramName) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];

      const Model = resourceMap[resourceType];

      if (!Model) {
        return next(
          new AppError(`Unsupported resource type: ${resourceType}`, 500),
        );
      }

      // Load resource
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return next(
          new AppError(
            `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`,
            404,
          ),
        );
      }

      // Make resource available to downstream middleware/controllers
      req.resource = resource;

      next();
    } catch (err) {
      next(err);
    }
  };
};
