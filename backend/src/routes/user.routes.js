import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { updateProfile, getUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

// Update profile
router.put("/update-profile", protectRoute, updateProfile);

// Get user profile
router.get("/profile", protectRoute, getUserProfile);

export default router; 