import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

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

      if (mode === "single" && req.file) {
        req.body[fieldName] = req.file.path;
      } else if (mode === "multiple" && req.files?.length) {
        req.body[fieldName] = req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
        }));
      }
      next();
    });
  };
};
