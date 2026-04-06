import Problem from "../models/Problem.js";

/**
 * @route   GET /api/problems
 * @desc    Get all problems (for problems list page)
 * @access  Public
 */
export const getAllProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .select("title difficulty category totalSubmissions acceptedSubmissions slug description starterCode")
      .sort({ createdAt: -1 });

    res.status(200).json({
      problems,
      total: problems.length,
    });
  } catch (error) {
    console.error("Error in getAllProblems controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/problems/:id
 * @desc    Get single problem details
 * @access  Public
 */
export const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let problem;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(id).select("-testCases");
    } else {
      problem = await Problem.findOne({ slug: id }).select("-testCases");
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json({ problem });
  } catch (error) {
    console.error("Error in getProblemById controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/problems/:id/test-cases
 * @desc    Get problem test cases (for code execution)
 * @access  Private
 */
export const getProblemTestCases = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let problem;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(id).select("testCases");
    } else {
      problem = await Problem.findOne({ slug: id }).select("testCases");
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    // Return only non-hidden test cases to users
    const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden);

    res.status(200).json({
      testCases: visibleTestCases,
    });
  } catch (error) {
    console.error("Error in getProblemTestCases controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
