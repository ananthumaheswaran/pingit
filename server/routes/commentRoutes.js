import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { loadResource } from "../middlewares/loadResource.js";
import { verifyOwnership } from "../middlewares/verifyOwnership.js";
import { validate } from "../middlewares/validate.js";

import {
  createComment,
  getCommentsByPost,
  editComment,
  deleteComment,
  toggleLikeComment,
} from "../controllers/commentController.js";

import {
  createCommentSchema,
  getCommentsByPostSchema,
  editCommentSchema,
  commentIdSchema,
} from "../validations/commentValidation.js";
// import { valid } from "joi";

const router = express.Router();

// Create comment or reply
router.post(
  "/post/:postId",
  protect,
  validate(createCommentSchema),
  loadResource("post", "postId"),
  createComment,
);

// Get comments for a post
router.get(
  "/post/:postId",
  protect,
  validate(getCommentsByPost),
  loadResource("post", "postId"),
  getCommentsByPost,
);

// Edit comment
router.patch(
  "/:commentId",
  protect,
  validate(editCommentSchema),
  loadResource("comment", "commentId"),
  verifyOwnership(),
  editComment,
);

// Delete comment
router.delete(
  "/:commentId",
  protect,
  validate(commentIdSchema),
  loadResource("comment", "commentId"),
  verifyOwnership(),
  deleteComment,
);

// Like / Unlike comment
router.patch(
  "/:commentId/like",
  protect,
  validate(commentIdSchema),
  loadResource("comment", "commentId"),
  toggleLikeComment,
);

export default router;
