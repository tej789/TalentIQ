/**
 * Judge Routes
 * 
 * POST /api/judge/run     - Run code against examples
 * POST /api/judge/submit  - Submit code against hidden test cases
 * GET  /api/judge/submissions/:problemId - Get submission history
 */

import express from 'express';
import { protectRoute } from '../middleware/protectRoute.js';
import { runCode, submitCode, getSubmissions, sandboxExecute } from './judgeController.js';

const router = express.Router();

// Sandbox execute - run arbitrary code without test cases (for sessions)
router.post('/execute', sandboxExecute);

// Run code against examples (visible test cases) - no auth needed
router.post('/run', runCode);

// Submit code against hidden test cases - requires auth to save submission
router.post('/submit', protectRoute, submitCode);

// Get submission history for a problem - requires auth
router.get('/submissions/:problemId', protectRoute, getSubmissions);

export default router;
