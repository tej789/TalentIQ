import express from "express";
import http from "http";
import path from "path";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";
import { initializeSocket } from "./lib/socket.js";
import { initializeYjsServer } from "./lib/yjsServer.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";
import judgeRoutes from "./judge/judgeRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import preferencesRoutes from "./routes/preferencesRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();
const server = http.createServer(app);

const __dirname = path.resolve();

// middleware
app.use(express.json());
// credentials:true meaning?? => server allows a browser to include cookies on request
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use("/api/webhooks", webhookRoutes); // Webhook routes (before JSON parsing for raw body)
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/judge", judgeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/activity", activityRoutes);
app.get("/", (req, res) => {
  res.send("API is running...");
});
app.get("/test", (req, res) => {
  res.json({ message: "Backend working perfectly" });
});
app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// make our app ready for deployment
// if (ENV.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("/{*any}", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

// Catch unhandled errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

const startServer = async () => {
  try {
    await connectDB();

    // Initialize Socket.IO
    initializeSocket(server);
    console.log("🔌 Socket.IO initialized");

    // Initialize Yjs WebSocket server for collaborative editing
    initializeYjsServer(server);
    console.log("📝 Yjs collaboration server initialized");

    server.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
