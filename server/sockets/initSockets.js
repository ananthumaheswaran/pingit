import { chatSocket } from "./chatSocket";
import { socketAuth } from "../middlewares/socketAuth";

export const initSockets = (io) => {
  io.use(socketAuth); // Authentication middleware
  chatSocket(io); // Register events
};
