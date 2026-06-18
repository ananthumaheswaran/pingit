import mongoose from "mongoose";

export const isValidObjectId = (id) => mongoose.isValidObjectId(id);

// /**
//  * Validates whether a value is a valid MongoDB ObjectId.
//  *
//  * @param {string} id - The ID to validate.
//  * @param {Function} next - Express next() function.
//  * @param {string} [message="Invalid Object ID"] - Custom error message.
//  * @returns {boolean} - Returns true if valid, false if invalid.
//  */
// export const validateObjectId = (id, next, message = "Invalid Object ID") => {
//   if (!mongoose.isValidObjectId(id)) {
//     next(new AppError(message, 400));
//     return false;
//   }
//   return true;
// };
