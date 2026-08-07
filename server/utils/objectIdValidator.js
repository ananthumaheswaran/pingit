import mongoose from "mongoose";

/**
 * Check whether a value is a valid MongoDB ObjectId.
 *
 * @param {string} id - Value to validate.
 * @returns {boolean}
 */
export const isValidObjectId = (id) => mongoose.isValidObjectId(id);
