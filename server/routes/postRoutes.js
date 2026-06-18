import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  getPostsByUser,
  updatePost,
  deletePost,
  toggleLikePost,
} from "../controllers/postController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createPostSchema,
  updatePostSchema,
} from "../validations/postValidation";
import { verifyOwnership } from "../middlewares/verifyOwnership.js";
import { postImageUpload } from "../middlewares/uploadPresets.js";

const router = express.Router();
/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 * @middleware
 *    - protect: verifies JWT token and attaches user to req
 *    - validate(createPostSchema): validates post content
 */
router.post(
  "/",
  protect,
  postImageUpload,
  validate(createPostSchema),
  createPost
);

/**
 * @route   GET /api/posts
 * @desc    Get all posts
 * @access  Private
 * @middleware
 *    - protect: verifies JWT token and attaches user to req
 * */
router.get("/", protect, getAllPosts);

/**
 * @route   GET /api/posts/:postId
 * @desc    Get a single post by ID
 * @access  Private
 * @middleware
 *   - protect: verifies JWT token and attaches user to req
 * */
router.get("/:postId", protect, getPostById);

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get all posts by a specific user
 * @access  Private
 * @middleware
 *   - protect: verifies JWT token and attaches user to req
 * */
router.get("/user/:userId", protect, getPostsByUser);

/**
 * @route   PUT /api/posts/:postId
 * @desc    Update a post by ID
 * @access  Private
 * @middleware
 *  - protect: verifies JWT token and attaches user to req
 *  - validate(createPostSchema): validates post content
 * */
router.put(
  "/:postId",
  protect,
  postImageUpload,
  verifyOwnership("post", "postId"),
  validate(updatePostSchema),
  updatePost
);

/**
 * @route   DELETE /api/posts/:postId
 * @desc    Delete a post by ID
 * @access  Private
 * @middleware
 *   - protect: verifies JWT token and attaches user to req
 * */
router.delete(
  "/:postId",
  protect,
  verifyOwnership("post", "postId"),
  deletePost
);

/**
 * @route   POST /api/posts/like/:postId
 * @desc    Toggle like on a post
 * @access  Private
 * @middleware
 *   - protect: verifies JWT token and attaches user to req
 * */
router.put("/like/:postId", protect, toggleLikePost);

export default router;
