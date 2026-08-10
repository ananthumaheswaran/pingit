/**
 * Validates a Socket.IO event payload using a Joi schema.
 *
 * @param {Object} schema - Joi schema.
 * @param {Object} payload - Incoming socket payload.
 *
 * @returns {{ error: string|null, value: Object }}
 */
export const validateSocketPayload = (schema, payload) => {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return {
      error: error.details.map((d) => d.message).join(", "),
      value: null,
    };
  }

  return {
    error: null,
    value,
  };
};
