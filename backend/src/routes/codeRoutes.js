import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  saveCodeDraft,
  loadCodeDraft,
  deleteCodeDraft,
  runCodeExecution,
  getCodeExecutionResult,
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

/**
 * POST /api/code/run
 * Proxy to Judge0 to create a submission (optionally waiting for result)
 */
router.post("/run", runCodeExecution);

/**
 * GET /api/code/result/:token
 * Fetch Judge0 result for an existing submission
 */
router.get("/result/:token", getCodeExecutionResult);

export default router;
