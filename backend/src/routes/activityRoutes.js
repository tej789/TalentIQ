/**
 * Activity Routes
 * 
 * API endpoints for user activity and contribution heatmap.
 */

import express from "express";
import { getUserHeatmap, getUserStats } from "../controllers/activityController.js";

const router = express.Router();

// GET /api/activity/heatmap/:userId - Full heatmap data
router.get("/heatmap/:userId", getUserHeatmap);

// GET /api/activity/stats/:userId - Summary stats only
router.get("/stats/:userId", getUserStats);

export default router;
