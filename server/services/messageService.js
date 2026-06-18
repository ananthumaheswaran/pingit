import Message from "../models/message.js";
import User from "../models/user.js";
import { AppError } from "../utils/AppError.js";

export const saveMessage = async ({ senderId, recipientId, text, image }) => {
  // Double-check recipient exists (DB-level safeguard)
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    throw new AppError("Recipient not found", 404);
  }

  const message = new Message({
    sender: senderId,
    recipient: recipientId,
    ...(text && { text }),
    ...(image && { image }),
  });

  await message.save();

  return message.populate("sender recipient", "username _id");
};

export const markMessageRead = async ({ messageId, readerId }) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new AppError("Message not found", 404);
  }
  // Authorization check
  if (!message.recipient.equals(readerId)) {
    throw new AppError("Not authorized to mark this message as read", 403);
  }

  let shouldSave = false;

  // ensure delivered before read
  if (!message.deliveredAt) {
    message.deliveredAt = new Date();
    shouldSave = true;
  }

  if (!message.isRead) {
    message.isRead = true;
    message.readAt = new Date();
    shouldSave = true;
  }

  if (shouldSave) {
    await message.save();
  }

  return message.populate("sender recipient", "username _id");
};

export const markMessageDelivered = async ({ recipientId, senderId }) => {
  return Message.updateMany(
    { sender: senderId, recipient: recipientId, deliveredAt: null },
    {
      $set: { deliveredAt: new Date() },
    }
  );
};

export const getConversation = async (userA, userB, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const query = {
    $or: [
      { sender: userA, recipient: userB },
      { sender: userB, recipient: userA },
    ],
  };

  const totalMessages = await Message.countDocuments(query);

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("sender recipient", "username _id");

  const hasMore = skip + messages.length < totalMessages;

  return { messages: messages.reverse(), hasMore };
};
