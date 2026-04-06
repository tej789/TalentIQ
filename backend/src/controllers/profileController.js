/**
 * Profile Controller
 * 
 * Handles HTTP requests for user profile operations.
 */

import {
  getProfileByPublicId,
  getProfileStats,
  getHeatmapData,
  getLanguageStats,
  getRecentSolvedProblems,
  updateProfileId,
  createUserProfile,
} from "../services/profileService.js";
import UserPreferences from "../models/UserPreferences.js";
import UserProfile from "../models/UserProfile.js";

/**
 * GET /api/profile/:publicProfileId
 * 
 * Get full profile data by public profile ID
 */
export async function getProfile(req, res) {
  try {
    const { publicProfileId } = req.params;
    
    const profile = await getProfileByPublicId(publicProfileId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }
    
    // Get preferences
    const preferences = await UserPreferences.findOne({ userId: profile.userId._id }).lean();
    
    return res.status(200).json({
      success: true,
      data: {
        profile: {
          publicProfileId: profile.publicProfileId,
          displayName: profile.displayName || profile.userId.name,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          socialLinks: profile.socialLinks,
          profileImage: profile.userId.profileImage || null, // Use Clerk profile image
          rank: profile.rank,
          isPublic: profile.isPublic,
        },
        stats: profile.stats,
        submissionStats: profile.submissionStats,
        languageStats: profile.languageStats,
        streak: profile.streak,
        totalActiveDays: profile.totalActiveDays,
        preferences: preferences || null,
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * GET /api/profile/:publicProfileId/stats
 * 
 * Get comprehensive statistics
 */
export async function getStats(req, res) {
  try {
    const { publicProfileId } = req.params;
    
    const stats = await getProfileStats(publicProfileId);
    
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    
    if (error.message === "Profile not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * GET /api/profile/:publicProfileId/heatmap
 * 
 * Get heatmap data (submission calendar)
 * Query params: year (optional)
 */
export async function getHeatmap(req, res) {
  try {
    const { publicProfileId } = req.params;
    const { year } = req.query;
    
    const heatmapData = await getHeatmapData(publicProfileId, year ? parseInt(year) : null);
    
    return res.status(200).json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error("Error in getHeatmap:", error);
    
    if (error.message === "Profile not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * GET /api/profile/:publicProfileId/languages
 * 
 * Get language-wise problem solving statistics
 */
export async function getLanguages(req, res) {
  try {
    const { publicProfileId } = req.params;
    
    const languageStats = await getLanguageStats(publicProfileId);
    
    return res.status(200).json({
      success: true,
      data: languageStats,
    });
  } catch (error) {
    console.error("Error in getLanguages:", error);
    
    if (error.message === "Profile not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * GET /api/profile/:publicProfileId/recent
 * 
 * Get recently solved problems
 */
export async function getRecentActivity(req, res) {
  try {
    const { publicProfileId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const recentProblems = await getRecentSolvedProblems(publicProfileId, limit);
    
    return res.status(200).json({
      success: true,
      data: recentProblems,
    });
  } catch (error) {
    console.error("Error in getRecentActivity:", error);
    
    if (error.message === "Profile not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/profile/change-id
 * 
 * Update public profile ID
 * (Requires authentication)
 */
export async function changeProfileId(req, res) {
  try {
    const userId = req.user._id; // From auth middleware
    const { newProfileId } = req.body;
    
    if (!newProfileId) {
      return res.status(400).json({
        success: false,
        message: "New profile ID is required",
      });
    }
    
    const updatedProfile = await updateProfileId(userId.toString(), newProfileId);
    
    return res.status(200).json({
      success: true,
      message: "Profile ID updated successfully",
      data: {
        publicProfileId: updatedProfile.publicProfileId,
      },
    });
  } catch (error) {
    console.error("Error in changeProfileId:", error);
    
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

/**
 * PATCH /api/profile/update
 * 
 * Update profile information (bio, location, etc.)
 * (Requires authentication)
 */
export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;
    const { displayName, bio, location, website, socialLinks } = req.body;
    
    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true }
    );
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * POST /api/profile/create
 * 
 * Create a new profile for authenticated user
 * (Called automatically on user registration)
 */
export async function createProfile(req, res) {
  try {
    const userId = req.user._id;
    
    const profile = await createUserProfile(userId.toString());
    
    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Error in createProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}

/**
 * GET /api/profile/my-profile-id
 * 
 * Get current user's public profile ID
 * (Requires authentication)
 */
export async function getMyProfileId(req, res) {
  try {
    const userId = req.user._id;
    
    const profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { publicProfileId: profile.publicProfileId },
    });
  } catch (error) {
    console.error("Error in getMyProfileId:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}
