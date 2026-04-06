import mongoose from "mongoose";

/**
 * UserProfile Model
 * 
 * Stores user profile data with LeetCode-style public profile ID system.
 * 
 * KEY FEATURES:
 * - publicProfileId: Short, unique, alphanumeric ID (e.g., "6O0OwlfSD8")
 * - User-facing URL: /profile/:publicProfileId
 * - Can be changed by user (with uniqueness validation)
 */

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Public-facing profile identifier (like LeetCode's "06OOwlfSD8")
    publicProfileId: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9]{8,12}$/, // Alphanumeric, 8-12 chars
    },
    // Profile metadata
    displayName: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
    },
    location: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    // GitHub, LinkedIn, etc.
    socialLinks: {
      github: String,
      linkedin: String,
      twitter: String,
    },
    // PROBLEM SOLVING STATISTICS
    // These are computed from SolvedProblem collection
    stats: {
      totalSolved: {
        type: Number,
        default: 0,
      },
      easySolved: {
        type: Number,
        default: 0,
      },
      mediumSolved: {
        type: Number,
        default: 0,
      },
      hardSolved: {
        type: Number,
        default: 0,
      },
    },
    // SUBMISSION STATISTICS (for heatmap)
    // This tracks SUBMISSION COUNT, not solved count
    submissionStats: {
      totalSubmissions: {
        type: Number,
        default: 0,
      },
      acceptedSubmissions: {
        type: Number,
        default: 0,
      },
    },
    // LANGUAGE-WISE STATS
    // Count of UNIQUE problems solved per language
    languageStats: {
      javascript: {
        type: Number,
        default: 0,
      },
      python: {
        type: Number,
        default: 0,
      },
      java: {
        type: Number,
        default: 0,
      },
    },
    // STREAK INFORMATION
    streak: {
      current: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
      lastActivityDate: {
        type: Date,
        default: null,
      },
    },
    // ACTIVITY DAYS
    // Total days user has submitted at least once
    totalActiveDays: {
      type: Number,
      default: 0,
    },
    // Track unique dates when user submitted
    // Used for streak calculation
    activeDates: {
      type: [String], // Store dates as "YYYY-MM-DD"
      default: [],
    },
    // RANKING (optional - can be computed)
    rank: {
      type: Number,
      default: null,
    },
    // Profile visibility
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
// Note: userId and publicProfileId already have unique indexes from schema definition
userProfileSchema.index({ "stats.totalSolved": -1 }); // For ranking

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
