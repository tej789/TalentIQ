import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  getAllProblems,
  getProblemById,
  getProblemTestCases,
} from "../controllers/problemController.js";

const router = express.Router();

// Get all problems (public)
router.get("/", getAllProblems);

// Get a single problem by ID (public)
router.get("/:id", getProblemById);

// Get test cases for a problem (protected - for code execution)
router.get("/:id/test-cases", protectRoute, getProblemTestCases);

export default router;
