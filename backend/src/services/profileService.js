/**
 * Profile Service
 * 
 * Business logic for user profiles, stats calculation, and heatmap generation.
 * Implements LeetCode-style profile behavior.
 */

import UserProfile from "../models/UserProfile.js";
import SolvedProblem from "../models/SolvedProblem.js";
import Submission from "../models/Submission.js";
import Problem from "../models/Problem.js";
import User from "../models/User.js";
import UserPreferences from "../models/UserPreferences.js";
import { generateProfileId, validateProfileIdFormat } from "../utils/profileUtils.js";
import { formatDateKey, calculateStreak, generateHeatmapData } from "../utils/dateUtils.js";

/**
 * Create a new user profile with generated profile ID
 * 
 * @param {string} userId - MongoDB ObjectId of user
 * @returns {Promise<object>} Created profile
 */
export async function createUserProfile(userId) {
  try {
    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({ userId });
    if (existingProfile) {
      return existingProfile;
    }
    
    // Generate unique profile ID
    let publicProfileId;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      publicProfileId = generateProfileId();
      const existing = await UserProfile.findOne({ publicProfileId });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      throw new Error("Failed to generate unique profile ID");
    }
    
    // Create profile
    const profile = new UserProfile({
      userId,
      publicProfileId,
      stats: {
        totalSolved: 0,
        easySolved: 0,
        mediumSolved: 0,
        hardSolved: 0,
      },
      submissionStats: {
        totalSubmissions: 0,
        acceptedSubmissions: 0,
      },
      languageStats: {
        javascript: 0,
        python: 0,
        java: 0,
      },
      streak: {
        current: 0,
        max: 0,
        lastActivityDate: null,
      },
      totalActiveDays: 0,
      activeDates: [],
    });
    
    await profile.save();
    
    // Create default preferences
    const preferences = new UserPreferences({
      userId,
      theme: {
        mode: "dark",
        heatmapColor: "#10b981",
        accentColor: "#3b82f6",
      },
    });
    
    await preferences.save();
    
    // Update user document with profile reference
    await User.findByIdAndUpdate(userId, { profile: profile._id });
    
    return profile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

/**
 * Get profile by public profile ID
 * 
 * @param {string} publicProfileId 
 * @returns {Promise<object>} Profile data with user info
 */
export async function getProfileByPublicId(publicProfileId) {
  try {
    const profile = await UserProfile.findOne({ publicProfileId })
      .populate("userId", "name email profileImage clerkId")
      .lean();
    
    if (!profile) {
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
}

/**
 * Update public profile ID
 * 
 * @param {string} userId 
 * @param {string} newProfileId 
 * @returns {Promise<object>}
 */
export async function updateProfileId(userId, newProfileId) {
  try {
    // Validate format
    const validation = validateProfileIdFormat(newProfileId);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    // Check uniqueness
    const existing = await UserProfile.findOne({ publicProfileId: newProfileId });
    if (existing && existing.userId.toString() !== userId) {
      throw new Error("This profile ID is already taken");
    }
    
    // Update
    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { publicProfileId: newProfileId },
      { new: true }
    );
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    return profile;
  } catch (error) {
    console.error("Error updating profile ID:", error);
    throw error;
  }
}

/**
 * Process a submission and update all related stats
 * 
 * KEY LOGIC:
 * - If problem solved for first time → increment totalSolved
 * - Always increment submission count (for heatmap)
 * - Update language stats
 * - Update streak
 * 
 * @param {string} userId 
 * @param {string} problemId 
 * @param {string} language 
 * @param {string} verdict 
 * @returns {Promise<void>}
 */
export async function processSubmission(userId, problemId, language, verdict) {
  try {
    // Get problem details
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new Error("Problem not found");
    }
    
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    const today = formatDateKey(new Date());
    
    // Update submission count (for heatmap - counts ALL submissions)
    profile.submissionStats.totalSubmissions++;
    
    // If submission is accepted
    if (verdict === "Accepted") {
      profile.submissionStats.acceptedSubmissions++;
      
      // Check if problem already solved
      let solvedProblem = await SolvedProblem.findOne({ userId, problemId });
      
      if (!solvedProblem) {
        // FIRST TIME SOLVING THIS PROBLEM
        // Create solved problem record
        solvedProblem = new SolvedProblem({
          userId,
          problemId,
          difficulty: problem.difficulty,
          primaryLanguage: language,
          languagesSolved: [language],
          firstSolvedAt: new Date(),
          lastSubmissionAt: new Date(),
        });
        
        await solvedProblem.save();
        
        // Increment solved count
        profile.stats.totalSolved++;
        
        if (problem.difficulty === "Easy") {
          profile.stats.easySolved++;
        } else if (problem.difficulty === "Medium") {
          profile.stats.mediumSolved++;
        } else if (problem.difficulty === "Hard") {
          profile.stats.hardSolved++;
        }
        
        // Increment language stat
        if (profile.languageStats[language] !== undefined) {
          profile.languageStats[language]++;
        }
      } else {
        // Problem already solved, but maybe in a different language
        if (!solvedProblem.languagesSolved.includes(language)) {
          solvedProblem.languagesSolved.push(language);
          solvedProblem.lastSubmissionAt = new Date();
          await solvedProblem.save();
          
          // Increment language stat for this new language
          if (profile.languageStats[language] !== undefined) {
            profile.languageStats[language]++;
          }
        } else {
          // Just update last submission time
          solvedProblem.lastSubmissionAt = new Date();
          await solvedProblem.save();
        }
      }
    }
    
    // Update active dates (for streak calculation)
    if (!profile.activeDates.includes(today)) {
      profile.activeDates.push(today);
      profile.totalActiveDays++;
      
      // Keep only last 365 days
      if (profile.activeDates.length > 365) {
        profile.activeDates.sort();
        profile.activeDates = profile.activeDates.slice(-365);
      }
    }
    
    // Update streak
    const streakData = calculateStreak(profile.activeDates);
    profile.streak.current = streakData.current;
    profile.streak.max = streakData.max;
    profile.streak.lastActivityDate = new Date();
    
    await profile.save();
  } catch (error) {
    console.error("Error processing submission:", error);
    throw error;
  }
}

/**
 * Get comprehensive profile statistics
 * 
 * @param {string} publicProfileId 
 * @returns {Promise<object>}
 */
export async function getProfileStats(publicProfileId) {
  try {
    const profile = await getProfileByPublicId(publicProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    // Get total problems count per difficulty
    const [easyCount, mediumCount, hardCount] = await Promise.all([
      Problem.countDocuments({ difficulty: "Easy" }),
      Problem.countDocuments({ difficulty: "Medium" }),
      Problem.countDocuments({ difficulty: "Hard" }),
    ]);
    
    const totalProblems = easyCount + mediumCount + hardCount;
    
    return {
      solved: {
        total: profile.stats.totalSolved,
        easy: profile.stats.easySolved,
        medium: profile.stats.mediumSolved,
        hard: profile.stats.hardSolved,
      },
      available: {
        total: totalProblems,
        easy: easyCount,
        medium: mediumCount,
        hard: hardCount,
      },
      submissions: {
        total: profile.submissionStats.totalSubmissions,
        accepted: profile.submissionStats.acceptedSubmissions,
      },
      streak: {
        current: profile.streak.current,
        max: profile.streak.max,
      },
      activeDays: profile.totalActiveDays,
    };
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    throw error;
  }
}

/**
 * Get heatmap data (submission count per day)
 * 
 * @param {string} publicProfileId 
 * @returns {Promise<object>}
 */
export async function getHeatmapData(publicProfileId, year = null) {
  try {
    const profile = await getProfileByPublicId(publicProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    // Get user's join date
    const user = await User.findById(profile.userId._id).select("createdAt");
    const joinYear = user.createdAt.getFullYear();
    
    // Determine date range based on year parameter
    let startDate, endDate;
    const currentYear = new Date().getFullYear();
    
    if (year && year !== currentYear) {
      // Specific year requested
      startDate = new Date(`${year}-01-01`);
      endDate = new Date(`${year}-12-31`);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Current year or last 365 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
    }
    
    // ONLY COUNT ACCEPTED SUBMISSIONS (LeetCode behavior)
    const submissions = await Submission.find({
      user: profile.userId._id,
      submittedAt: { $gte: startDate, $lte: endDate },
      verdict: "Accepted", // ✅ Only accepted submissions count
    })
      .select("submittedAt verdict")
      .sort({ submittedAt: 1 })
      .lean();
    
    const heatmapData = generateHeatmapData(submissions, startDate, endDate);
    
    // Calculate streaks from accepted submissions
    const activeDates = submissions.map(s => formatDateKey(s.submittedAt));
    const uniqueDates = [...new Set(activeDates)];
    const streaks = calculateStreak(uniqueDates);
    
    // Get available years for dropdown
    const availableYears = [];
    for (let y = joinYear; y <= currentYear; y++) {
      availableYears.push(y);
    }
    
    return {
      ...heatmapData,
      totalSubmissions: submissions.length,
      activeDays: uniqueDates.length,
      currentStreak: streaks.current,
      maxStreak: streaks.max,
      availableYears,
      selectedYear: year || currentYear,
      joinYear,
    };
  } catch (error) {
    console.error("Error fetching heatmap data:", error);
    throw error;
  }
}

/**
 * Get language-wise statistics
 * 
 * @param {string} publicProfileId 
 * @returns {Promise<Array>}
 */
export async function getLanguageStats(publicProfileId) {
  try {
    const profile = await getProfileByPublicId(publicProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    const languageStats = [
      {
        language: "JavaScript",
        key: "javascript",
        problemsSolved: profile.languageStats.javascript,
      },
      {
        language: "Python",
        key: "python",
        problemsSolved: profile.languageStats.python,
      },
      {
        language: "Java",
        key: "java",
        problemsSolved: profile.languageStats.java,
      },
    ];
    
    // Sort by problems solved (descending)
    languageStats.sort((a, b) => b.problemsSolved - a.problemsSolved);
    
    return languageStats.filter((lang) => lang.problemsSolved > 0);
  } catch (error) {
    console.error("Error fetching language stats:", error);
    throw error;
  }
}

/**
 * Get recent solved problems
 * 
 * @param {string} publicProfileId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getRecentSolvedProblems(publicProfileId, limit = 10) {
  try {
    const profile = await getProfileByPublicId(publicProfileId);
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    const recentSolved = await SolvedProblem.find({ userId: profile.userId._id })
      .populate({
        path: "problemId",
        select: "title slug difficulty isActive deletedAt",
        match: { isActive: true } // Only populate active problems
      })
      .sort({ lastSubmissionAt: -1 })
      .limit(limit * 2) // Get more in case some are filtered out
      .lean();
    
    // Filter out submissions where problem was deleted (problemId will be null after populate with match)
    const validSolved = recentSolved
      .filter(item => item.problemId !== null)
      .slice(0, limit);
    
    return validSolved.map((item) => ({
      problemId: item.problemId._id,
      title: item.problemId.title,
      slug: item.problemId.slug,
      difficulty: item.difficulty,
      primaryLanguage: item.primaryLanguage,
      languagesSolved: item.languagesSolved,
      firstSolvedAt: item.firstSolvedAt,
      lastSubmissionAt: item.lastSubmissionAt,
    }));
  } catch (error) {
    console.error("Error fetching recent solved problems:", error);
    throw error;
  }
}
