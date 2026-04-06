import Problem from "../models/Problem.js";
import User from "../models/User.js";

/**
 * @route   POST /api/admin/problem
 * @desc    Create a new problem (Admin Only)
 * @access  Private/Admin
 */
export const createProblem = async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      category,
      constraints,
      examples,
      testCases,
      starterCode,
    } = req.body;

    // Validate required fields
    if (!title || !description || !difficulty) {
      return res.status(400).json({
        message: "Title, description, and difficulty are required",
      });
    }

    // Generate slug from title
    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const slug = generateSlug(title);

    // Check if problem already exists
    const existingProblem = await Problem.findOne({ $or: [{ title }, { slug }] });
    if (existingProblem) {
      return res.status(400).json({
        message: "Problem with this title or slug already exists",
      });
    }

    // Create new problem
    const problem = new Problem({
      title,
      slug,
      description,
      difficulty,
      category: category || "Algorithms",
      constraints: constraints || [],
      examples: examples || [],
      testCases: testCases || [],
      starterCode: starterCode || {
        javascript: "",
        python: "",
        java: "",
      },
      createdBy: req.user._id,
    });

    await problem.save();

    res.status(201).json({
      message: "Problem created successfully",
      problem,
    });
  } catch (error) {
    console.error("Error in createProblem controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   PUT /api/admin/problem/:id
 * @desc    Update an existing problem (Admin Only)
 * @access  Private/Admin
 */
export const updateProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const problem = await Problem.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json({
      message: "Problem updated successfully",
      problem,
    });
  } catch (error) {
    console.error("Error in updateProblem controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   DELETE /api/admin/problem/:id
 * @desc    Delete a problem (Admin Only)
 * @access  Private/Admin
 */
export const deleteProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await Problem.findByIdAndDelete(id);

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json({
      message: "Problem deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteProblem controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private/Admin
 */
export const getAdminDashboard = async (req, res) => {
  try {
    // Total problems count
    const totalProblems = await Problem.countDocuments();

    // Total submissions across all users
    const users = await User.find().select("submissions");
    const totalSubmissions = users.reduce(
      (acc, user) => acc + user.submissions.length,
      0
    );

    // Get problems with their submission counts
    const problems = await Problem.find()
      .select("title difficulty totalSubmissions acceptedSubmissions")
      .sort({ totalSubmissions: -1 });

    // Difficulty breakdown
    const difficultyStats = await Problem.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      statistics: {
        totalProblems,
        totalSubmissions,
        difficultyBreakdown: difficultyStats,
      },
      problems,
    });
  } catch (error) {
    console.error("Error in getAdminDashboard controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/admin/problems
 * @desc    Get all problems with detailed info (Admin Only)
 * @access  Private/Admin
 */
export const getAllProblemsAdmin = async (req, res) => {
  try {
    const problems = await Problem.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      problems,
      total: problems.length,
    });
  } catch (error) {
    console.error("Error in getAllProblemsAdmin controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/admin/problem/:id
 * @desc    Get single problem with full details including test cases (Admin Only)
 * @access  Private/Admin
 */
export const getProblemByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let problem;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      problem = await Problem.findById(id);
    } else {
      problem = await Problem.findOne({ slug: id });
    }

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    res.status(200).json({ problem });
  } catch (error) {
    console.error("Error in getProblemByIdAdmin controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @route   GET /api/admin/submissions
 * @desc    Get all submissions with user details (Admin Only)
 * @access  Private/Admin
 */
export const getAllSubmissions = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email submissions")
      .populate("submissions.problemId", "title difficulty");

    // Flatten all submissions
    const allSubmissions = [];
    users.forEach((user) => {
      user.submissions.forEach((sub) => {
        allSubmissions.push({
          user: {
            name: user.name,
            email: user.email,
          },
          problemTitle: sub.problemId?.title,
          problemDifficulty: sub.problemId?.difficulty,
          language: sub.language,
          verdict: sub.verdict,
          submittedAt: sub.submittedAt,
        });
      });
    });

    // Sort by submission date (most recent first)
    allSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);

    res.status(200).json({
      submissions: allSubmissions,
      total: allSubmissions.length,
    });
  } catch (error) {
    console.error("Error in getAllSubmissions controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
