/**
 * Date and Heatmap Utilities
 * 
 * Helper functions for date formatting, heatmap generation, and streak calculation.
 * Generates LeetCode-style heatmap data structure.
 */

/**
 * Format date to YYYY-MM-DD
 * 
 * @param {Date} date 
 * @returns {string}
 */
export function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for heatmap (last 365 days)
 * 
 * @returns {Array<string>} Array of date strings (YYYY-MM-DD)
 */
export function getHeatmapDateRange() {
  const dates = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(formatDateKey(date));
  }
  
  return dates;
}

/**
 * Calculate streak from sorted activity dates (LeetCode-style)
 * 
 * Current streak: consecutive days including today or yesterday
 * Max streak: longest consecutive streak in history
 * 
 * @param {Array<string>} activeDates - Array of date strings (YYYY-MM-DD)
 * @returns {object} { current: number, max: number }
 */
export function calculateStreak(activeDates) {
  if (!activeDates || activeDates.length === 0) {
    return { current: 0, max: 0 };
  }
  
  // Remove duplicates and sort in descending order (newest first)
  const uniqueDates = [...new Set(activeDates)].sort().reverse();
  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 86400000));
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak (must include today or yesterday)
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1;
    
    // Count backwards from most recent date
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = Math.floor((prevDate - currDate) / 86400000);
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }
  }
  
  // Calculate max streak (scan entire history)
  tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor((prevDate - currDate) / 86400000);
    
    if (diffDays === 1) {
      tempStreak++;
      maxStreak = Math.max(maxStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }
  
  // Ensure maxStreak is at least as large as currentStreak
  maxStreak = Math.max(maxStreak, currentStreak, 1);
  
  return { current: currentStreak, max: maxStreak };
}

/**
 * Generate heatmap data structure (LeetCode-style)
 * 
 * Creates a grid of weeks (columns) × days (rows) with proper month labels
 * 
 * @param {Array} submissions - Array of submission documents
 * @param {Date} startDate - Start date for heatmap
 * @param {Date} endDate - End date for heatmap
 * @returns {object} { dates: {}, months: [], weeks: [] }
 */
export function generateHeatmapData(submissions, startDate = null, endDate = null) {
  const dateMap = {};
  const weeks = [];
  
  // Use provided dates or default to last 365 days
  const end = endDate || new Date();
  const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  // Align start to Sunday (beginning of week)
  const alignedStart = new Date(start);
  alignedStart.setHours(0, 0, 0, 0);
  alignedStart.setDate(alignedStart.getDate() - alignedStart.getDay());
  
  // Align end to Saturday (end of week)
  const alignedEnd = new Date(end);
  alignedEnd.setHours(23, 59, 59, 999);
  
  // Calculate total days
  const totalDays = Math.ceil((alignedEnd - alignedStart) / (24 * 60 * 60 * 1000)) + 1;
  
  // Initialize all dates with 0 submissions
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(alignedStart);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    dateMap[dateKey] = 0;
  }
  
  // Count submissions per date
  submissions.forEach((submission) => {
    const dateKey = formatDateKey(submission.submittedAt);
    if (dateMap[dateKey] !== undefined) {
      dateMap[dateKey]++;
    }
  });
  
  // Generate all weeks (each week is 7 days: Sun-Sat)
  let currentWeek = [];
  let weekIndex = 0;
  
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(alignedStart);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    
    currentWeek.push({
      date: dateKey,
      count: dateMap[dateKey] || 0,
      level: getHeatmapLevel(dateMap[dateKey] || 0),
      dayOfWeek: date.getDay(),
      dayOfMonth: date.getDate(),
      month: date.getMonth(),
    });
    
    if (currentWeek.length === 7) {
      weeks.push([...currentWeek]);
      currentWeek = [];
      weekIndex++;
    }
  }
  
  // Push any remaining days
  if (currentWeek.length > 0) {
    // Fill incomplete week with empty cells at the end
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: null,
        count: 0,
        level: 0,
        dayOfWeek: currentWeek.length,
        dayOfMonth: null,
        month: null,
      });
    }
    weeks.push(currentWeek);
  }
  
  // Generate month labels based on when each month first appears
  // Look at each week and detect month changes
  const months = [];
  let lastMonth = -1;
  let lastYear = -1;
  
  weeks.forEach((week, idx) => {
    // Get the first valid day in this week
    const firstValidDay = week.find(day => day.date);
    if (firstValidDay) {
      const monthNum = firstValidDay.month;
      const date = new Date(firstValidDay.date);
      const year = date.getFullYear();
      
      // Check if this is a new month
      if (monthNum !== lastMonth || year !== lastYear) {
        months.push({
          name: date.toLocaleString("en-US", { month: "short" }),
          year: year,
          weekIndex: idx,
        });
        lastMonth = monthNum;
        lastYear = year;
      }
    }
  });
  
  return {
    dates: dateMap,
    months,
    weeks,
  };
}

/**
 * Determine heatmap intensity level based on submission count (LeetCode thresholds)
 * 
 * @param {number} count - Submission count
 * @returns {number} Level (0-4)
 */
export function getHeatmapLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4; // 7+
}

/**
 * Format relative time (e.g., "3 days ago")
 * 
 * @param {Date} date 
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
}
