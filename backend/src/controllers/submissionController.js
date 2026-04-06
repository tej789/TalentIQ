import User from "../models/User.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { processSubmission } from "../services/profileService.js";

/**
 * @route   POST /api/submission/:problemId
 * @desc    Save user's code submission (ONLY ON SUBMIT - NO AUTOSAVE)
 * @access  Private
 */
export const submitCode = async (req, res) => {
  try {
    const { problemId } = req.params;
    const { language, code, verdict } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!language || !code) {
      return res.status(400).json({ message: "Language and code are required" });
    }

    // Check if problem exists (try by ID first, then by slug)
    let problem = null;
    if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid ObjectId format
      problem = await Problem.findById(problemId);
    } else {
      // Try to find by slug
      problem = await Problem.findOne({ slug: problemId });
    }
    
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has a submission for this problem
    const existingSubmissionIndex = user.submissions.findIndex(
      (sub) => sub.problemId.toString() === problem._id.toString()
    );

    const submissionData = {
      problemId: problem._id,
      language,
      code,
      verdict: verdict || "Accepted",
      submittedAt: new Date(),
    };

    if (existingSubmissionIndex !== -1) {
      // Update existing submission (overwrite)
      user.submissions[existingSubmissionIndex] = submissionData;
    } else {
      // Add new submission
      user.submissions.push(submissionData);
    }

    // Update language statistics
    if (!user.languageStats) {
      user.languageStats = { javascript: 0, python: 0, java: 0 };
    }
    user.languageStats[language] = (user.languageStats[language] || 0) + 1;

    // Update preferred language to the most used one
    const mostUsedLanguage = Object.entries(user.languageStats).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];
    user.preferredLanguage = mostUsedLanguage;

    await user.save();

    // Update problem statistics
    problem.totalSubmissions += 1;
    if (submissionData.verdict === "Accepted") {
      problem.acceptedSubmissions += 1;
    }
    await problem.save();

    // Create submission record in Submission collection
    const submission = new Submission({
      user: userId,
      problem: problem._id,
      code,
      language,
      verdict: submissionData.verdict,
      submittedAt: new Date(),
    });
    await submission.save();

    // Update profile stats (LeetCode-style logic)
    try {
      await processSubmission(
        userId.toString(),
        problem._id.toString(),
        language,
        submissionData.verdict
      );
    } catch (profileError) {
      console.error("Error updating profile:", profileError);
      // Don't fail the submission if profile update fails
    }

    res.status(200).json({
      message: "Code submitted successfully",
      submission: submissionData,
    });
  } catch (error) {
    console.error("Error in submitCode controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/submission/:problemId
 * @desc    Get user's saved submission for a specific problem
 * @access  Private
 */
export const getSubmission = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user._id;

    // Find the problem first (by ID or slug)
    let problem = null;
    if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(problemId);
    } else {
      problem = await Problem.findOne({ slug: problemId });
    }
    
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Find user with submissions
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find submission for the specific problem using the actual problem._id
    const submission = user.submissions.find(
      (sub) => sub.problemId.toString() === problem._id.toString()
    );

    if (!submission) {
      // User hasn't submitted code for this problem yet
      return res.status(200).json({
        submission: null,
        message: "No submission found for this problem",
      });
    }

    res.status(200).json({
      submission: {
        problemId: submission.problemId,
        language: submission.language,
        code: submission.code,
        verdict: submission.verdict,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error in getSubmission controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/submissions/my-submissions
 * @desc    Get all submissions for the logged-in user
 * @access  Private
 */
export const getMySubmissions = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "submissions.problemId",
      "title difficulty"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      submissions: user.submissions,
      total: user.submissions.length,
    });
  } catch (error) {
    console.error("Error in getMySubmissions controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/submissions/preferred-language
 * @desc    Get user's preferred language based on usage
 * @access  Private
 */
export const getPreferredLanguage = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("preferredLanguage languageStats");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      preferredLanguage: user.preferredLanguage || "javascript",
      languageStats: user.languageStats || { javascript: 0, python: 0, java: 0 },
    });
  } catch (error) {
    console.error("Error in getPreferredLanguage controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
