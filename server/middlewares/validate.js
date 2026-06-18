/**
 * Validation middleware
 * -----------------------------
 * Validates `req.body`, `req.query`, and/or `req.params` against
 * provided Joi schemas. Sanitizes input by stripping unknown fields.
 *
 * • Replaces request data with validated values.
 * • Forwards AppError(400) on validation failure.
 *
 * @param   {Object} schema   Joi schemas keyed by request segment.
 * @returns {Function}        Express middleware (req, res, next).
 *
 * @example
 *   const registerSchema = {
 *     body: Joi.object({
 *       username: Joi.string().required(),
 *       password: Joi.string().min(8).required()
 *     })
 *   };
 *
 *   router.post("/register",
 *               validate(registerSchema),
 *               registerUser);
 */
import { AppError } from "../utils/AppError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    // Iterate over supported request segments
    for (const key of ["body", "query", "params"]) {
      if (schema[key]) {
        const { error, value } = schema[key].validate(req[key], {
          abortEarly: false, // collect all errors
          stripUnknown: true, // remove unexpected fields
        });

        if (error) {
          const messages = error.details
            .map((detail) => detail.message)
            .join(", ");
          return next(
            new AppError(`Validation error in ${key}: ${messages}`, 400, true)
          );
        }

        // Replace with validated data
        req[key] = value;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
