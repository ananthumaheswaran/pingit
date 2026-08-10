import {
  saveMessage,
  markMessageRead,
  markMessageDelivered,
} from "../services/messageService.js";
import {
  sendMessageSchema,
  markAsReadSchema,
  typingSchema,
  userOnlineAckSchema,
} from "../validations/messageValidation.js";
import { messageSocketLimiter } from "../middlewares/socketRateLimiter.js";
import { validateSocketPayload } from "../utils/validateSocketPayload.js";

/**
 * @socket chatSocket
 * @desc Handles all real-time chat features:
 *        - User online/offline tracking
 *        - Sending messages
 *        - Delivery receipts
 *        - Read receipts
 *        - Typing indicators
 *
 * Architecture:
 * - Each authenticated socket joins a room named after the user's ID.
 * - All sockets (tabs/devices) for the same user are grouped together.
 * - `userConnections` tracks how many active sockets each user has.
 *
 * userConnections structure:
 *   key   = userId (string)
 *   value = number of active socket connections
 *
 * Example:
 *   "user123" -> 3   // laptop + mobile + another browser tab
 *
 * @access Private (Requires valid socket authentication)
 */
export const chatSocket = (io) => {
  /**
   * Tracks active socket count for each user.
   *
   * key   = userId
   * value = number of active socket connections
   */
  const userConnections = new Map();

  io.on("connection", (socket) => {
    // Authenticated user ID from socket auth middleware
    const userId = socket.user._id.toString();

    // ------------------------------------------------------------
    // JOIN USER ROOM (multi-device / multi-tab support)
    // ------------------------------------------------------------
    socket.join(userId);

    // ------------------------------------------------------------
    // REGISTER USER AS ONLINE
    // ------------------------------------------------------------
    const currentConnections = userConnections.get(userId) || 0;
    const isFirstConnection = currentConnections === 0;

    userConnections.set(userId, currentConnections + 1);

    console.log(
      `User connected: ${userId} (${userConnections.get(userId)} connections)`,
    );

    // Notify others only when the user becomes online for the first time
    if (isFirstConnection) {
      socket.broadcast.emit("user_online", { userId });
    }

    // Send the list of the currently online users to the newly connected socket
    socket.emit("online_users", {
      users: Array.from(userConnections.keys()),
    });

    // ------------------------------------------------------------
    // MARK PENDING MESSAGES AS DELIVERED WHEN USER COMES ONLINE
    // @event user_online_ack
    // @desc Marks undelivered messages from the specified sender
    //       as delivered when the user comes online.
    // ------------------------------------------------------------

    socket.on("user_online_ack", async (payload) => {
      const { error, value } = validateSocketPayload(
        userOnlineAckSchema,
        payload,
      );

      if (error) {
        return socket.emit("error_message", error);
      }

      const { fromUserId } = value;
      try {
        await markMessageDelivered({
          recipientId: userId,
          senderId: fromUserId,
        });
      } catch (err) {
        console.error("delivery on connect error:", err);
      }
    });

    // ------------------------------------------------------------
    // SEND MESSAGE
    // @event send_message
    // @desc Saves the message to the database, sends it to all active
    //       recipient devices, marks it as delivered when the recipient
    //       is online, and confirms the saved message to all sender devices.
    // ------------------------------------------------------------

    socket.on("send_message", async (payload) => {
      const result = messageSocketLimiter(userId);

      if (!result.allowed) {
        return socket.emit("error_message", result.message);
      }

      const { error, value } = validateSocketPayload(
        sendMessageSchema.body,
        payload,
      );

      if (error) {
        return socket.emit("error_message", error);
      }

      const { recipientId, text, image } = value;
      try {
        // Persist message in database
        const message = await saveMessage({
          senderId: userId,
          recipientId,
          text,
          image,
        });

        // Deliver only if recipient has at least one active connection
        if (userConnections.has(recipientId)) {
          // Send to all recipient devices/tabs
          io.to(recipientId).emit("new_message", message);

          // Mark all undelivered messages from this sender as delivered
          await markMessageDelivered({
            recipientId,
            senderId: userId,
          });
        }

        // Notify all sender devices/tabs that message was saved
        io.to(userId).emit("message_sent", message);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error_message", "Failed to send message");
      }
    });

    // ------------------------------------------------------------
    // MARK MESSAGE AS READ
    // @event mark_read
    // @desc Updates read timestamp and notifies all sender devices
    // ------------------------------------------------------------
    socket.on("mark_read", async (payload) => {
      const { error, value } = validateSocketPayload(
        markAsReadSchema.params,
        payload,
      );

      if (error) {
        return socket.emit("error_message", error);
      }

      const { messageId } = value;
      try {
        const updatedMessage = await markMessageRead({
          messageId,
          readerId: userId,
        });

        const senderId = updatedMessage.sender._id.toString();

        // Notify all sender devices/tabs that the message was read

        io.to(senderId).emit("message_read", {
          messageId,
          readerId: userId,
          readAt: updatedMessage.readAt,
        });
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });

    // ------------------------------------------------------------
    // TYPING INDICATORS
    // @event typing
    // @event stop_typing
    // @desc Notifies recipient when user is typing or stops typing.
    // ------------------------------------------------------------
    socket.on("typing", (payload) => {
      const { error, value } = validateSocketPayload(typingSchema, payload);
      if (error) {
        return socket.emit("error_message", error);
      }
      // Notify all recipient devices/tabs
      io.to(value.recipientId).emit("typing", { from: userId });
    });

    socket.on("stop_typing", (payload) => {
      const { error, value } = validateSocketPayload(typingSchema, payload);
      if (error) {
        return socket.emit("error_message", error);
      }
      // Notify all recipient devices/tabs
      io.to(value.recipientId).emit("stop_typing", { from: userId });
    });

    // ------------------------------------------------------------
    // DISCONNECT HANDLER
    // @event disconnect
    // @desc Decrements connection count and only marks user offline
    //       when their last active socket disconnects.
    // ------------------------------------------------------------
    socket.on("disconnect", () => {
      const currentConnections = userConnections.get(userId) || 0;

      if (currentConnections <= 1) {
        userConnections.delete(userId);

        console.log(`User disconnected: ${userId} (offline)`);

        // Notify others that user is now offline
        socket.broadcast.emit("user_offline", { userId });
      } else {
        // User still has other active tabs/devices
        userConnections.set(userId, currentConnections - 1);

        console.log(
          `User disconnected: ${userId} (${userConnections.get(userId)} connections remaining)`,
        );
      }
    });
  });
};
