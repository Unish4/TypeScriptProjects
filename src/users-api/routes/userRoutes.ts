import { Router } from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register)
router.post("/login", login)
router.get("/profile", protect, getProfile)
router.patch("/profile", protect, updateProfile)
router.get("/", protect, getAllUsers)

export default router