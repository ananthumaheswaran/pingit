import "dotenv/config";
import express from "express";
// import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import errorHandler from "./middlewares/errorhandler.js";
import { AppError } from "./utils/AppError.js";
import http from "http";
import { Server } from "socket.io";
import { initSockets } from "./sockets/initSockets.js";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

// dotenv.config();

const app = express();

// Connect to DB
connectDB();

// Express global middleware
app.use(express.json()); // Parse JSON bodies
app.use(globalLimiter); // Apply global rate limiting

// Health check route
app.get("/", (req, res) => {
  res.send("Pingit server is running...");
});

// REST routes
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);
app.use("/api/messages", messageRoutes);

// Handle unknown routes
app.use((req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
});

// Global error handler
app.use(errorHandler);

// HTTP + Socket.IO server
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

// Initialize socket logic
initSockets(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
