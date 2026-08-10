import * as messageService from "../services/messageService.js";
import { sendResponse } from "../utils/responseHelper.js";

/**
 * @desc   Send a new message
 * @route  POST /api/messages
 * @access Private
 */
export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { recipientId, text, image } = req.body;

    // Call service
    const message = await messageService.saveMessage({
      senderId,
      recipientId,
      text,
      image,
    });

    sendResponse(res, 201, "Message sent successfully.", { message });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   Mark a message as read
 * @route  PATCH /api/messages/:messageId/read
 * @access Private
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await messageService.markMessageRead({
      messageId,
      readerId: req.user._id,
    });

    sendResponse(res, 200, "Message marked as read.", { message });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   Get conversation between two users (paginated)
 * @route  GET /api/messages/:recipientId?page=1&limit=20
 * @access Private
 */
export const getConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user._id; // current user
    const { recipientId } = req.params;
    const { page, limit } = req.query;

    const { messages, hasMore } = await messageService.getConversation(
      currentUserId,
      recipientId,
      page,
      limit,
    );

    sendResponse(res, 200, "Conversation fetched successfully.", {
      messages,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};
