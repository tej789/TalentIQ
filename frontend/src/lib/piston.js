// Code execution via backend judge sandbox
import axiosInstance from "./axios";

const SUPPORTED_LANGUAGES = ["javascript", "python", "java"];

/**
 * @param {string} language - programming language
 * @param {string} code - source code to execute
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
      };
    }

    const response = await axiosInstance.post("/judge/execute", {
      language,
      code,
    });

    const data = response.data;

    if (!data.success) {
      return {
        success: false,
        output: data.output || "",
        error: data.error,
      };
    }

    return {
      success: true,
      output: data.output || "No output",
    };
  } catch (error) {
    const msg =
      error.response?.data?.error || error.message || "Failed to execute code";
    return {
      success: false,
      error: msg,
    };
  }
}
