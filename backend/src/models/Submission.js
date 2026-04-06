/**
 * Submission Model
 * 
 * Stores individual code submissions with their verdicts.
 * This is separate from the user's "accepted" submissions stored in User model.
 */

import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java"],
      required: true,
    },
    verdict: {
      type: String,
      enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error",
        "Memory Limit Exceeded",
        "Pending",
        "Failed"
      ],
      default: "Pending",
    },
    passedTestCases: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    runtime: {
      type: Number, // in milliseconds
      default: null,
    },
    memory: {
      type: Number, // in KB
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
submissionSchema.index({ user: 1, problem: 1, submittedAt: -1 });
submissionSchema.index({ problem: 1, verdict: 1 });

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
