/**
 * Profile API Service
 * 
 * Frontend API calls for profile-related operations
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Get profile data by public profile ID
 */
export const getProfile = async (publicProfileId) => {
  const response = await axios.get(`${API_URL}/profile/${publicProfileId}`);
  return response.data;
};

/**
 * Get profile statistics
 */
export const getProfileStats = async (publicProfileId) => {
  const response = await axios.get(`${API_URL}/profile/${publicProfileId}/stats`);
  return response.data;
};

/**
 * Get heatmap data
 */
export const getHeatmapData = async (publicProfileId, year = null) => {
  const params = year ? { year } : {};
  const response = await axios.get(`${API_URL}/profile/${publicProfileId}/heatmap`, { params });
  return response.data;
};

/**
 * Get language statistics
 */
export const getLanguageStats = async (publicProfileId) => {
  const response = await axios.get(`${API_URL}/profile/${publicProfileId}/languages`);
  return response.data;
};

/**
 * Get recent solved problems
 */
export const getRecentActivity = async (publicProfileId, limit = 10) => {
  const response = await axios.get(`${API_URL}/profile/${publicProfileId}/recent`, {
    params: { limit },
  });
  return response.data;
};

/**
 * Change profile ID (requires auth)
 */
export const changeProfileId = async (newProfileId) => {
  const response = await axios.patch(
    `${API_URL}/profile/change-id`,
    { newProfileId },
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Update profile info (requires auth)
 */
export const updateProfile = async (profileData) => {
  const response = await axios.patch(
    `${API_URL}/profile/update`,
    profileData,
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Get user preferences (requires auth)
 */
export const getPreferences = async () => {
  const response = await axios.get(`${API_URL}/preferences`, {
    withCredentials: true,
  });
  return response.data;
};

/**
 * Update theme preferences (requires auth)
 */
export const updateTheme = async (themeData) => {
  const response = await axios.patch(
    `${API_URL}/preferences/theme`,
    themeData,
    { withCredentials: true }
  );
  return response.data;
};

/**
 * Create a new profile (requires auth)
 */
export const createProfile = async () => {
  const response = await axios.post(
    `${API_URL}/profile/create`,
    {},
    { withCredentials: true }
  );
  return response.data;
};
