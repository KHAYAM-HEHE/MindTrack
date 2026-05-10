require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 5000;

const notificationService = require("./services/notificationService");

const startServer = async () => {
  await connectDB();
  console.log("Database connected");
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose === "2fa_pending") return next(new Error("Complete two-factor sign-in first"));
      socket.userId = decoded.id;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  app.set("io", io);
  notificationService.attachIo(io);

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    socket.on("join-session", (sessionId) => {
      if (sessionId) socket.join(String(sessionId));
    });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[MindTrack] Port ${PORT} is already in use (EADDRINUSE). Stop the other Node process on this port or set PORT in .env. On Windows: netstat -ano | findstr :${PORT}`
      );
    } else {
      console.error("[MindTrack] HTTP server error:", err.message);
    }
    process.exit(1);
  });

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Server boot failed:", error.message);
  process.exit(1);
});

