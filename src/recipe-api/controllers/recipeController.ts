import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Recipe, type Ingredient, type IRecipe } from "../models/Recipe";
import { type IUser } from "../models/User";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload";
import { paginate } from "../utils/paginate";

const SORTABLE_FIELDS = ["createdAt", "averageRating", "title", "prepTime"] as const;
type SortField = (typeof SORTABLE_FIELDS)[number];
const DEFAULT_SORT: Record<SortField, 1 | -1> = {
  createdAt: -1,
  averageRating: -1,
  title: 1,
  prepTime: 1,
};
const isSortField = (value: unknown): value is SortField => {
  return typeof value === "string" && (SORTABLE_FIELDS as readonly string[]).includes(value);
};

type PopulatedAuthor = Pick<IUser, "_id" | "name" | "avatar">;
export type PopulatedRecipe = Omit<IRecipe, "author"> & { author: PopulatedAuthor };

interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

const validateIngredients = (raw: unknown): ValidationResult<Ingredient[]> => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "At least one ingredient is required" };
  }

  const result: Ingredient[] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as Record<string, unknown>;
    if (!item || typeof item !== "object") {
      return { ok: false, error: `Ingredient ${i + 1}: must be an object` };
    }

    const kind = item.kind;

    if (kind === "measured") {
      if (typeof item.name !== "string" || item.name.trim().length === 0) {
        return { ok: false, error: `Ingredient ${i + 1}: name required` };
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return { ok: false, error: `Ingredient ${i + 1}: positive quantity required` };
      }
      if (typeof item.unit !== "string" || item.unit.trim().length === 0) {
        return { ok: false, error: `Ingredient ${i + 1}: unit required` };
      }
      result.push({
        kind: "measured",
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit.trim(),
      });
    } else if (kind === "toTaste") {
      if (typeof item.name !== "string" || item.name.trim().length === 0) {
        return { ok: false, error: `Ingredient ${i + 1}: name required` };
      }
      result.push({ kind: "toTaste", name: item.name.trim() });
    } else if (kind === "section") {
      if (typeof item.title !== "string" || item.title.trim().length === 0) {
        return { ok: false, error: `Ingredient ${i + 1}: section title required` };
      }
      result.push({ kind: "section", title: item.title.trim() });
    } else {
      const _exhaustive: never = kind as never;
      return { ok: false, error: `Ingredient ${i + 1}: unknown kind "${String(kind)}"` };
    }
  }

  return { ok: true, value: result };
};

interface RawStep {
  order?: unknown;
  instruction?: unknown;
  duration?: unknown;
}

const validateSteps = (raw: unknown): ValidationResult<IRecipe["steps"]> => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "At least one step is required" };
  }

  const result: IRecipe["steps"] = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] as RawStep;
    if (!item || typeof item !== "object") {
      return { ok: false, error: `Step ${i + 1}: must be an object` };
    }
    if (typeof item.instruction !== "string" || item.instruction.trim().length === 0) {
      return { ok: false, error: `Step ${i + 1}: instruction required` };
    }

    const duration = typeof item.duration === "number" && item.duration >= 0 ? item.duration : undefined;

    result.push({
      order: typeof item.order === "number" ? item.order : i + 1,
      instruction: item.instruction.trim(),
      ...(duration !== undefined ? { duration } : {}),
    });
  }

  return { ok: true, value: result };
};

export const createRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const ingredientsResult = validateIngredients(req.body.ingredients);
    if (!ingredientsResult.ok) {
      res.status(400).json({ success: false, error: ingredientsResult.error });
      return;
    }

    const stepsResult = validateSteps(req.body.steps);
    if (!stepsResult.ok) {
      res.status(400).json({ success: false, error: stepsResult.error });
      return;
    }

    const { title, description, tags, prepTime, cookTime, servings, difficulty } = req.body as {
      title?: string;
      description?: string;
      tags?: string[];
      prepTime?: number;
      cookTime?: number;
      servings?: number;
      difficulty?: string;
    };

    if (!title || typeof title !== "string") {
      res.status(400).json({ success: false, error: "Title is required" });
      return;
    }
    if (!description || typeof description !== "string") {
      res.status(400).json({ success: false, error: "Description is required" });
      return;
    }
    if (typeof prepTime !== "number" || prepTime < 0) {
      res.status(400).json({ success: false, error: "prepTime must be a non-negative number" });
      return;
    }
    if (typeof cookTime !== "number" || cookTime < 0) {
      res.status(400).json({ success: false, error: "cookTime must be a non-negative number" });
      return;
    }
    if (typeof servings !== "number" || servings < 1) {
      res.status(400).json({ success: false, error: "servings must be at least 1" });
      return;
    }

    const validDifficulties = ["easy", "medium", "hard"] as const;
    const finalDifficulty =
      typeof difficulty === "string" && (validDifficulties as readonly string[]).includes(difficulty)
        ? (difficulty as IRecipe["difficulty"])
        : "medium";

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const images: IRecipe["images"] = [];
    for (const file of files) {
      const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, "recipe-api/recipes");
      images.push({ url: uploaded.url, publicId: uploaded.publicId });
    }

    const recipe = await Recipe.create({
      author: req.user.id,
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredientsResult.value,
      steps: stepsResult.value,
      images,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).toLowerCase().trim()) : [],
      prepTime,
      cookTime,
      servings,
      difficulty: finalDifficulty,
    });

    res.status(201).json({ success: true, data: { recipe } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to create recipe" });
  }
};

