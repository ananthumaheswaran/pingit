import express from "express";
import {
  sendMessage,
  getConversation,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/upload.js";
import { validate } from "../middlewares/validate.js";
