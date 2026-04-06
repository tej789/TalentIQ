/**
 * Profile Utilities
 * 
 * Helper functions for profile ID generation, validation, and formatting.
 */

/**
 * Generate a unique public profile ID (LeetCode-style)
 * 
 * Format: Alphanumeric, 8-12 characters
 * Example: "6O0OwlfSD8", "Xa9Bk2Lm"
 * 
 * @returns {string} Generated profile ID
 */
export function generateProfileId(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  // Exclude ambiguous characters: 0/O, 1/l/I
  
  let profileId = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    profileId += chars[randomIndex];
  }
  
  return profileId;
}

/**
 * Validate profile ID format
 * 
 * @param {string} profileId 
 * @returns {boolean}
 */
export function isValidProfileId(profileId) {
  if (!profileId || typeof profileId !== "string") {
    return false;
  }
  
  // Must be 8-12 alphanumeric characters
  const regex = /^[a-zA-Z0-9]{8,12}$/;
  return regex.test(profileId);
}

/**
 * Check if profile ID is available (must be checked against DB)
 * This is a helper to validate the format before DB check
 * 
 * @param {string} profileId 
 * @returns {object} { valid: boolean, message: string }
 */
export function validateProfileIdFormat(profileId) {
  if (!profileId) {
    return { valid: false, message: "Profile ID is required" };
  }
  
  if (profileId.length < 8 || profileId.length > 12) {
    return { valid: false, message: "Profile ID must be 8-12 characters long" };
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(profileId)) {
    return { valid: false, message: "Profile ID can only contain letters and numbers" };
  }
  
  // Reserved words
  const reserved = ["admin", "api", "profile", "user", "settings", "undefined", "null"];
  if (reserved.includes(profileId.toLowerCase())) {
    return { valid: false, message: "This profile ID is reserved" };
  }
  
  return { valid: true, message: "Valid profile ID" };
}

/**
 * Format user rank display
 * 
 * @param {number} rank 
 * @returns {string} Formatted rank (e.g., "1,092,740")
 */
export function formatRank(rank) {
  if (!rank) return "N/A";
  return rank.toLocaleString();
}

/**
 * Calculate acceptance rate
 * 
 * @param {number} accepted 
 * @param {number} total 
 * @returns {string} Percentage (e.g., "45.2%")
 */
export function calculateAcceptanceRate(accepted, total) {
  if (!total || total === 0) return "0%";
  const rate = (accepted / total) * 100;
  return `${rate.toFixed(1)}%`;
}
