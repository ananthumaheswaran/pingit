import Joi from "joi";
import { content, cloudinaryImage, objectId } from "./commonValidation.js";

/**
 * Validation schema for sending a message
 * ---------------------------------------
 * Either `text` or `image` must be provided.
 * Handles both plain text and image messages.
 */

export const sendMessageSchema = {
  body: Joi.object({
    recipientId: objectId.required(),

    text: content.optional().allow(""),

    image: cloudinaryImage.optional(),
  })
    .custom((value, helpers) => {
      if (!value.image && !value.text?.trim()) {
        return helpers.error("message.empty");
      }

      return value;
    })
    .messages({
      "message.empty": "Message must contain text or an image",
    }),
};

export const markAsReadSchema = {
  params: Joi.object({
    messageId: objectId.required(),
  }),
};

export const getConversationSchema = {
  params: Joi.object({
    recipientId: objectId.required(),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

export const typingSchema = Joi.object({
  recipientId: objectId.required(),
});

export const userOnlineAckSchema = Joi.object({
  fromUserId: objectId.required(),
});
