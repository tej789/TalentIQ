import axios from "../lib/axios";

/**
 * Code Draft API
 * 
 * These functions handle auto-save functionality for the code editor.
 * Used for persisting user's code across sessions.
 */

/**
 * Save code draft to server
 * 
 * @param {string} problemId - Problem ID or slug
 * @param {string} language - Programming language (javascript, python, java)
 * @param {string} code - The code content to save
 * @returns {Promise} - Response with saved draft info
 */
export const saveCodeDraft = async (problemId, language, code) => {
  const { data } = await axios.post("/code/save", {
    problemId,
    language,
    code,
  });
  return data;
};

/**
 * Load code draft from server
 * 
 * @param {string} problemId - Problem ID or slug
 * @param {string} language - Optional: specific language to load
 * @returns {Promise} - Response with draft(s)
 */
export const loadCodeDraft = async (problemId, language = null) => {
  const url = language
    ? `/code/load/${problemId}?language=${language}`
    : `/code/load/${problemId}`;
  const { data } = await axios.get(url);
  return data;
};

/**
 * Delete code draft
 * 
 * @param {string} problemId - Problem ID or slug
 * @param {string} language - Optional: specific language to delete
 * @returns {Promise} - Response confirming deletion
 */
export const deleteCodeDraft = async (problemId, language = null) => {
  const url = language
    ? `/code/${problemId}?language=${language}`
    : `/code/${problemId}`;
  const { data } = await axios.delete(url);
  return data;
};
