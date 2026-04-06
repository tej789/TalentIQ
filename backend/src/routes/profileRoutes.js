/**
 * Profile Routes
 * 
 * Endpoints for user profile operations
 */

import express from "express";
import {
  getProfile,
  getStats,
  getHeatmap,
  getLanguages,
  getRecentActivity,
  changeProfileId,
  updateProfile,
  createProfile,
  getMyProfileId,
} from "../controllers/profileController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// PROTECTED ROUTES (require authentication) - MUST come before dynamic routes
router.get("/my-profile-id", protectRoute, getMyProfileId);
router.post("/create", protectRoute, createProfile);
router.patch("/change-id", protectRoute, changeProfileId);
router.patch("/update", protectRoute, updateProfile);

// PUBLIC ROUTES (accessible via public profile ID) - Dynamic routes come after
router.get("/:publicProfileId", getProfile);
router.get("/:publicProfileId/stats", getStats);
router.get("/:publicProfileId/heatmap", getHeatmap);
router.get("/:publicProfileId/languages", getLanguages);
router.get("/:publicProfileId/recent", getRecentActivity);

export default router;
