import mongoose from "mongoose";

const editHistorySchema = new mongoose.Schema(
  {
    userId: { type: String },
    userName: { type: String },
    timestamp: { type: Date, default: Date.now },
    language: { type: String },
    codeDelta: { type: String, default: "" },
    action: {
      type: String,
      enum: ["edit", "language_change", "join", "leave", "permission_grant", "permission_revoke"],
      default: "edit",
    },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    canEdit: { type: Boolean, default: false },
    canScreenShare: { type: Boolean, default: false },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    problem: {
      type: String,
      required: true,
    },
    // Reference to the Problem document in MongoDB
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      default: null,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Keep legacy field for backward compat
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // New multi-participant array
    participants: [participantSchema],
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    // stream video call ID
    callId: {
      type: String,
      default: "",
    },
    // New collaborative session fields
    password: { type: String, default: "" },
    maxParticipants: { type: Number, default: 5, min: 2, max: 20 },
    currentCode: { type: String, default: "" },
    currentLanguage: { type: String, default: "javascript" },
    finalCode: { type: String, default: "" },
    // Per-language code storage: { javascript: "...", python: "...", java: "..." }
    languageCode: { type: Map, of: String, default: {} },
    // Per-language final code snapshot saved when session ends
    finalLanguageCode: { type: Map, of: String, default: {} },
    editHistory: [editHistorySchema],
    screenShareUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ status: 1, createdAt: -1 });

// ---------------------------------------------------------------------------
// DB-level partial unique indexes (race-condition protection)
// ---------------------------------------------------------------------------
// Why DB-level constraints matter:
//   Application-level checks (findOne → create) are NOT atomic. Two concurrent
//   requests can both pass the findOne check before either creates the document.
//   A partial unique index makes MongoDB reject the second insert/update at the
//   storage-engine level, guaranteeing data integrity even under heavy concurrency.
//
// 1. One ACTIVE session per host — prevents duplicate active sessions for same host
sessionSchema.index(
  { host: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

// 2. One ACTIVE session per host + problem — prevents same host creating duplicate
//    active sessions for the exact same problem (extra safeguard)
sessionSchema.index(
  { host: 1, problem: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "active" } }
);

const Session = mongoose.model("Session", sessionSchema);

export default Session;
