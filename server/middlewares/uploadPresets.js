import { getUploadMiddleware } from "./upload.js";

// Preset for profile picture uploads
export const profilePicUpload = getUploadMiddleware({
  folder: "pingit/profile_pics",
  transformations: [
    { width: 300, height: 300, crop: "fill", gravity: "face" },
    { quality: "auto:eco" },
    { fetch_format: "auto" },
  ],
  mode: "single",
  fieldName: "image",
});

// Preset for post image uploads
export const postImageUpload = getUploadMiddleware({
  folder: "pingit/post_images",
  transformations: [
    { width: 800, crop: "limit" },
    { quality: "auto:eco" },
    { fetch_format: "auto" },
  ],
  mode: "multiple",
  fieldName: "images",
  maxCount: 5,
});
