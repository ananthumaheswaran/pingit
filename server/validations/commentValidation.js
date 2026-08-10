import Joi from "joi";
import { content, objectId } from "./commonValidation.js";

export const createCommentSchema = {
  params: Joi.object({
    postId: objectId.required(),
  }),

  body: Joi.object({
    text: content.required(),
    parentComment: objectId.optional().allow(null),
  }),
};

export const getCommentsByPostSchema = {
  params: Joi.object({
    postId: objectId.required(),
  }),
};

export const editCommentSchema = {
  params: Joi.object({
    commentId: objectId.required(),
  }),

  body: Joi.object({
    text: content.required(),
  }),
};

export const commentIdSchema = {
  params: Joi.object({
    commentId: objectId.required(),
  }),
};
