import { chatSocket } from "./chatSocket.js";
import { socketAuth } from "../middlewares/socketAuth.js";

/**
 * Initialize Socket.IO middleware and event handlers.
 * Responsibilities:
 * - Register `socketAuth` as the global Socket.IO authentication middleware.
 * - Initialize chat-related socket events and handlers.
 * Authentication runs before a socket connection is accepted,
 * ensuring only authenticated users can access chat events.
 * @param {import("socket.io").Server} io - Socket.IO server instance */

export const initSockets = (io) => {
  // Authenticate every incoming socket connection
  io.use(socketAuth);

  // Register chat socket events and handlers
  chatSocket(io);
};
