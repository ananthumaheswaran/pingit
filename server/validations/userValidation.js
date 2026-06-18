import Joi from "joi";
import { username, email, password, name, bio } from "./commonValidation";

//Registration validation schema

export const registerSchema = Joi.object({
  username: username.required(),
  email: email.required(),
  password: password.required(),
  name: name.required(),
});

// Login validation schema
export const loginSchema = Joi.object({
  emailOrUsername: Joi.string().required().messages({
    "string.empty": "Email or username is required",
  }),
  password: password.required(),
});

// Change password shema
export const changePasswordSchema = Joi.object({
  currentPassword: password.required().label("Current Password"),
  newPassword: password.required().label("New Password"),
  confirmNewPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .messages({
      "any.only": "Confirm password must match new password",
      "string.empty": "Confirm password is required",
    }),
});

// Change email schema
export const changeEmailSchema = Joi.object({
  currentPassword: password.required().label("Current Password"),
  newEmail: email.required().label("New Email"),
});

// Confirm password schema for account deletion
export const confirmPasswordSchema = Joi.object({
  currentPassword: password.required().label("Current Password"),
});

// Update profile schema
export const updateProfileSchema = Joi.object({
  username: username.optional(),
  name: name.optional(),
  bio: bio.optional(),
});
