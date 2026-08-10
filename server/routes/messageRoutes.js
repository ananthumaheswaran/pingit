import express from "express";

import {
  sendMessage,
  markAsRead,
  getConversation,
} from "../controllers/messageController.js";

import {
  sendMessageSchema,
  markAsReadSchema,
  getConversationSchema,
} from "../validations/messageValidation.js";

import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { messageImageUpload } from "../middlewares/uploadPresets.js";
import { messageLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * @route   POST /api/messages
 * @desc    Send a new message
 * @access  Private
 * @middleware
 *
 * - protect: verifies JWT token and attaches user to req
 * - messageImageUpload: uploads an optional message image
 * - validate(sendMessageSchema): validates the request body
 */
router.post(
  "/",
  protect,
  messageLimiter,
  messageImageUpload,
  validate(sendMessageSchema),
  sendMessage,
);

/**
 * @route   PATCH /api/messages/:messageId/read
 * @desc    Mark a message as read
 * @access  Private
 * @middleware
 *
 * - protect: verifies JWT token and attaches user to req
 *  - validate(markAsReadSchema): validates messageId parameter
 */
router.patch(
  "/:messageId/read",
  protect,
  validate(markAsReadSchema),
  markAsRead,
);

/**
 * @route   GET /api/messages/:recipientId
 * @desc    Get paginated conversation with another user
 * @access  Private
 * @middleware
 *
 * - protect: verifies JWT token and attaches user to req
 * - validate(getConversationSchema): validates recipientId, page and limit
 */
router.get(
  "/:recipientId",
  protect,
  validate(getConversationSchema),
  getConversation,
);

export default router;
