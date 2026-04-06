import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import {
  checkActiveSession,
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
  leaveSessionHTTP,
  validateSessionPassword,
  getSessionHistory,
} from "../controllers/sessionController.js";

const router = express.Router();

router.post("/", protectRoute, createSession);
router.get("/check-active", protectRoute, checkActiveSession);
router.get("/active", protectRoute, getActiveSessions);
router.get("/my-recent", protectRoute, getMyRecentSessions);

router.get("/:id", protectRoute, getSessionById);
router.get("/:id/history", protectRoute, getSessionHistory);
router.post("/:id/join", protectRoute, joinSession);
router.post("/:id/validate-password", protectRoute, validateSessionPassword);
router.post("/:id/leave", protectRoute, leaveSessionHTTP);
router.post("/:id/end", protectRoute, endSession);

export default router;
