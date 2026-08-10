import Joi from "joi";
import { content, objectId, cloudinaryImage } from "./commonValidation.js";

export const createPostSchema = {
  body: Joi.object({
    content: content.optional().allow(""),
    images: Joi.array().items(cloudinaryImage).optional(), // optional, must be valid URLs
  }),
};

export const updatePostSchema = {
  params: Joi.object({
    postId: objectId.required(),
  }),

  body: Joi.object({
    content: content.optional().allow(""),
    images: Joi.array().items(cloudinaryImage).optional(), // optional URLs, can replace existing images

    removedImageIds: Joi.array().items(objectId).optional(),
  }).min(1), // Require at least one field to update
};

export const postIdSchema = {
  params: Joi.object({ postId: objectId.required() }),
};

export const getPostsByUserSchema = {
  params: Joi.object({
    userId: objectId.required(),
  }),
};
