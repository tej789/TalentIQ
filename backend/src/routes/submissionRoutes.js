import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  submitCode,
  getSubmission,
  getMySubmissions,
  getPreferredLanguage,
} from "../controllers/submissionController.js";

const router = express.Router();

// Get all submissions for the logged-in user (must be before /:problemId)
router.get("/my-submissions", protectRoute, getMySubmissions);

// Get user's preferred language
router.get("/preferred-language", protectRoute, getPreferredLanguage);

// Save/update user's code submission
router.post("/:problemId", protectRoute, submitCode);

// Get user's submission for a specific problem
router.get("/:problemId", protectRoute, getSubmission);

export default router;
