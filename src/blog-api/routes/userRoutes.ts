import { Router } from "express";
import {
  getUserProfile,
  getUserPosts,
  getAllUsers,
} from "../controllers/userController";

const router = Router();

router.get("/", getAllUsers);

router.get("/:id", getUserProfile);
router.get("/:id/posts", getUserPosts);

export default router;
