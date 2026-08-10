import { getUploadMiddleware } from "./upload.js";

// Preset for profile picture uploads
export const profilePicUpload = getUploadMiddleware({
  folder: "pingit/profile_pics",
  transformation: [
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
  transformation: [
    { width: 800, crop: "limit" },
    { quality: "auto:eco" },
    { fetch_format: "auto" },
  ],
  mode: "multiple",
  fieldName: "images",
  maxCount: 5,
});

// Preset for message image uploads
export const messageImageUpload = getUploadMiddleware({
  folder: "pingit/message_images",
  transformation: [
    { width: 1200, crop: "limit" },
    { quality: "auto:eco" },
    { fetch_format: "auto" },
  ],
  mode: "single",
  fieldName: "image",
});
