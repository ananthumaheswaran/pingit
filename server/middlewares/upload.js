import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/**
 * Creates a reusable Multer upload middleware configured for Cloudinary.
 * Supports both single and multiple image uploads with configurable
 * folders, transformations, field names, and maximum file counts.
 * @param {Object} options
 * @param {string} options.folder - Cloudinary folder for uploaded images.
 * @param {Array} options.transformation - Cloudinary image transformations.
 * @param {"single"|"multiple"} options.mode - Upload mode.
 * @param {string} options.fieldName - Request field containing the image(s).
 * @param {number} options.maxCount - Maximum number of files for multiple uploads.
 * @returns {Function} Express middleware.
 */

export const getUploadMiddleware = ({
  folder,
  transformation = [],
  mode = "single",
  fieldName = "image",
  maxCount = 5,
}) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: transformation,
    },
  });

  const upload = multer({ storage });

  return (req, res, next) => {
    const handler =
      mode === "single"
        ? upload.single(fieldName)
        : upload.array(fieldName, maxCount);

    handler(req, res, (err) => {
      if (err) return next(err);

      req.body = req.body || {};

      // Normalize single upload into a consistent object containing
      // both the Cloudinary URL and public ID for future file management.
      if (mode === "single" && req.file) {
        req.body[fieldName] = {
          url: req.file.path,
          publicId: req.file.filename,
        };
      }
      // Normalize multiple uploads into an array of URL/public ID objects.
      else if (mode === "multiple" && req.files?.length) {
        req.body[fieldName] = req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }));
      }
      next();
    });
  };
};
