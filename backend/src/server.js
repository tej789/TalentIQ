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

// ✅ Simple, permissive CORS for debugging
app.use(cors({
  origin: true,
  credentials: true,
}));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ✅ 🔥 PUBLIC ROUTES FIRST (IMPORTANT)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.head("/", (req, res) => {
  res.status(200).end();
});

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working perfectly" });
});

// ❗ AFTER PUBLIC ROUTES
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

// 🔥 FALLBACK RESPONSE (LAST before error handler)
app.use((req, res) => {
  res.status(200).send("Server alive fallback 🚀");
});

// ✅ Global error handler (after all routes)
app.use((err, req, res, next) => {
  console.error("💥 GLOBAL ERROR:", err.stack || err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
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

const PORT = process.env.PORT || ENV.PORT || 5000;

// 🔥 START SERVER FIRST (VERY IMPORTANT)
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server is running on port:", PORT);
});

// 🔥 KEEP-ALIVE TUNING
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// 🔥 FORCE LOGGING HEARTBEAT
setInterval(() => {
  console.log("💓 Server heartbeat alive");
}, 10000);

// THEN async setup
const startServer = async () => {
  try {
    await connectDB();

    // 🔥 Initialize Socket.IO
    try {
      // TEMP: comment out initializeSocket for debugging if needed
      initializeSocket(server);
      console.log("🔌 Socket.IO initialized");
    } catch (e) {
      console.error("❌ Socket error:", e);
    }

  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};


startServer();
