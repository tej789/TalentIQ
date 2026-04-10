import CodeDraft from "../models/CodeDraft.js";
import Problem from "../models/Problem.js";
import axios from "axios";

// Public Judge0 CE instance (no API key required)
const JUDGE0_API_HOST = "judge0-ce.p.sulu.sh";
const JUDGE0_BASE_URL = `https://${JUDGE0_API_HOST}`;

// Map our language strings to Judge0 language IDs
const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
};

/**
 * Save Code Draft (Auto-Save)
 * 
 * @route   POST /api/code/save
 * @desc    Upsert user's code draft for a problem
 * @access  Private
 * 
 * This endpoint is designed for high-frequency calls (debounced on frontend).
 * Uses findOneAndUpdate with upsert for atomic operation.
 * No diff comparison - always overwrites with latest code.
 */
export const saveCodeDraft = async (req, res) => {
  try {
    const { problemId, language, code } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!problemId || !language || code === undefined) {
      return res.status(400).json({
        message: "problemId, language, and code are required",
      });
    }

    // Resolve problemId (could be slug or ObjectId)
    let problem;
    if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(problemId).select("_id");
    } else {
      problem = await Problem.findOne({ slug: problemId }).select("_id");
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    /**
     * Upsert Operation
     * 
     * - If draft exists: Update code and updatedAt
     * - If draft doesn't exist: Create new draft
     * 
     * Using findOneAndUpdate with upsert=true is atomic and efficient.
     * This is the same pattern used by LeetCode/HackerRank for auto-save.
     */
    const draft = await CodeDraft.findOneAndUpdate(
      {
        userId,
        problemId: problem._id,
        language,
      },
      {
        $set: {
          code,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,        // Create if doesn't exist
        new: true,           // Return updated document
        runValidators: true, // Validate before saving
      }
    );

    res.status(200).json({
      message: "Draft saved",
      draft: {
        id: draft._id,
        language: draft.language,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in saveCodeDraft:", error);
    res.status(500).json({ message: "Failed to save draft" });
  }
};

/**
 * Run code via Judge0 (RapidAPI)
 *
 * @route   POST /api/code/run
 * @desc    Create a Judge0 submission (optionally wait for result)
 * @access  Private
 *
 * Body can be either:
 * - { source_code, language_id, stdin?, wait? }
 * - { code, languageId, input?, wait? }
 */
export const runCodeExecution = async (req, res) => {
  try {
    const {
      source_code,
      language_id,
      stdin,
      // alternative field names
      code,
      languageId,
      input,
      language,
    } = req.body || {};

    const finalSource = source_code || code;

    // Normalize language (e.g., "Python", "PYTHON" → "python")
    const normalizedLang =
      typeof language === "string" ? language.toLowerCase() : undefined;

    const finalLanguageId =
      language_id ||
      languageId ||
      (normalizedLang ? languageMap[normalizedLang] : undefined);
    const finalStdin = stdin ?? input ?? null;

    if (!finalSource || !finalLanguageId) {
      return res.status(400).json({
        message:
          "source_code/code and language_id/languageId or language are required",
      });
    }

    // Always use wait=false for safety; frontend should poll /result/:token
    const url = `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`;

    const payload = {
      source_code: finalSource,
      language_id: finalLanguageId,
    };

    if (finalStdin !== null && finalStdin !== undefined) {
      payload.stdin = String(finalStdin);
    }

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data || {};

    const output =
      data.stdout || data.stderr || data.compile_output || null;

    // For wait=false this mainly returns a token, but we keep a
    // consistent, frontend-friendly shape.
    return res.status(200).json({
      token: data.token,
      output,
      error: data.stderr || null,
      status: data.status?.description || null,
      raw: data,
    });
  } catch (error) {
    console.error("Error calling Judge0 /submissions:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };

    return res.status(status).json({
      message: "Failed to run code via Judge0",
      error: data,
    });
  }
};

/**
 * Get Judge0 submission result by token
 *
 * @route   GET /api/code/result/:token
 * @desc    Fetch result for an existing Judge0 submission
 * @access  Private
 */
export const getCodeExecutionResult = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const url = `${JUDGE0_BASE_URL}/submissions/${encodeURIComponent(
      token
    )}?base64_encoded=false`;

    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = response.data || {};

    const output =
      data.stdout || data.stderr || data.compile_output || null;

    // Optional: status.id === 3 usually means success
    // const isSuccess = data.status?.id === 3;

    return res.status(200).json({
      token: token,
      output,
      error: data.stderr || null,
      status: data.status?.description || null,
      raw: data,
    });
  } catch (error) {
    console.error("Error calling Judge0 /submissions/{token}:", error.response?.data || error.message);

    const status = error.response?.status || 500;
    const data = error.response?.data || { message: error.message };

    return res.status(status).json({
      message: "Failed to fetch Judge0 result",
      error: data,
    });
  }
};

/**
 * Load Code Draft
 * 
 * @route   GET /api/code/load/:problemId
 * @desc    Fetch user's saved draft for a problem
 * @access  Private
 * 
 * Returns the draft for a specific language, or all drafts for the problem
 * if no language is specified.
 */
export const loadCodeDraft = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language } = req.query; // Optional: specific language
    const userId = req.user._id;

    // Resolve problemId (could be slug or ObjectId)
    let problem;
    if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(problemId).select("_id");
    } else {
      problem = await Problem.findOne({ slug: problemId }).select("_id");
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Build query
    const query = {
      userId,
      problemId: problem._id,
    };

    // If specific language requested, add to query
    if (language) {
      query.language = language;
    }

    /**
     * Fetch draft(s)
     * 
     * If language specified: returns single draft or null
     * If no language: returns all drafts for this problem (all languages)
     */
    if (language) {
      const draft = await CodeDraft.findOne(query).lean();
      
      return res.status(200).json({
        draft: draft
          ? {
              language: draft.language,
              code: draft.code,
              updatedAt: draft.updatedAt,
            }
          : null,
      });
    } else {
      // Return all language drafts for this problem
      const drafts = await CodeDraft.find(query)
        .sort({ updatedAt: -1 })
        .lean();

      // Convert to object keyed by language for easy access
      const draftsByLanguage = {};
      drafts.forEach((draft) => {
        draftsByLanguage[draft.language] = {
          code: draft.code,
          updatedAt: draft.updatedAt,
        };
      });

      return res.status(200).json({
        drafts: draftsByLanguage,
      });
    }
  } catch (error) {
    console.error("Error in loadCodeDraft:", error);
    res.status(500).json({ message: "Failed to load draft" });
  }
};

/**
 * Delete Code Draft
 * 
 * @route   DELETE /api/code/:problemId
 * @desc    Delete user's draft (optional - for cleanup)
 * @access  Private
 */
export const deleteCodeDraft = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language } = req.query;
    const userId = req.user._id;

    // Resolve problemId
    let problem;
    if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(problemId).select("_id");
    } else {
      problem = await Problem.findOne({ slug: problemId }).select("_id");
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const query = {
      userId,
      problemId: problem._id,
    };

    if (language) {
      query.language = language;
    }

    await CodeDraft.deleteMany(query);

    res.status(200).json({ message: "Draft deleted" });
  } catch (error) {
    console.error("Error in deleteCodeDraft:", error);
    res.status(500).json({ message: "Failed to delete draft" });
  }
};
