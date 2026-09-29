import { Router } from "express";
import {
  createRecipe,
  listRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController";
import { protect } from "../middleware/authMiddleware";
import { upload } from "../middleware/multerMiddleware";
import { recipeReviewRouter } from "./reviewRoutes";

const router = Router();

router.get("/", listRecipes);

router.use("/:recipeId/reviews", recipeReviewRouter);

router.get("/:id", getRecipe);

router.post(
  "/",
  protect,
  upload.array("images", 5),
  createRecipe,
);

router.patch(
  "/:id",
  protect,
  upload.array("images", 5),
  updateRecipe,
);

router.delete("/:id", protect, deleteRecipe);

export default router;