import express from "express";
import { protectRoute, adminOnly } from "../middleware/protectRoute.js";
import {
  createProblem,
  updateProblem,
  deleteProblem,
  getAdminDashboard,
  getAllProblemsAdmin,
  getProblemByIdAdmin,
  getAllSubmissions,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication + admin role
// protectRoute is an array, so we spread it
router.use(...protectRoute);
router.use(adminOnly);

// Dashboard stats
router.get("/dashboard", getAdminDashboard);

// Problem management
router.post("/problem", createProblem);
router.put("/problem/:id", updateProblem);
router.delete("/problem/:id", deleteProblem);
router.get("/problems", getAllProblemsAdmin);
router.get("/problem/:id", getProblemByIdAdmin);

// Submissions management
router.get("/submissions", getAllSubmissions);

export default router;
