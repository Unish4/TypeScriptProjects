import { Router } from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
} from "../controllers/postController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.route("/").get(getPosts).post(protect, createPost);

router
  .route("/:id")
  .get(getPost)
  .patch(protect, updatePost)
  .delete(protect, deletePost);

export default router;
