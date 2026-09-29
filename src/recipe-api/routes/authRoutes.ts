import { Router } from "express";
import {
  register,
  login,
  getMe,
  getProfile,
  updateProfile,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/multerMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, getMe);

router.patch("/profile", protect, upload.single("avatar"), updateProfile);

router.get("/profile/:id", getProfile);

export default router;
