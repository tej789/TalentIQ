import { Server } from "socket.io";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { ENV } from "./env.js";

let io;

/**
 * Active session rooms store:
 * Map<sessionId, {
 *   code: string,
 *   language: string,
 *   cursors: Map<socketId, { userId, userName, position, color }>,
 *   connectedUsers: Map<socketId, { userId, userName, userImage }>
 * }>
 */
const sessionRooms = new Map();

// Cursor colors for participants
const CURSOR_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
];

function getRandomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

// Apply Monaco-style content changes (with rangeOffset/rangeLength/text)
// to a plain string. Changes are applied in the order received.
function applyTextChanges(baseText, changes) {
  if (!Array.isArray(changes) || !changes.length) return baseText;

  let text = baseText ?? "";
  for (const change of changes) {
    const { rangeOffset, rangeLength, text: insertText } = change || {};
    if (typeof rangeOffset !== "number" || typeof rangeLength !== "number") {
      continue;
    }
    const before = text.slice(0, rangeOffset);
    const after = text.slice(rangeOffset + rangeLength);
    text = before + (insertText ?? "") + after;
  }

  return text;
}

function getSessionRoom(sessionId) {
  if (!sessionRooms.has(sessionId)) {
    sessionRooms.set(sessionId, {
      code: "",
      language: "javascript",
      languageCode: {},  // { javascript: "...", python: "...", java: "..." }
      cursors: new Map(),
      connectedUsers: new Map(),
    });
  }
  return sessionRooms.get(sessionId);
}

