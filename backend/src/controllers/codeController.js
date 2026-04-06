import CodeDraft from "../models/CodeDraft.js";
import Problem from "../models/Problem.js";

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
