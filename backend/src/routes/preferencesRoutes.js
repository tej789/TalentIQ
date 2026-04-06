/**
 * Preferences Routes
 * 
 * Endpoints for user preference management
 */

import express from "express";
import {
  getPreferences,
  updateTheme,
  updateEditor,
  updateNotifications,
  updatePrivacy,
} from "../controllers/preferencesController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

// All preferences routes require authentication
router.use(protectRoute);

router.get("/", getPreferences);
router.patch("/theme", updateTheme);
router.patch("/editor", updateEditor);
router.patch("/notifications", updateNotifications);
router.patch("/privacy", updatePrivacy);

export default router;
