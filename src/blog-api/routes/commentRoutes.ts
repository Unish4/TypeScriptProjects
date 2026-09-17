import { Router } from "express";
import {
  createComment,
  getPostComments,
  updateComment,
  deleteComment,
} from "../controllers/commentController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router
  .route("/posts/:postId/comments")
  .get(getPostComments)
  .post(protect, createComment);

router
  .route("/comments/:id")
  .patch(protect, updateComment)
  .delete(protect, deleteComment);

export default router;
