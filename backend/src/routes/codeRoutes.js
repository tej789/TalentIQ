import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  saveCodeDraft,
  loadCodeDraft,
  deleteCodeDraft,
} from "../controllers/codeController.js";

const router = express.Router();

/**
 * Code Draft Routes
 * 
 * All routes require authentication.
 * These routes are optimized for auto-save functionality.
 */

// Apply authentication middleware to all routes
router.use(...protectRoute);

/**
 * POST /api/code/save
 * Save or update user's code draft
 * Body: { problemId, language, code }
 */
router.post("/save", saveCodeDraft);

/**
 * GET /api/code/load/:problemId
 * Load user's code draft
 * Query params: ?language=javascript (optional)
 */
router.get("/load/:problemId", loadCodeDraft);

/**
 * DELETE /api/code/:problemId
 * Delete user's code draft
 * Query params: ?language=javascript (optional - deletes all if not specified)
 */
router.delete("/:problemId", deleteCodeDraft);

export default router;
