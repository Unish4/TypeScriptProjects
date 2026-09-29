import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Review, type IReview } from "../models/Review";
import { Recipe } from "../models/Recipe";
import { type IUser } from "../models/User";
import { paginate } from "../utils/paginate";

type PopulatedReviewUser = Pick<IUser, "_id" | "name" | "avatar">;
export type PopulatedReview = Omit<IReview, "user"> & { user: PopulatedReviewUser };

const recomputeRecipeRating = async (recipeId: string): Promise<void> => {
  const results = await Review.aggregate<{
    _id: null;
    averageRating: number;
    reviewCount: number;
  }>([
    { $match: { recipe: new Types.ObjectId(recipeId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const stats = results[0] ?? { averageRating: 0, reviewCount: 0 };
  const rounded = Math.round((stats.averageRating ?? 0) * 10) / 10;

  await Recipe.updateOne({ _id: recipeId }, { $set: { averageRating: rounded, reviewCount: stats.reviewCount } });
};

export const addReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const { recipeId } = req.params;
    if (!Types.ObjectId.isValid(recipeId)) {
      res.status(400).json({ success: false, error: "Invalid recipe ID" });
      return;
    }

    const recipeExists = await Recipe.exists({ _id: recipeId });
    if (!recipeExists) {
      res.status(404).json({ success: false, error: "Recipe not found" });
      return;
    }

    const { rating, comment } = req.body as { rating?: unknown; comment?: unknown };
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: "Rating must be a number between 1 and 5" });
      return;
    }
    if (typeof comment !== "string" || comment.trim().length === 0) {
      res.status(400).json({ success: false, error: "Comment is required" });
      return;
    }

    const review = await Review.create({ recipe: recipeId, user: req.user.id, rating, comment: comment.trim() });

    await recomputeRecipeRating(recipeId);

    res.status(201).json({ success: true, data: { review } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000) {
      res.status(409).json({ success: false, error: "You have already reviewed this recipe" });
      return;
    }

    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to add review" });
  }
};

export const updateReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid review ID" });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }

    if (review.user.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: "You can only update your own reviews" });
      return;
    }

    const { rating, comment } = req.body as { rating?: unknown; comment?: unknown };

    if (rating !== undefined) {
      if (typeof rating !== "number" || rating < 1 || rating > 5) {
        res.status(400).json({ success: false, error: "Rating must be a number between 1 and 5" });
        return;
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      if (typeof comment !== "string" || comment.trim().length === 0) {
        res.status(400).json({ success: false, error: "Comment cannot be empty" });
        return;
      }
      review.comment = comment.trim();
    }

    await review.save();

    await recomputeRecipeRating(review.recipe.toString());

    res.status(200).json({ success: true, data: { review } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to update review" });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid review ID" });
      return;
    }

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, error: "Review not found" });
      return;
    }

    if (review.user.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: "You can only delete your own reviews" });
      return;
    }

    const recipeId = review.recipe.toString();

    await review.deleteOne();

    await recomputeRecipeRating(recipeId);

    res.status(200).json({ success: true, data: { message: "Review deleted" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to delete review" });
  }
};

export const listReviewsForRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipeId } = req.params;
    if (!Types.ObjectId.isValid(recipeId)) {
      res.status(400).json({ success: false, error: "Invalid recipe ID" });
      return;
    }

    const query = req.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? "10", 10) || 10));

    const reviews = await Review.find({ recipe: recipeId }).sort({ createdAt: -1 }).populate<{ user: PopulatedReviewUser }>("user", "_id name avatar");

    const populatedReviews = reviews as unknown as PopulatedReview[];
    const paginated = paginate(populatedReviews, { page, limit });

    res.status(200).json({ success: true, data: paginated });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to list reviews" });
  }
};