export const listRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as Record<string, string | undefined>;

    const q = query.q?.trim();
    const tag = query.tag ? query.tag.trim().toLowerCase() : undefined;
    const difficulty = query.difficulty?.trim();
    const author = query.author?.trim();

    const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "10", 10) || 10));

    const sortParam = query.sort;
    const sortField: SortField = isSortField(sortParam) ? sortParam : "createdAt";

    const orderParam = query.order;
    const sortDirection: 1 | -1 = orderParam === "asc" ? 1 : orderParam === "desc" ? -1 : DEFAULT_SORT[sortField];

    const filter: Record<string, unknown> = {};

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (author && Types.ObjectId.isValid(author)) {
      filter.author = author;
    }
    if (q) {
      filter.$text = { $search: q };
    }

    const recipes = await Recipe.find(filter).sort({ [sortField]: sortDirection }).populate<{ author: PopulatedAuthor }>("author", "_id name avatar");

    const populatedRecipes = recipes as unknown as PopulatedRecipe[];
    const paginated = paginate(populatedRecipes, { page, limit });

    res.status(200).json({ success: true, data: paginated });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to list recipes" });
  }
};

export const getRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid recipe ID" });
      return;
    }

    const recipe = await Recipe.findById(id).populate<{ author: PopulatedAuthor }>("author", "_id name avatar");
    if (!recipe) {
      res.status(404).json({ success: false, error: "Recipe not found" });
      return;
    }

    res.status(200).json({ success: true, data: { recipe: recipe as unknown as PopulatedRecipe } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to fetch recipe" });
  }
};

export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid recipe ID" });
      return;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ success: false, error: "Recipe not found" });
      return;
    }

    if (recipe.author.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: "You can only update your own recipes" });
      return;
    }

    const { title, description, tags, prepTime, cookTime, servings, difficulty } = req.body as {
      title?: string;
      description?: string;
      tags?: string[];
      prepTime?: number;
      cookTime?: number;
      servings?: number;
      difficulty?: string;
    };

    if (typeof title === "string" && title.trim()) recipe.title = title.trim();
    if (typeof description === "string" && description.trim()) recipe.description = description.trim();
    if (Array.isArray(tags)) recipe.tags = tags.map((t) => String(t).toLowerCase().trim());
    if (typeof prepTime === "number" && prepTime >= 0) recipe.prepTime = prepTime;
    if (typeof cookTime === "number" && cookTime >= 0) recipe.cookTime = cookTime;
    if (typeof servings === "number" && servings >= 1) recipe.servings = servings;
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      recipe.difficulty = difficulty as IRecipe["difficulty"];
    }

    if (req.body.ingredients !== undefined) {
      const ingResult = validateIngredients(req.body.ingredients);
      if (!ingResult.ok) {
        res.status(400).json({ success: false, error: ingResult.error });
        return;
      }
      recipe.ingredients = ingResult.value!;
    }

    if (req.body.steps !== undefined) {
      const stepsResult = validateSteps(req.body.steps);
      if (!stepsResult.ok) {
        res.status(400).json({ success: false, error: stepsResult.error });
        return;
      }
      recipe.steps = stepsResult.value!;
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    for (const file of files) {
      const uploaded = await uploadToCloudinary(file.buffer, file.mimetype, "recipe-api/recipes");
      recipe.images.push({ url: uploaded.url, publicId: uploaded.publicId });
    }

    await recipe.save();

    res.status(200).json({ success: true, data: { recipe } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to update recipe" });
  }
};

export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Not authenticated" });
      return;
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, error: "Invalid recipe ID" });
      return;
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      res.status(404).json({ success: false, error: "Recipe not found" });
      return;
    }

    if (recipe.author.toString() !== req.user.id) {
      res.status(403).json({ success: false, error: "You can only delete your own recipes" });
      return;
    }

    for (const image of recipe.images) {
      await deleteFromCloudinary(image.publicId);
    }

    await recipe.deleteOne();

    res.status(200).json({ success: true, data: { message: "Recipe deleted" } });
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to delete recipe" });
  }
};