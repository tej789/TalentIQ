import mongoose from "mongoose";

/**
 * UserPreferences Model
 * 
 * Stores user-specific UI preferences including:
 * - Theme (dark/light)
 * - Heatmap color customization
 * - Other personalization settings
 */

const userPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // THEME SETTINGS
    theme: {
      mode: {
        type: String,
        enum: ["dark", "light"],
        default: "dark",
      },
      // Heatmap color customization (hex color)
      heatmapColor: {
        type: String,
        default: "#10b981", // Default green (emerald-500)
        match: /^#[0-9A-Fa-f]{6}$/, // Hex color validation
      },
      // Primary accent color for UI
      accentColor: {
        type: String,
        default: "#3b82f6", // blue-500
        match: /^#[0-9A-Fa-f]{6}$/,
      },
    },
    // CODE EDITOR PREFERENCES
    editor: {
      fontSize: {
        type: Number,
        default: 14,
        min: 10,
        max: 24,
      },
      theme: {
        type: String,
        enum: ["vs-dark", "vs-light", "monokai", "github"],
        default: "vs-dark",
      },
      tabSize: {
        type: Number,
        default: 2,
        enum: [2, 4, 8],
      },
    },
    // NOTIFICATION PREFERENCES
    notifications: {
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      contestReminders: {
        type: Boolean,
        default: true,
      },
      achievementAlerts: {
        type: Boolean,
        default: true,
      },
    },
    // PRIVACY SETTINGS
    privacy: {
      showProfile: {
        type: Boolean,
        default: true,
      },
      showSubmissions: {
        type: Boolean,
        default: true,
      },
      showHeatmap: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

const UserPreferences = mongoose.model("UserPreferences", userPreferencesSchema);

export default UserPreferences;
