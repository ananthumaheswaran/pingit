import Joi from "joi";

export const username = Joi.string()
  .trim()
  .min(3)
  .max(25)
  .pattern(/^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9._]+$/)
  .messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username must be at most 25 characters",
    "string.pattern.base":
      "Username can only contain letters, numbers, underscores, and periods. It cannot end with a period or contain consecutive periods.",
  });

export const email = Joi.string()
  .trim()
  .email({ tlds: { allow: false } })
  .messages({
    "string.empty": "Email is required",
    "string.email": "Please enter a valid email address",
  });

export const password = Joi.string()
  .trim()
  .pattern(
    new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,64}$"
    )
  )
  .messages({
    "string.empty": "Password is required",
    "string.pattern.base":
      "Password must be 8-64 characters long, include at least one lowercase letter, one uppercase letter, one number, and one special character.",
  });

export const name = Joi.string()
  .trim()
  .pattern(/^[a-zA-Z\s'-]{2,30}$/)
  .messages({
    "string.pattern.base":
      "Name can only contain letters, spaces, hyphens, and apostrophes, and must be between 2 and 30 characters long",
  });

export const bio = Joi.string()
  .trim()
  .max(120)
  .allow("", null)
  // Unicode emoji support + common punctuation + letters/numbers/spaces
  .pattern(/^[\p{L}\p{N}\p{P}\p{Zs}\p{So}]{0,120}$/u)
  .messages({
    "string.max": "Bio must be at most 120 characters",
    "string.pattern.base": "Bio contains invalid characters",
  });

export const contentSchema = Joi.string()
  .trim()
  .min(1)
  .max(500)
  .pattern(/^(?!.*<[^>]*>)[\s\S]*$/, "no HTML tags") // prevent HTML
  .messages({
    "string.empty": "Post content is required",
    "string.min": "Post content must contain at least 1 character",
    "string.max": "Post content must be less than or equal to 500 characters",
    "string.pattern.name": "Post content must not contain HTML tags",
  });

export const objectId = Joi.string().length(24).hex().messages({
  "string.length": "Invalid ID format",
  "string.hex": "ID must be a valid hex string",
});