export function initializeSocket(httpServer) {
  const allowedOrigins = [
    ENV.CLIENT_URL,
    "http://localhost:5173",
    "https://localhost:5173",
  ].filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── SESSION:JOIN ───────────────────────────────────
    socket.on("session:join", async (data) => {
      try {
        const { sessionId, userId, userName, userImage } = data;
        if (!sessionId || !userId) return;

        // ── Active-session guard ──────────────────────────────
        // Prevent a user from connecting to a session they don't
        // belong to while already in a different active session.
        // userId here is a clerkId — resolve to MongoDB _id first.
        try {
          const userDoc = await User.findOne({ clerkId: userId });
          if (userDoc) {
            const existing = await Session.findOne({
              status: "active",
              _id: { $ne: sessionId },
              $or: [
                { host: userDoc._id },
                { "participants.user": userDoc._id },
              ],
            }).lean();

            if (existing) {
              socket.emit("session:join_rejected", {
                message: "You are already in another active session.",
                existingSessionId: existing._id,
              });
              return; // do NOT join the room
            }
          }
        } catch (guardErr) {
          console.error("session:join guard error (non-fatal):", guardErr);
          // If the guard query fails, allow the join to proceed so the
          // user isn't locked out due to a transient DB hiccup.
        }

        socket.join(sessionId);
        const room = getSessionRoom(sessionId);

        // ── Track user in connectedUsers ──
        room.connectedUsers.set(socket.id, {
          userId,
          userName,
          userImage,
          color: getRandomColor(),
        });

        // Send initial state back to the joining user
        socket.emit("session:state", {
          code: room.code,
          language: room.language,
          languageCode: room.languageCode,
          users: Object.fromEntries(room.connectedUsers),
          cursors: Object.fromEntries(room.cursors),
        });

        // Notify others
        socket.to(sessionId).emit("session:user_joined", {
          socketId: socket.id,
          userId,
          userName,
          userImage,
          users: Object.fromEntries(room.connectedUsers),
        });

        // Log in edit history
        await Session.findByIdAndUpdate(sessionId, {
          $push: {
            editHistory: {
              userId,
              userName,
              action: "join",
              timestamp: new Date(),
            },
          },
        });

        console.log(`👤 ${userName} joined session ${sessionId}`);
      } catch (err) {
        console.error("session:join error:", err);
      }
    });

    // ─── SESSION:CODE_DELTA (legacy, no-op) ─────────────────
    // Kept only to avoid crashes if an older frontend still emits it.
    socket.on("session:code_delta", (data) => {
      try {
        const { sessionId } = data || {};
        if (!sessionId) return;
        // No further action; new clients use session:code_update.
      } catch (err) {
        console.error("session:code_delta error:", err);
      }
    });

    // ─── SESSION:CODE_UPDATE ──────────────────────────────
    // Simple, robust full-text sync: the sender posts the full code
    // string, we store it in the room and broadcast to all peers.
    socket.on("session:code_update", (data) => {
      try {
        const { sessionId, code, userId, userName } = data || {};
        if (!sessionId || typeof code !== "string") return;

        const room = getSessionRoom(sessionId);
        room.code = code;

        socket.to(sessionId).emit("session:code_update", {
          sessionId,
          code,
          userId,
          userName,
          senderSocketId: socket.id,
        });
      } catch (err) {
        console.error("session:code_update error:", err);
      }
    });

    // ─── SESSION:CURSOR_UPDATE ──────────────────────────
    socket.on("session:cursor_update", (data) => {
      try {
        const { sessionId, userId, userName, position, selection } = data;
        if (!sessionId) return;

        const room = getSessionRoom(sessionId);
        const userInfo = room.connectedUsers.get(socket.id);
        const color = userInfo?.color || getRandomColor();

        room.cursors.set(socket.id, {
          userId,
          userName,
          position,
          selection,
          color,
        });

        socket.to(sessionId).emit("session:cursor_update", {
          socketId: socket.id,
          userId,
          userName,
          position,
          selection,
          color,
        });
      } catch (err) {
        console.error("session:cursor_update error:", err);
      }
    });

    // ─── SESSION:LANGUAGE_CHANGE ────────────────────────
    socket.on("session:language_change", async (data) => {
      try {
        const { sessionId, language, userId, userName, previousLanguage, previousCode } = data;
        if (!sessionId) return;

        const room = getSessionRoom(sessionId);

        // Save the code for the previous language before switching
        if (previousLanguage && previousCode !== undefined) {
          room.languageCode[previousLanguage] = previousCode;
        } else {
          // Fallback: save current in-memory room code under old language
          const oldLang = room.language;
          const currentCode = room.code;
          if (oldLang && currentCode) {
            room.languageCode[oldLang] = currentCode;
          }
        }

        room.language = language;

        // Persist the languageCode map to DB
        try {
          const updateObj = {
            currentLanguage: language,
          };
          // Save per-language code
          for (const [lang, code] of Object.entries(room.languageCode)) {
            updateObj[`languageCode.${lang}`] = code;
          }
          await Session.findByIdAndUpdate(sessionId, updateObj);
        } catch (dbErr) {
          console.error("Error saving languageCode on language change:", dbErr);
        }

        // Broadcast to other clients, include saved code for new language if available
        socket.to(sessionId).emit("session:language_change", {
          language,
          userId,
          userName,
          savedCode: room.languageCode[language] || null,
        });
      } catch (err) {
        console.error("session:language_change error:", err);
      }
    });

    // ─── SESSION:GRANT_EDIT ─────────────────────────────
    socket.on("session:grant_edit", async (data) => {
      try {
        const { sessionId, targetUserId, hostUserId } = data;
        if (!sessionId || !targetUserId) return;

        // Verify host (hostUserId is a clerkId, session.host is a MongoDB ObjectId)
        const hostUser = await User.findOne({ clerkId: hostUserId });
        const session = await Session.findById(sessionId);
        if (!session || !hostUser || session.host.toString() !== hostUser._id.toString()) return;

        // Look up target user to get their clerkId for the broadcast
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return;

        // Update DB
        await Session.updateOne(
          { _id: sessionId, "participants.user": targetUserId },
          { $set: { "participants.$.canEdit": true } }
        );

        // Notify the target user and all others (use clerkId so frontend can match)
        io.to(sessionId).emit("session:permission_update", {
          targetUserId: targetUser.clerkId,
          canEdit: true,
          grantedBy: hostUserId,
        });

        await Session.findByIdAndUpdate(sessionId, {
          $push: {
            editHistory: {
              userId: hostUserId,
              action: "permission_grant",
              timestamp: new Date(),
              codeDelta: `Granted edit to ${targetUserId}`,
            },
          },
        });
      } catch (err) {
        console.error("session:grant_edit error:", err);
      }
    });

    // ─── SESSION:REVOKE_EDIT ────────────────────────────
    socket.on("session:revoke_edit", async (data) => {
      try {
        const { sessionId, targetUserId, hostUserId } = data;
        if (!sessionId || !targetUserId) return;

        const hostUser = await User.findOne({ clerkId: hostUserId });
        const session = await Session.findById(sessionId);
        if (!session || !hostUser || session.host.toString() !== hostUser._id.toString()) return;

        // Look up target user to get their clerkId for the broadcast
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return;

        await Session.updateOne(
          { _id: sessionId, "participants.user": targetUserId },
          { $set: { "participants.$.canEdit": false } }
        );

        io.to(sessionId).emit("session:permission_update", {
          targetUserId: targetUser.clerkId,
          canEdit: false,
          revokedBy: hostUserId,
        });

        await Session.findByIdAndUpdate(sessionId, {
          $push: {
            editHistory: {
              userId: hostUserId,
              action: "permission_revoke",
              timestamp: new Date(),
              codeDelta: `Revoked edit from ${targetUserId}`,
            },
          },
        });
      } catch (err) {
        console.error("session:revoke_edit error:", err);
      }
    });

    // ─── SESSION:GRANT_SCREEN_SHARE ─────────────────────
    socket.on("session:grant_screen_share", async (data) => {
      try {
        const { sessionId, targetUserId, hostUserId } = data;
        if (!sessionId || !targetUserId) return;

        const hostUser = await User.findOne({ clerkId: hostUserId });
        const session = await Session.findById(sessionId);
        if (!session || !hostUser || session.host.toString() !== hostUser._id.toString()) return;

        // Look up target user to get their clerkId
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return;

        await Session.updateOne(
          { _id: sessionId, "participants.user": targetUserId },
          { $set: { "participants.$.canScreenShare": true } }
        );

        io.to(sessionId).emit("session:screen_share_permission", {
          targetUserId: targetUser.clerkId,
          canScreenShare: true,
        });
      } catch (err) {
        console.error("session:grant_screen_share error:", err);
      }
    });

    // ─── SESSION:SCREEN_SHARE_START ─────────────────────
    socket.on("session:screen_share_start", async (data) => {
      try {
        const { sessionId, userId, userName } = data;
        if (!sessionId) return;

        await Session.findByIdAndUpdate(sessionId, { screenShareUser: userId });

        io.to(sessionId).emit("session:screen_share_start", {
          userId,
          userName,
        });
      } catch (err) {
        console.error("session:screen_share_start error:", err);
      }
    });

    // ─── SESSION:SCREEN_SHARE_STOP ──────────────────────
    socket.on("session:screen_share_stop", async (data) => {
      try {
        const { sessionId, userId } = data;
        if (!sessionId) return;

        await Session.findByIdAndUpdate(sessionId, { screenShareUser: null });

        io.to(sessionId).emit("session:screen_share_stop", { userId });
      } catch (err) {
        console.error("session:screen_share_stop error:", err);
      }
    });

    // ─── SESSION:KICK ───────────────────────────────────
    socket.on("session:kick", async (data) => {
      try {
        const { sessionId, targetUserId, hostUserId } = data;
        if (!sessionId || !targetUserId) return;

        const hostUser = await User.findOne({ clerkId: hostUserId });
        const session = await Session.findById(sessionId);
        if (!session || !hostUser || session.host.toString() !== hostUser._id.toString()) return;

        // Remove from participants
        await Session.findByIdAndUpdate(sessionId, {
          $pull: { participants: { user: targetUserId } },
        });

        // Find the socket for the target user and make them leave
        // targetUserId is MongoDB ObjectId, connectedUsers stores clerkId as userId
        const targetUser = await User.findById(targetUserId);
        const room = getSessionRoom(sessionId);
        for (const [sockId, userInfo] of room.connectedUsers.entries()) {
          if (userInfo.userId === targetUser?.clerkId) {
            io.to(sockId).emit("session:kicked", { message: "You have been removed from this session" });
            const targetSocket = io.sockets.sockets.get(sockId);
            if (targetSocket) {
              targetSocket.leave(sessionId);
            }
            room.connectedUsers.delete(sockId);
            room.cursors.delete(sockId);
          }
        }

        io.to(sessionId).emit("session:user_left", {
          userId: targetUserId,
          kicked: true,
          users: Object.fromEntries(room.connectedUsers),
        });
      } catch (err) {
        console.error("session:kick error:", err);
      }
    });

    // ─── SESSION:LEAVE ────────────────────────────────────
    socket.on("session:leave", async (data) => {
      try {
        const { sessionId, userId } = data;
        if (!sessionId || !userId) return;

        // Find the user by clerkId
        const leavingUser = await User.findOne({ clerkId: userId });
        if (!leavingUser) return;

        // Remove from participants in DB
        await Session.findByIdAndUpdate(sessionId, {
          $pull: { participants: { user: leavingUser._id } },
          $push: {
            editHistory: {
              userId,
              userName: leavingUser.name,
              action: "leave",
              timestamp: new Date(),
            },
          },
        });

        // Clean up socket from room
        const room = getSessionRoom(sessionId);
        room.connectedUsers.delete(socket.id);
        room.cursors.delete(socket.id);

        // Leave the socket room
        socket.leave(sessionId);

        // Notify others
        socket.to(sessionId).emit("session:user_left", {
          userId,
          userName: leavingUser.name,
          socketId: socket.id,
          users: Object.fromEntries(room.connectedUsers),
        });

        // Clean up empty rooms
        if (room.connectedUsers.size === 0) {
          sessionRooms.delete(sessionId);
        }

        console.log(`👋 ${leavingUser.name} left session ${sessionId}`);
      } catch (err) {
        console.error("session:leave error:", err);
      }
    });

    // ─── SESSION:SAVE_CODE ──────────────────────────────
    socket.on("session:save_code", async (data) => {
      try {
        const { sessionId } = data;
        if (!sessionId) return;

        const room = getSessionRoom(sessionId);
        const codeToSave = room.code;

        // Also save current code under current language in the map
        if (room.language && codeToSave) {
          room.languageCode[room.language] = codeToSave;
        }

        const updateObj = {
          currentCode: codeToSave,
          currentLanguage: room.language,
        };
        // Persist per-language code
        for (const [lang, code] of Object.entries(room.languageCode)) {
          updateObj[`languageCode.${lang}`] = code;
        }

        await Session.findByIdAndUpdate(sessionId, updateObj);
      } catch (err) {
        console.error("session:save_code error:", err);
      }
    });

    // ─── SESSION:END ────────────────────────────────────
    socket.on("session:end", async (data) => {
      try {
        const { sessionId, hostUserId } = data;
        if (!sessionId) return;

        const hostUser = await User.findOne({ clerkId: hostUserId });
        const session = await Session.findById(sessionId);
        if (!session || !hostUser || session.host.toString() !== hostUser._id.toString()) return;

        const room = getSessionRoom(sessionId);

        const finalCodeText = room.code;

        // Save current code under current language
        if (room.language && finalCodeText) {
          room.languageCode[room.language] = finalCodeText;
        }

        // Build update object with per-language code
        const updateObj = {
          finalCode: finalCodeText,
          currentCode: finalCodeText,
          currentLanguage: room.language,
        };
        // Save per-language code to both languageCode and finalLanguageCode
        for (const [lang, code] of Object.entries(room.languageCode)) {
          updateObj[`languageCode.${lang}`] = code;
          updateObj[`finalLanguageCode.${lang}`] = code;
        }

        await Session.findByIdAndUpdate(sessionId, updateObj);

        // Notify everyone
        io.to(sessionId).emit("session:ended", {
          message: "Session has been ended by the host",
        });

        // Clean up room
        sessionRooms.delete(sessionId);
      } catch (err) {
        console.error("session:end error:", err);
      }
    });

    // ─── DISCONNECT ─────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);

      // Find which session this socket was in and clean up
      for (const [sessionId, room] of sessionRooms.entries()) {
        if (room.connectedUsers.has(socket.id)) {
          const userInfo = room.connectedUsers.get(socket.id);
          room.connectedUsers.delete(socket.id);
          room.cursors.delete(socket.id);

          // Save code periodically on disconnect
          try {
            const codeToSave = room.code;

            // Save current code under current language in the map
            if (room.language && codeToSave) {
              room.languageCode[room.language] = codeToSave;
            }

            const updateObj = {
              currentCode: codeToSave,
              currentLanguage: room.language,
              $push: {
                editHistory: {
                  userId: userInfo.userId,
                  userName: userInfo.userName,
                  action: "leave",
                  timestamp: new Date(),
                },
              },
            };
            // Persist per-language code
            for (const [lang, code] of Object.entries(room.languageCode)) {
              updateObj[`languageCode.${lang}`] = code;
            }

            await Session.findByIdAndUpdate(sessionId, updateObj);
          } catch (err) {
            console.error("Error saving on disconnect:", err);
          }

          socket.to(sessionId).emit("session:user_left", {
            userId: userInfo.userId,
            userName: userInfo.userName,
            socketId: socket.id,
            users: Object.fromEntries(room.connectedUsers),
          });

          // ── Remove non-host participant from DB on disconnect ──
          // If this user has no other sockets in the room, they fully
          // disconnected (closed tab / lost connection). Remove them
          // from the DB participants array so they're free to join/create.
          const userStillHere = [...room.connectedUsers.values()].some(
            (u) => u.userId === userInfo.userId
          );
          if (!userStillHere) {
            try {
              const userDoc = await User.findOne({ clerkId: userInfo.userId });
              if (userDoc) {
                const dbSession = await Session.findById(sessionId).select("host participant");
                if (dbSession && dbSession.host.toString() !== userDoc._id.toString()) {
                  // Non-host: remove from participants
                  await Session.findByIdAndUpdate(sessionId, {
                    $pull: { participants: { user: userDoc._id } },
                  });
                  if (dbSession.participant?.toString() === userDoc._id.toString()) {
                    await Session.findByIdAndUpdate(sessionId, { participant: null });
                  }
                  console.log(`📤 Removed disconnected participant ${userInfo.userName} from session ${sessionId}`);
                }
              }
            } catch (cleanupErr) {
              console.error("Error removing participant on disconnect:", cleanupErr);
            }
          }

          // Clean up empty rooms
          if (room.connectedUsers.size === 0) {
            sessionRooms.delete(sessionId);
          }

          break;
        }
      }
    });
  });

  // Periodic code save (every 30 seconds)
  setInterval(async () => {
    for (const [sessionId, room] of sessionRooms.entries()) {
      const codeToSave = room.code;
      if (codeToSave) {
        // Also save under current language
        if (room.language) {
          room.languageCode[room.language] = codeToSave;
        }
        try {
          const updateObj = {
            currentCode: codeToSave,
            currentLanguage: room.language,
          };
          // Persist per-language code
          for (const [lang, code] of Object.entries(room.languageCode)) {
            updateObj[`languageCode.${lang}`] = code;
          }
          await Session.findByIdAndUpdate(sessionId, updateObj);
        } catch (err) {
          // Silently fail on periodic saves
        }
      }
    }
  }, 30000);

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

/**
 * Check if a user (by clerkId) has any active socket connections
 * to a specific session room.
 */
export function isUserConnectedToSession(sessionId, clerkId) {
  const room = sessionRooms.get(sessionId);
  if (!room) return false;
  return [...room.connectedUsers.values()].some((u) => u.userId === clerkId);
}
