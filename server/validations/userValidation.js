import Joi from "joi";
import {
  username,
  email,
  password,
  name,
  bio,
  emailOrUsername,
  searchQuery,
  objectId,
  cloudinaryImage,
} from "./commonValidation.js";

//Registration validation schema
export const registerSchema = {
  body: Joi.object({
    username: username.required(),
    email: email.required(),
    password: password.required(),
    name: name.required(),
  }),
};
// Login validation schema
export const loginSchema = {
  body: Joi.object({
    emailOrUsername: emailOrUsername.required(),
    password: password.required(),
  }),
};

// Change password shema
export const changePasswordSchema = {
  body: Joi.object({
    currentPassword: password.required().label("Current Password"),
    newPassword: password.required().label("New Password"),
    confirmNewPassword: Joi.string()
      .required()
      .valid(Joi.ref("newPassword"))
      .messages({
        "any.only": "Confirm password must match new password",
        "string.empty": "Confirm password is required",
      }),
  }),
};

// Change email schema
export const changeEmailSchema = {
  body: Joi.object({
    currentPassword: password.required().label("Current Password"),
    newEmail: email.required().label("New Email"),
  }),
};

// Confirm password schema for account deletion
export const confirmPasswordSchema = {
  body: Joi.object({
    currentPassword: password.required().label("Current Password"),
  }),
};

// Update user profile schema
export const updateUserProfileSchema = {
  body: Joi.object({
    username: username.optional(),
    name: name.optional(),
    bio: bio.optional(),
    image: cloudinaryImage.optional(),
  }),
};

// Search user schema
export const searchUsersSchema = {
  query: Joi.object({
    search: searchQuery.required(),
  }),
};

export const userIdSchema = {
  params: Joi.object({
    userId: objectId.required(),
  }),
};

// Follow list schema
export const getFollowListSchema = {
  params: Joi.object({
    userId: objectId.required(),
    type: Joi.string().valid("followers", "following").required(),
  }),
};
