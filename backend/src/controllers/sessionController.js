import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import { getIO } from "../lib/socket.js";

// ---------------------------------------------------------------------------
// Reusable validation: check if a user is already in ANY active session
// (as host OR as a participant), using the DB as the authoritative source.
// Returns { session, role } or null.
//   role = "HOST" | "PARTICIPANT"
// ---------------------------------------------------------------------------
async function checkUserActiveSession(userId) {
  // Single efficient query — uses the indexes on host+status and participants.user.
  // The database is the authoritative source of truth for session membership.
  // Socket-connection state is intentionally NOT used here because sockets are
  // per browser-tab: a user can have the session open in one tab while making
  // an HTTP request from a different tab that hasn't connected its socket yet.
  // Cleaning up based on socket presence would incorrectly evict the user from
  // their real session, allowing them to accidentally join a second one.
  // Explicit leave/disconnect cleanup is handled by the socket event handlers.
  const activeSession = await Session.findOne({
    status: "active",
    $or: [
      { host: userId },
      { "participants.user": userId },
    ],
  }).lean();

  if (!activeSession) return null;

  const role = activeSession.host.toString() === userId.toString() ? "HOST" : "PARTICIPANT";
  return { session: activeSession, role };
}

// ---------------------------------------------------------------
// GET /sessions/check-active
// Returns the user's current active session (if any) so the
// frontend can block create/join attempts before they happen.
// ---------------------------------------------------------------
export async function checkActiveSession(req, res) {
  try {
    const userId = req.user._id;
    const existing = await checkUserActiveSession(userId);
    if (existing) {
      // Populate host name so the frontend can show "You are in [Host]'s session"
      const populated = await Session.findById(existing.session._id)
        .populate("host", "name")
        .lean();
      return res.status(200).json({
        inSession: true,
        sessionId: existing.session._id,
        role: existing.role,
        sessionProblem: existing.session.problem,
        hostName: populated?.host?.name || null,
      });
    }
    return res.status(200).json({ inSession: false });
  } catch (error) {
    console.log("Error in checkActiveSession:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createSession(req, res) {
  try {
    const { problem, difficulty, password, maxParticipants, problemId } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    // Block if user is already in an active session (409 so frontend shows modal)
    const existing = await checkUserActiveSession(userId);
    if (existing) {
      return res.status(409).json({
        alreadyInSession: true,
        sessionId: existing.session._id,
        role: existing.role,
        message:
          existing.role === "HOST"
            ? "You are already hosting an active session. Please end it before creating a new one."
            : "You are already attending an active session. Please leave it before creating a new one.",
      });
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // create session in db with new fields
    // Auto-add host to participants array so they are tracked uniformly
    const session = await Session.create({
      problem,
      problemId: problemId || null,
      difficulty,
      host: userId,
      callId,
      password: password || "",
      maxParticipants: maxParticipants || 5,
      participants: [{ user: userId, canEdit: true, canScreenShare: true }],
    });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();
// Get profileId from req.profile (set in protectRoute)
const profileId = req.profile?.publicProfileId;

if (!profileId) {
  return res.status(400).json({ message: "Profile ID missing" });
}

res.status(201).json({
  success: true,
  profileId: profileId,
  sessionId: session._id,
  session, // optional but useful
});
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getActiveSessions(req, res) {
  try {
    const { search } = req.query;
    let query = { status: "active" };

    const sessions = await Session.find(query)
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .populate("participants.user", "name profileImage email clerkId")
      .populate("problemId", "title slug description difficulty category constraints examples starterCode")
      .sort({ createdAt: -1 })
      .limit(50);

    // Client-side search filtering (host name or problem name)
    let filtered = sessions;
    if (search) {
      const s = search.toLowerCase();
      filtered = sessions.filter(
        (session) =>
          session.problem.toLowerCase().includes(s) ||
          session.host?.name?.toLowerCase().includes(s)
      );
    }

    // Add hasPassword flag and strip the actual password
    const result = filtered.map((session) => {
      const obj = session.toObject();
      obj.hasPassword = !!obj.password;
      delete obj.password;
      return obj;
    });

    res.status(200).json({ sessions: result });
  } catch (error) {
    console.log("Error in getActiveSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;

    // get sessions where user is either host or participant (legacy + new)
    const sessions = await Session.find({
      status: "completed",
      $or: [
        { host: userId },
        { participant: userId },
        { "participants.user": userId },
      ],
    })
      .populate("host", "name profileImage email clerkId")
      .populate("participant", "name profileImage email clerkId")
      .populate("participants.user", "name profileImage email clerkId")
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.log("Error in getMyRecentSessions controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId")
      .populate("participants.user", "name email profileImage clerkId")
      .populate("problemId", "title slug description difficulty category constraints examples starterCode");

    if (!session) return res.status(404).json({ message: "Session not found" });

    // Don't expose password in response
    const sessionObj = session.toObject();
    sessionObj.hasPassword = !!session.password;
    delete sessionObj.password;

    res.status(200).json({ session: sessionObj });
  } catch (error) {
    console.log("Error in getSessionById controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Cannot join a completed session" });
    }

    if (session.host.toString() === userId.toString()) {
      return res.status(400).json({ message: "Host cannot join their own session as participant" });
    }

    // Block if user is already in a DIFFERENT active session (409 → frontend shows modal).
    // If they're already in THIS session, the "alreadyJoined" check below handles re-join.
    const userExisting = await checkUserActiveSession(userId);
    if (userExisting && userExisting.session._id.toString() !== id) {
      // Block the user — return a 409 with clear info so the frontend
      // can show a friendly "already in session" dialog rather than
      // silently redirecting them.
      return res.status(409).json({
        alreadyInSession: true,
        sessionId: userExisting.session._id,
        sessionHost: userExisting.session.host,
        role: userExisting.role,
        message:
          userExisting.role === "HOST"
            ? "You are already hosting another live session. Please end it before joining a new one."
            : "You are already attending another live session. Please leave it before joining a new one.",
      });
    }

    // Password check
    if (session.password && session.password !== password) {
      return res.status(401).json({ message: "Incorrect session password" });
    }

    // Check if already a participant
    const alreadyJoined = session.participants.some(
      (p) => p.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      // Already joined — ensure Stream channel membership is intact
      // (covers cases where previous addMembers failed or got out of sync)
      try {
        const channel = chatClient.channel("messaging", session.callId);
        await channel.addMembers([clerkId]);
      } catch (memberErr) {
        console.warn("Could not re-add member to chat channel:", memberErr.message);
      }

      const populated = await Session.findById(id)
        .populate("host", "name email profileImage clerkId")
        .populate("participants.user", "name email profileImage clerkId");
      return res.status(200).json({ session: populated });
    }

    // Check if session is full (host is already in participants array)
    if (session.participants.length >= session.maxParticipants) {
      return res.status(409).json({ message: "Session is full" });
    }

    // Add to new participants array
    session.participants.push({ user: userId });

    // Also set legacy participant field for backward compat (first joiner)
    if (!session.participant) {
      session.participant = userId;
    }

    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    const populated = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId")
      .populate("participants.user", "name email profileImage clerkId");

    res.status(200).json({ session: populated });
  } catch (error) {
    console.log("Error in joinSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Validate session password without joining
export async function validateSessionPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (!session.password) {
      return res.status(200).json({ valid: true });
    }

    if (session.password === password) {
      return res.status(200).json({ valid: true });
    }

    return res.status(401).json({ valid: false, message: "Incorrect password" });
  } catch (error) {
    console.log("Error in validateSessionPassword:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // check if user is the host
    if (session.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the host can end the session" });
    }

    // check if session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // Save final code snapshot (also save per-language map)
    session.finalCode = session.currentCode || "";
    
    // Copy languageCode to finalLanguageCode
    if (session.languageCode && session.languageCode.size > 0) {
      // Make sure current code is saved for current language
      if (session.currentLanguage && session.currentCode) {
        session.languageCode.set(session.currentLanguage, session.currentCode);
      }
      session.finalLanguageCode = new Map(session.languageCode);
    }

    // delete stream video call
    const call = streamClient.video.call("default", session.callId);
    try {
      await call.delete({ hard: true });
    } catch (callErr) {
      console.log("Stream call delete error (non-fatal):", callErr.message);
    }

    // delete stream chat channel
    const channel = chatClient.channel("messaging", session.callId);
    try {
      await channel.delete();
    } catch (chatErr) {
      console.log("Stream chat delete error (non-fatal):", chatErr.message);
    }

    session.status = "completed";
    await session.save();

    res.status(200).json({ session, message: "Session ended successfully" });
  } catch (error) {
    console.log("Error in endSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Leave session (reliable HTTP endpoint — not dependent on socket timing)
export async function leaveSessionHTTP(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "active") {
      return res.status(400).json({ message: "Session is not active" });
    }

    // If the host "leaves", treat it as ending the session
    if (session.host.toString() === userId.toString()) {
      // Save final code snapshot
      session.finalCode = session.currentCode || "";
      if (session.languageCode && session.languageCode.size > 0) {
        if (session.currentLanguage && session.currentCode) {
          session.languageCode.set(session.currentLanguage, session.currentCode);
        }
        session.finalLanguageCode = new Map(session.languageCode);
      }
      session.status = "completed";
      await session.save();

      // Clean up Stream resources (non-fatal)
      try {
        await streamClient.video.call("default", session.callId).delete({ hard: true });
      } catch (e) { /* non-fatal */ }
      try {
        await chatClient.channel("messaging", session.callId).delete();
      } catch (e) { /* non-fatal */ }

      // Notify remaining participants
      try {
        getIO().to(id).emit("session:ended", {
          message: "Session ended because the host left.",
        });
      } catch (e) { /* io may not be ready */ }

      return res.status(200).json({ message: "Session ended (host left)" });
    }

    // Remove participant from participants array
    await Session.findByIdAndUpdate(id, {
      $pull: { participants: { user: userId } },
    });

    // Clear legacy participant field if it matches
    if (session.participant?.toString() === userId.toString()) {
      await Session.findByIdAndUpdate(id, { participant: null });
    }

    // Log in edit history
    await Session.findByIdAndUpdate(id, {
      $push: {
        editHistory: {
          userId: req.user.clerkId,
          userName: req.user.name,
          action: "leave",
          timestamp: new Date(),
        },
      },
    });

    res.status(200).json({ message: "Left session successfully" });
  } catch (error) {
    console.log("Error in leaveSessionHTTP:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get session history/report after completion
export async function getSessionHistory(req, res) {
  try {
    const { id } = req.params;

    const session = await Session.findById(id)
      .populate("host", "name email profileImage clerkId")
      .populate("participant", "name email profileImage clerkId")
      .populate("participants.user", "name email profileImage clerkId")
      .populate("editHistory.userId", "name profileImage");

    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({
      session: {
        _id: session._id,
        problem: session.problem,
        difficulty: session.difficulty,
        status: session.status,
        host: session.host,
        participants: session.participants,
        participant: session.participant,
        finalCode: session.finalCode || session.currentCode,
        currentLanguage: session.currentLanguage,
        // Per-language code maps (convert from Mongoose Map to plain object)
        languageCode: session.languageCode instanceof Map
          ? Object.fromEntries(session.languageCode)
          : (session.languageCode || {}),
        finalLanguageCode: session.finalLanguageCode instanceof Map
          ? Object.fromEntries(session.finalLanguageCode)
          : (session.finalLanguageCode || {}),
        editHistory: session.editHistory,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    console.log("Error in getSessionHistory controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
