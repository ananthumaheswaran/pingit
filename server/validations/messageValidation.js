import Joi from "joi";
import { contentSchema } from "./commonValidation.js";

/**
 * Validation schema for sending a message
 * ---------------------------------------
 * Either `text` or `image` must be provided.
 * Handles both plain text and image messages.
 */

export const sendMessageSchema = Joi.object({
  body: Joi.object({
    recipientId: Joi.string().length(24).required().messages({
      "string.length": "Invalid recipient ID format",
      "any.required": "Recipient ID is required",
    }),
    text: Joi.string().max(500).allow("", null),
    image: Joi.string().allow("", null),
  }),
});
