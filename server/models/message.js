import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      validate: {
        validator: function (value) {
          return !value || value.trim().length > 0;
        },
        message: "Message cannot be empty.",
      },
    },
    image: {
      type: String, // URL or file path if using multer
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes for faster queries
messageSchema.index({ createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, deliveredAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
