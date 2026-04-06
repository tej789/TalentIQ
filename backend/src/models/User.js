import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    preferredLanguage: {
      type: String,
      enum: ["javascript", "python", "java"],
      default: "javascript",
    },
    languageStats: {
      javascript: { type: Number, default: 0 },
      python: { type: Number, default: 0 },
      java: { type: Number, default: 0 },
    },
    // Reference to user's profile
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserProfile",
    },
    submissions: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Problem",
          required: true,
        },
        language: {
          type: String,
          required: true,
          enum: ["javascript", "python", "java"],
        },
        code: {
          type: String,
          required: true,
        },
        verdict: {
          type: String,
          enum: ["Accepted", "Wrong Answer", "Runtime Error", "Time Limit Exceeded", "Failed"],
          default: "Accepted",
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true } 
);

const User = mongoose.model("User", userSchema);

export default User;
