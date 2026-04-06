import mongoose from "mongoose";

/**
 * SolvedProblem Model
 * 
 * Tracks UNIQUE problems solved by each user.
 * KEY: If a user submits the same problem 10 times, it counts as 1 solved.      
 * 
 * This is the source of truth for:
 * - totalSolved, easySolved, mediumSolved, hardSolved
 * - Language-wise problem counts
 */

const solvedProblemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    // Language in which the problem was FIRST solved
    primaryLanguage: {
      type: String,
      enum: ["javascript", "python", "java"],
      required: true,
    },
    // All languages in which this problem has been solved
    languagesSolved: [
      {
        type: String,
        enum: ["javascript", "python", "java"],
      },
    ],
    // Timestamp when first solved
    firstSolvedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Timestamp of last accepted submission
    lastSubmissionAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure ONE solved record per user per problem
solvedProblemSchema.index({ userId: 1, problemId: 1 }, { unique: true });

// Index for efficient language stats queries
solvedProblemSchema.index({ userId: 1, languagesSolved: 1 });

const SolvedProblem = mongoose.model("SolvedProblem", solvedProblemSchema);

export default SolvedProblem;
