import mongoose from "mongoose";

/**
 * CodeDraft Schema
 * 
 * Stores the user's latest code draft for each problem.
 * This is NOT for submission history - it's only for auto-save functionality.
 * Only the latest draft is stored per user+problem+language combination.
 */
const codeDraftSchema = new mongoose.Schema(
  {
    // Reference to the user who owns this draft
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Reference to the problem this draft is for
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    // Programming language of the draft
    language: {
      type: String,
      enum: ["javascript", "python", "java"],
      required: true,
    },
    // The actual code content
    code: {
      type: String,
      default: "",
    },
    // Last time the draft was updated (for display purposes)
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

/**
 * Compound Index for fast lookups
 * 
 * This index ensures:
 * 1. Fast queries when fetching a user's draft for a specific problem
 * 2. Uniqueness - only one draft per user+problem+language combination
 * 3. Efficient upsert operations
 */
codeDraftSchema.index(
  { userId: 1, problemId: 1, language: 1 },
  { unique: true }
);

// Additional index for fetching all drafts by user (useful for dashboard)
codeDraftSchema.index({ userId: 1, updatedAt: -1 });

const CodeDraft = mongoose.model("CodeDraft", codeDraftSchema);

export default CodeDraft;
