/**
 * Activity Controller
 * 
 * Handles user activity and contribution heatmap endpoints.
 * Matches LeetCode API structure.
 */

import Submission from "../models/Submission.js";
import User from "../models/User.js";
import { formatDateKey, calculateStreak, generateHeatmapData } from "../utils/dateUtils.js";

/**
 * GET /api/activity/heatmap/:userId
 * 
 * Returns contribution heatmap data for specified user.
 * Only counts ACCEPTED submissions (LeetCode behavior).
 * 
 * Query params:
 * - year (optional): Specific year (e.g., 2025), defaults to last 365 days
 * 
 * Response format:
 * {
 *   activity: [{ date: "2026-01-10", count: 3 }],
 *   stats: {
 *     totalSubmissions: 267,
 *     activeDays: 74,
 *     maxStreak: 42,
 *     currentStreak: 8
 *   },
 *   heatmap: { weeks: [...], months: [...] }
 * }
 */
export async function getUserHeatmap(req, res) {
  try {
    const { userId } = req.params;
    const { year } = req.query;
    
    // Verify user exists
    const user = await User.findById(userId).select("createdAt");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    const joinYear = user.createdAt.getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Determine date range
    let startDate, endDate;
    if (year && parseInt(year) !== currentYear) {
      startDate = new Date(`${year}-01-01`);
      endDate = new Date(`${year}-12-31`);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
    }
    
    // Fetch only ACCEPTED submissions
    const submissions = await Submission.find({
      user: userId,
      submittedAt: { $gte: startDate, $lte: endDate },
      verdict: "Accepted",
    })
      .select("submittedAt problemId")
      .sort({ submittedAt: 1 })
      .lean();
    
    // Generate heatmap data structure
    const heatmapData = generateHeatmapData(submissions, startDate, endDate);
    
    // Calculate activity metrics
    const activeDates = submissions.map(s => formatDateKey(s.submittedAt));
    const uniqueDates = [...new Set(activeDates)];
    const streaks = calculateStreak(uniqueDates);
    
    // Build activity array (date → count mapping)
    const activityMap = {};
    submissions.forEach(sub => {
      const date = formatDateKey(sub.submittedAt);
      activityMap[date] = (activityMap[date] || 0) + 1;
    });
    
    const activity = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
    }));
    
    // Get available years
    const availableYears = [];
    for (let y = joinYear; y <= currentYear; y++) {
      availableYears.push(y);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        activity,
        stats: {
          totalSubmissions: submissions.length,
          activeDays: uniqueDates.length,
          maxStreak: streaks.max,
          currentStreak: streaks.current,
        },
        heatmap: {
          weeks: heatmapData.weeks,
          months: heatmapData.months,
        },
        meta: {
          availableYears,
          selectedYear: year ? parseInt(year) : currentYear,
          joinYear,
          startDate: formatDateKey(startDate),
          endDate: formatDateKey(endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user heatmap:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity data",
      error: error.message,
    });
  }
}

/**
 * GET /api/activity/stats/:userId
 * 
 * Returns summary statistics only (faster endpoint).
 */
export async function getUserStats(req, res) {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    
    // Get accepted submissions from last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    
    const submissions = await Submission.find({
      user: userId,
      submittedAt: { $gte: oneYearAgo },
      verdict: "Accepted",
    })
      .select("submittedAt")
      .lean();
    
    const activeDates = submissions.map(s => formatDateKey(s.submittedAt));
    const uniqueDates = [...new Set(activeDates)];
    const streaks = calculateStreak(uniqueDates);
    
    return res.status(200).json({
      success: true,
      data: {
        totalSubmissions: submissions.length,
        activeDays: uniqueDates.length,
        maxStreak: streaks.max,
        currentStreak: streaks.current,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
    });
  }
}
