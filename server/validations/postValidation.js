import Joi from "joi";
import { contentSchema } from "./commonValidation";

export const createPostSchema = Joi.object({
  content: contentSchema.required(),
  images: Joi.array().items(Joi.string().uri()).optional(), // optional, must be valid URLs
});

export const updatePostSchema = Joi.object({
  content: contentSchema.optional(),
  images: Joi.array().items(Joi.string().uri()).optional(), // optional URLs, can replace existing images
});
