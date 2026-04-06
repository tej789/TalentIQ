/**
 * Preferences Controller
 * 
 * Handles user preference updates (theme, colors, etc.)
 */

import UserPreferences from "../models/UserPreferences.js";

/**
 * GET /api/preferences
 * 
 * Get user preferences
 */
export async function getPreferences(req, res) {
  try {
    const userId = req.user._id;
    
    let preferences = await UserPreferences.findOne({ userId });
    
    // Create default preferences if not found
    if (!preferences) {
      preferences = new UserPreferences({
        userId,
        theme: {
          mode: "dark",
          heatmapColor: "#10b981",
          accentColor: "#3b82f6",
        },
      });
      await preferences.save();
    }
    
    return res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Error in getPreferences:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/preferences/theme
 * 
 * Update theme preferences
 */
export async function updateTheme(req, res) {
  try {
    const userId = req.user._id;
    const { mode, heatmapColor, accentColor } = req.body;
    
    const updateData = {};
    if (mode) updateData["theme.mode"] = mode;
    if (heatmapColor) updateData["theme.heatmapColor"] = heatmapColor;
    if (accentColor) updateData["theme.accentColor"] = accentColor;
    
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Theme updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Error in updateTheme:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid theme data",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/preferences/editor
 * 
 * Update editor preferences
 */
export async function updateEditor(req, res) {
  try {
    const userId = req.user._id;
    const { fontSize, theme, tabSize } = req.body;
    
    const updateData = {};
    if (fontSize) updateData["editor.fontSize"] = fontSize;
    if (theme) updateData["editor.theme"] = theme;
    if (tabSize) updateData["editor.tabSize"] = tabSize;
    
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Editor preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Error in updateEditor:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid editor data",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/preferences/notifications
 * 
 * Update notification preferences
 */
export async function updateNotifications(req, res) {
  try {
    const userId = req.user._id;
    const { emailEnabled, contestReminders, achievementAlerts } = req.body;
    
    const updateData = {};
    if (emailEnabled !== undefined) updateData["notifications.emailEnabled"] = emailEnabled;
    if (contestReminders !== undefined) updateData["notifications.contestReminders"] = contestReminders;
    if (achievementAlerts !== undefined) updateData["notifications.achievementAlerts"] = achievementAlerts;
    
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Error in updateNotifications:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid notification data",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/preferences/privacy
 * 
 * Update privacy preferences
 */
export async function updatePrivacy(req, res) {
  try {
    const userId = req.user._id;
    const { showProfile, showSubmissions, showHeatmap } = req.body;
    
    const updateData = {};
    if (showProfile !== undefined) updateData["privacy.showProfile"] = showProfile;
    if (showSubmissions !== undefined) updateData["privacy.showSubmissions"] = showSubmissions;
    if (showHeatmap !== undefined) updateData["privacy.showHeatmap"] = showHeatmap;
    
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Privacy preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Error in updatePrivacy:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid privacy data",
      error: error.message,
    });
  }
}
