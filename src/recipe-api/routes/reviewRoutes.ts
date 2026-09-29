import { Router } from "express";
import {
  addReview,
  updateReview,
  deleteReview,
  listReviewsForRecipe,
} from "../controllers/reviewController";
import { protect } from "../middleware/authMiddleware";

export const recipeReviewRouter = Router({ mergeParams: true });

recipeReviewRouter.get("/", listReviewsForRecipe);

recipeReviewRouter.post("/", protect, addReview);

export const reviewRouter = Router();

reviewRouter.patch("/:id", protect, updateReview);
reviewRouter.delete("/:id", protect, deleteReview);

