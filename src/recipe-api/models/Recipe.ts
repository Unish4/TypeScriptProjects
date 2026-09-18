import { Schema, model, type HydratedDocument, Types } from "mongoose";

export type Ingredient =
  | {
      kind: "measured";
      name: string;
      quantity: number;
      unit: string;
    }
  | { kind: "toTaste"; name: string }
  | { kind: "section"; title: string };

export type Difficulty = "easy" | "medium" | "hard";

export interface IRecipeStep {
  order: number;
  instruction: string;
  duration?: number; // minutes, optional
  image?: {
    url: string;
    publicId: string;
  };
}

export interface IRecipeImage {
  url: string;
  publicId: string;
}

export interface IRecipe {
  author: Types.ObjectId; // ref to User
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: IRecipeStep[];
  images: IRecipeImage[];
  tags: string[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: Difficulty;

  averageRating: number;
  reviewCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type RecipeDocument = HydratedDocument<IRecipe>;

const ingredientSchema = new Schema<Ingredient>(
  {
    kind: {
      type: String,
      required: true,
      enum: ["measured", "toTaste", "section"],
    },
    name: {
      type: String,
      trim: true,
    },
    quantity: { type: Number, min: 0 },
    unit: { type: String, trim: true },
    title: { type: String, trim: true },
  },
  {
    _id: false,
    discriminatorKey: "kind",
  },
);

const stepSchema = new Schema<IRecipeStep>(
  {
    order: { type: Number, required: true, min: 1 },
    instruction: { type: String, required: true, trim: true },
    duration: { type: Number, min: 0 },
    image: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { _id: false },
);

const imageSchema = new Schema<IRecipeImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const recipeSchema = new Schema<IRecipe>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title must be at most 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description too long"],
    },
    ingredients: {
      type: [ingredientSchema],
      required: true,
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length > 0,
        message: "At least one ingredient is required",
      },
    },
    steps: {
      type: [stepSchema],
      required: true,
      validate: {
        validator: (arr: unknown[]) => arr.length > 0,
        message: "At least one step is required",
      },
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    prepTime: { type: Number, required: true, min: 0 },
    cookTime: { type: Number, required: true, min: 0 },
    servings: { type: Number, required: true, min: 1 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"] as const,
      default: "medium",
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

recipeSchema.index({ title: "text", description: "text", tags: "text" });

export const Recipe = model<IRecipe>("Recipe", recipeSchema);
