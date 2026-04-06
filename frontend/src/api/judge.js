/**
 * Judge API
 * 
 * Functions for running and submitting code to the judge.
 */

import axiosInstance from "../lib/axios";

/**
 * Run code against examples (visible test cases)
 * 
 * @param {string} problemId - Problem ID
 * @param {string} code - User's code
 * @param {string} language - Programming language (javascript, python, java)
 * @returns {Promise<Object>} - Results for each example
 */
export const runCode = async (problemId, code, language) => {
  const response = await axiosInstance.post("/judge/run", {
    problemId,
    code,
    language,
  });
  return response.data;
};

/**
 * Submit code against hidden test cases
 * 
 * @param {string} problemId - Problem ID
 * @param {string} code - User's code
 * @param {string} language - Programming language (javascript, python, java)
 * @returns {Promise<Object>} - Verdict and details
 */
export const submitCode = async (problemId, code, language) => {
  const response = await axiosInstance.post("/judge/submit", {
    problemId,
    code,
    language,
  });
  return response.data;
};

/**
 * Get submission history for a problem
 * 
 * @param {string} problemId - Problem ID
 * @returns {Promise<Object>} - List of submissions
 */
export const getSubmissions = async (problemId) => {
  const response = await axiosInstance.get(`/judge/submissions/${problemId}`);
  return response.data;
};

export default { runCode, submitCode, getSubmissions };
