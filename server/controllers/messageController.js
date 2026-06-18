import * as messageService from "../services/messageService.js";
import { sendResponse } from "../utils/responseHelper.js";

/**
 * @desc   Send a new message
 * @route  POST /api/messages
 * @access Private
 */
export const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { recipientId, text } = req.body;
    const image = req.file?.path;

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
      readerId: req.user.id,
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
    const userA = req.user.id; // current user
    const { userB } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    const { messages, hasMore } = await messageService.getConversation(
      userA,
      userB,
      pageNum,
      limitNum,
    );

    sendResponse(res, 200, "Conversation fetched successfully.", {
      messages,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};
